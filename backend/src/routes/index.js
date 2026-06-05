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

export default function buildRoutes(gameService, ioNamespace) {
  const router = Router();

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
      ioNamespace.to(code).emit('state:update', await gameService.getState(code));
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  });

  router.get('/sessions/:code', async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      res.json(await gameService.getState(code));
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

      if (!req.file?.filename) {
        const error = new Error('Le fichier audio est requis');
        error.status = 400;
        throw error;
      }

      const music = await gameService.addMusic(code, {
        playerId,
        title,
        artist,
        filePath: `/uploads/${req.file.filename}`,
      });

      ioNamespace.to(code).emit('music:add', music);
      ioNamespace.to(code).emit('state:update', await gameService.getState(code));
      res.status(201).json(music);
    } catch (error) {
      next(error);
    }
  });

  router.post('/sessions/:code/start-voting', async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      const state = await gameService.setPhase(code, 'voting');
      ioNamespace.to(code).emit('state:update', state);
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
      ioNamespace.to(code).emit('vote:submit', { voterId, musicId, guessedPlayerId });
      ioNamespace.to(code).emit('state:update', state);
      res.json(state);
    } catch (error) {
      next(error);
    }
  });

  router.post('/sessions/:code/finish', async (req, res, next) => {
    try {
      const code = requireNonEmptyString(req.params.code, 'code').toUpperCase();
      const state = await gameService.setPhase(code, 'results');
      ioNamespace.to(code).emit('state:update', state);
      res.json(await gameService.getResults(code));
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
