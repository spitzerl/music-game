import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext) ? ext : '.mp3';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

function requireNonEmptyString(value, fieldName) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    const error = new Error(`Le champ ${fieldName} est requis`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

function requireHttpUrl(value, fieldName) {
  try {
    const parsed = new URL(requireNonEmptyString(value, fieldName));
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      const error = new Error(`Le champ ${fieldName} doit être une URL HTTP valide`);
      error.status = 400;
      throw error;
    }
    return parsed.toString();
  } catch (error) {
    if (error.status) {
      throw error;
    }
    const invalidUrlError = new Error(`Le champ ${fieldName} doit être une URL valide`);
    invalidUrlError.status = 400;
    throw invalidUrlError;
  }
}

export default function buildRoutes(gameService, ioNamespace) {
  const router = Router();

  router.get('/deezer/search', async (req, res, next) => {
    try {
      const queryText = requireNonEmptyString(req.query?.q, 'q');
      const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(queryText)}&limit=10`);

      if (!response.ok) {
        const error = new Error('Deezer indisponible');
        error.status = 502;
        throw error;
      }

      const payload = await response.json();
      const tracks = Array.isArray(payload?.data)
        ? payload.data
            .filter((track) => track?.preview)
            .map((track) => ({
              id: track.id,
              title: track.title,
              artist: track.artist?.name || 'Inconnu',
              preview: track.preview,
              link: track.link || null,
              cover: track.album?.cover_medium || null,
            }))
        : [];

      res.json({ tracks });
    } catch (error) {
      next(error);
    }
  });

  router.post('/sessions', async (req, res, next) => {
    try {
      const hostName = requireNonEmptyString(req.body?.hostName, 'hostName');
      const data = await gameService.createSession(hostName);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  });

  router.post('/sessions/:code/join', async (req, res, next) => {
    try {
      const playerName = requireNonEmptyString(req.body?.playerName, 'playerName');
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      const data = await gameService.joinSession(code, playerName);
      await gameService.broadcastState(code);
      ioNamespace.to(code).emit('sound:play', { type: 'join' });
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  });

  router.get('/sessions/:code', async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      const playerId = req.query.playerId || null;
      res.json(await gameService.getState(code, playerId));
    } catch (error) {
      next(error);
    }
  });

  router.post('/sessions/:code/config', async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      const state = await gameService.updateConfig(code, req.body);
      await gameService.broadcastState(code);
      res.json(state);
    } catch (error) {
      next(error);
    }
  });

  router.post('/sessions/:code/bots', async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      const state = await gameService.addBot(code);
      await gameService.broadcastState(code);
      ioNamespace.to(code).emit('sound:play', { type: 'join' });
      res.json(state);
    } catch (error) {
      next(error);
    }
  });

  router.post('/sessions/:code/start-selection', async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      const state = await gameService.startSelection(code);
      res.json(state);
    } catch (error) {
      next(error);
    }
  });

  router.post('/sessions/:code/musics', upload.single('audio'), async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      const playerId = Number.parseInt(requireNonEmptyString(req.body?.playerId, 'playerId'), 10);
      const title = requireNonEmptyString(req.body?.title, 'title');
      const artist = requireNonEmptyString(req.body?.artist, 'artist');

      if (!Number.isInteger(playerId) || playerId <= 0) {
        const error = new Error('playerId invalide');
        error.status = 400;
        throw error;
      }

      let filePath = null;
      if (req.file?.filename) {
        filePath = `/uploads/${req.file.filename}`;
      } else if (req.body?.deezerPreviewUrl) {
        filePath = requireHttpUrl(req.body.deezerPreviewUrl, 'deezerPreviewUrl');
      }

      if (!filePath) {
        const error = new Error('Le fichier audio est requis');
        error.status = 400;
        throw error;
      }

      const music = await gameService.addMusic(code, {
        playerId,
        title,
        artist,
        filePath,
      });

      await gameService.broadcastState(code);
      res.status(201).json(music);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/sessions/:code/musics/:musicId', async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      const musicId = Number.parseInt(requireNonEmptyString(req.params.musicId, 'musicId'), 10);
      const playerId = Number.parseInt(requireNonEmptyString(req.body?.playerId || req.query?.playerId, 'playerId'), 10);
      const state = await gameService.deleteMusic(code, musicId, playerId);
      await gameService.broadcastState(code);
      res.json(state);
    } catch (error) {
      next(error);
    }
  });

  router.post('/sessions/:code/start-voting', async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      await gameService.startVoting(code);
      const state = await gameService.getState(code);
      res.json(state);
    } catch (error) {
      next(error);
    }
  });

  router.post('/sessions/:code/votes', async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      const voterId = Number.parseInt(requireNonEmptyString(req.body?.voterId, 'voterId'), 10);
      const musicId = Number.parseInt(requireNonEmptyString(req.body?.musicId, 'musicId'), 10);
      const guessedPlayerId = Number.parseInt(requireNonEmptyString(req.body?.guessedPlayerId, 'guessedPlayerId'), 10);

      const state = await gameService.submitVote(code, voterId, musicId, guessedPlayerId);
      res.json(state);
    } catch (error) {
      next(error);
    }
  });

  router.post('/sessions/:code/finish', async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      const results = await gameService.finishSession(code);
      res.json(results);
    } catch (error) {
      next(error);
    }
  });

  router.post('/sessions/:code/reset', async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      const state = await gameService.resetSession(code);
      res.json(state);
    } catch (error) {
      next(error);
    }
  });

  router.get('/sessions/:code/results', async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      res.json(await gameService.getResults(code));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
