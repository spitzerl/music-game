import { query } from '../config/database.js';
import Session from '../models/Session.js';
import Player from '../models/Player.js';
import Music from '../models/Music.js';
import SessionQueue from '../models/SessionQueue.js';

const REVEAL_DURATION = 5;

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const toIso = (date) => (date ? new Date(date).toISOString() : null);

export default class GameService {
  constructor() {
    this.timers = new Map();
    this.notify = async () => {};
  }

  setNotifier(notifyFn) {
    this.notify = notifyFn;
  }

  clearTimer(sessionCode) {
    const existing = this.timers.get(sessionCode);
    if (existing) {
      clearTimeout(existing);
      this.timers.delete(sessionCode);
    }
  }

  scheduleAt(sessionCode, endsAt, callback) {
    this.clearTimer(sessionCode);
    if (!endsAt) {
      return;
    }
    const delay = Math.max(0, new Date(endsAt).getTime() - Date.now());
    const timer = setTimeout(async () => {
      this.timers.delete(sessionCode);
      try {
        await callback();
      } catch (error) {
        console.error('[timer] error', sessionCode, error);
      }
    }, delay);
    this.timers.set(sessionCode, timer);
  }

  async emitRefresh(code) {
    await this.notify(code);
  }

  async createSession(hostName, { clientId, config = {} }) {
    const code = await Session.generateCode();
    const session = await Session.create({ code, hostName, config });
    const host = await Player.create({
      sessionId: session.id,
      name: hostName,
      clientId,
      isHost: true,
      isBot: false,
    });

    await this.emitRefresh(code);
    return { session, host };
  }

  async joinSession(code, playerName, { clientId }) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    if (session.phase === 'results') {
      throw new Error('Cette partie est terminée');
    }

    if (!clientId || typeof clientId !== 'string') {
      throw new Error('clientId requis');
    }

    const existing = await Player.findByClientId(session.id, clientId);
    if (existing) {
      await Player.updateName(existing.id, playerName);
      const player = await Player.setConnected(existing.id, true);
      await this.emitRefresh(code);
      return { session, player, rejoined: true };
    }

    if (session.max_players) {
      const countResult = await query('SELECT COUNT(*)::int AS count FROM players WHERE session_id = $1', [session.id]);
      if (countResult.rows[0].count >= session.max_players) {
        throw new Error('Nombre maximal de joueurs atteint');
      }
    }

    const player = await Player.create({ sessionId: session.id, name: playerName, clientId, isHost: false, isBot: false });
    await this.emitRefresh(code);
    return { session, player, rejoined: false };
  }

  async addBot(code, hostPlayerId, botName) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    const host = await this.requireHost(session.id, hostPlayerId);

    if (session.phase !== 'waiting') {
      throw new Error('Impossible d\'ajouter un bot après le démarrage');
    }

    if (session.max_players) {
      const countResult = await query('SELECT COUNT(*)::int AS count FROM players WHERE session_id = $1', [session.id]);
      if (countResult.rows[0].count >= session.max_players) {
        throw new Error('Nombre maximal de joueurs atteint');
      }
    }

    const clientId = `bot-${session.id}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const bot = await Player.create({ sessionId: session.id, name: botName, clientId, isHost: false, isBot: true });

    console.log('[game] bot added', { code, hostId: host.id, botId: bot.id });
    await this.emitRefresh(code);
    return bot;
  }

  async updateConfig(code, hostPlayerId, config) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    await this.requireHost(session.id, hostPlayerId);

    if (session.phase !== 'waiting') {
      throw new Error('La configuration ne peut être modifiée qu\'en attente');
    }

    const updated = await Session.updateConfig(code, config);
    console.log('[game] config updated', { code, config });
    await this.emitRefresh(code);
    return updated;
  }

  async startSelection(code, hostPlayerId) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    await this.requireHost(session.id, hostPlayerId);

    if (session.phase !== 'waiting') {
      throw new Error('La partie est déjà démarrée');
    }

    const selectionEndsAt = new Date(Date.now() + session.selection_duration * 1000);

    await Session.updateRuntime(code, {
      phase: 'selection',
      selection_ends_at: selectionEndsAt,
      current_music_index: 0,
      voting_stage: null,
      stage_ends_at: null,
    });

    console.log('[game] selection started', { code, selectionEndsAt: toIso(selectionEndsAt) });

    this.scheduleAt(code, selectionEndsAt, async () => {
      await this.startVoting(code, null, { automatic: true });
    });

    await this.emitRefresh(code);
    return this.getState(code);
  }

  async startVoting(code, hostPlayerId = null, { automatic = false } = {}) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    if (!automatic) {
      await this.requireHost(session.id, hostPlayerId);
    }

    if (!['selection', 'waiting'].includes(session.phase)) {
      throw new Error('Le vote ne peut pas commencer maintenant');
    }

    const players = await Player.findBySession(session.id);
    const countsRaw = await Music.countByPlayer(session.id);
    const countByPlayer = new Map(countsRaw.map((row) => [row.player_id, row.count]));

    for (const player of players) {
      const canVote = !!player.connected && (countByPlayer.get(player.id) || 0) >= session.max_musics_per_player;
      await Player.setCanVote(player.id, canVote);
    }

    const allMusics = await Music.findBySession(session.id);
    const eligibleOwners = new Set(players.filter((player) => player.connected).map((player) => player.id));
    const playableMusics = allMusics.filter((music) => eligibleOwners.has(music.player_id));
    const queue = shuffle(playableMusics);

    await SessionQueue.reset(session.id, queue.map((music) => music.id));

    if (!queue.length) {
      await Session.updateRuntime(code, {
        phase: 'results',
        selection_ends_at: null,
        voting_stage: null,
        stage_ends_at: null,
      });
      this.clearTimer(code);
      await this.emitRefresh(code);
      return this.getState(code);
    }

    const stageEndsAt = new Date(Date.now() + session.extract_duration * 1000);

    await Session.updateRuntime(code, {
      phase: 'voting',
      selection_ends_at: null,
      voting_started_at: new Date(),
      current_music_index: 0,
      voting_stage: 'extract',
      stage_ends_at: stageEndsAt,
    });

    console.log('[game] voting started', {
      code,
      automatic,
      musics: queue.length,
    });

    this.scheduleAt(code, stageEndsAt, async () => {
      await this.advanceVotingStage(code);
    });

    await this.emitRefresh(code);
    return this.getState(code);
  }

  async advanceVotingStage(code) {
    const session = await Session.findByCode(code);
    if (!session || session.phase !== 'voting') {
      return;
    }

    const queue = await SessionQueue.findBySession(session.id);
    if (!queue.length) {
      await Session.updateRuntime(code, {
        phase: 'results',
        voting_stage: null,
        stage_ends_at: null,
      });
      await this.emitRefresh(code);
      return;
    }

    if (session.voting_stage === 'extract') {
      const stageEndsAt = new Date(Date.now() + session.voting_duration * 1000);
      await Session.updateRuntime(code, {
        voting_stage: 'vote',
        stage_ends_at: stageEndsAt,
      });
      this.scheduleAt(code, stageEndsAt, async () => {
        await this.advanceVotingStage(code);
      });
      await this.emitRefresh(code);
      return;
    }

    if (session.voting_stage === 'vote' && session.show_answers) {
      const stageEndsAt = new Date(Date.now() + REVEAL_DURATION * 1000);
      await Session.updateRuntime(code, {
        voting_stage: 'reveal',
        stage_ends_at: stageEndsAt,
      });
      this.scheduleAt(code, stageEndsAt, async () => {
        await this.advanceVotingStage(code);
      });
      await this.emitRefresh(code);
      return;
    }

    const nextIndex = session.current_music_index + 1;
    if (nextIndex >= queue.length) {
      await Session.updateRuntime(code, {
        phase: 'results',
        voting_stage: null,
        stage_ends_at: null,
      });
      this.clearTimer(code);
      console.log('[game] session finished', { code });
      await this.emitRefresh(code);
      return;
    }

    const stageEndsAt = new Date(Date.now() + session.extract_duration * 1000);
    await Session.updateRuntime(code, {
      current_music_index: nextIndex,
      voting_stage: 'extract',
      stage_ends_at: stageEndsAt,
    });
    this.scheduleAt(code, stageEndsAt, async () => {
      await this.advanceVotingStage(code);
    });
    await this.emitRefresh(code);
  }

  async addMusic(code, payload) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    if (session.phase !== 'selection') {
      throw new Error('La phase de sélection est terminée');
    }

    if (session.selection_ends_at && new Date(session.selection_ends_at).getTime() <= Date.now()) {
      throw new Error('Le temps de sélection est écoulé');
    }

    const player = await Player.findById(payload.playerId);
    if (!player || player.session_id !== session.id) {
      throw new Error('Joueur invalide');
    }

    const countResult = await query(
      'SELECT COUNT(*)::int AS count FROM musics WHERE session_id = $1 AND player_id = $2',
      [session.id, payload.playerId]
    );

    if (countResult.rows[0].count >= session.max_musics_per_player) {
      throw new Error(`Maximum ${session.max_musics_per_player} musiques atteint`);
    }

    const music = await Music.create({ sessionId: session.id, ...payload });
    console.log('[game] music added', { code, playerId: payload.playerId, musicId: music.id });
    await this.emitRefresh(code);
    return music;
  }

  async removeMusic(code, playerId, musicId) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    if (session.phase !== 'selection') {
      throw new Error('Suppression impossible en dehors de la sélection');
    }

    const deleted = await Music.deleteById(musicId, playerId, session.id);
    if (!deleted) {
      throw new Error('Musique introuvable');
    }

    await this.emitRefresh(code);
    return deleted;
  }

  async submitVote(code, voterId, guessedPlayerId) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    if (session.phase !== 'voting' || session.voting_stage !== 'vote') {
      throw new Error('La phase de vote n\'est pas active');
    }

    if (!session.stage_ends_at || new Date(session.stage_ends_at).getTime() <= Date.now()) {
      throw new Error('Le vote est fermé');
    }

    const queue = await SessionQueue.findBySession(session.id);
    const currentEntry = queue[session.current_music_index];
    if (!currentEntry) {
      throw new Error('Aucune musique active');
    }

    const voter = await Player.findById(voterId);
    if (!voter || voter.session_id !== session.id) {
      throw new Error('Votant invalide');
    }
    if (!voter.connected || !voter.can_vote) {
      throw new Error('Vous ne pouvez pas voter sur cette partie');
    }

    const guessedPlayer = await Player.findById(guessedPlayerId);
    if (!guessedPlayer || guessedPlayer.session_id !== session.id) {
      throw new Error('Joueur deviné invalide');
    }

    const ownerId = currentEntry.player_id;
    if (voter.id === guessedPlayerId) {
      throw new Error('Vote pour soi-même interdit');
    }
    if (guessedPlayerId === ownerId) {
      throw new Error('Vote pour le joueur propriétaire interdit');
    }

    await query(
      `INSERT INTO votes (session_id, voter_id, music_id, guessed_player_id, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (session_id, voter_id, music_id)
       DO UPDATE SET guessed_player_id = EXCLUDED.guessed_player_id, updated_at = NOW()`,
      [session.id, voterId, currentEntry.music_id, guessedPlayerId]
    );

    await this.emitRefresh(code);
    return this.getState(code, voterId);
  }

  async relaunchSession(code, hostPlayerId) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    await this.requireHost(session.id, hostPlayerId);

    this.clearTimer(code);
    await query('DELETE FROM votes WHERE session_id = $1', [session.id]);
    await query('DELETE FROM musics WHERE session_id = $1', [session.id]);
    await SessionQueue.clear(session.id);

    await Session.updateRuntime(code, {
      phase: 'waiting',
      selection_ends_at: null,
      current_music_index: 0,
      voting_stage: null,
      stage_ends_at: null,
      voting_started_at: null,
    });

    const players = await Player.findBySession(session.id);
    for (const player of players) {
      await Player.setCanVote(player.id, true);
    }

    await this.emitRefresh(code);
    return this.getState(code, hostPlayerId);
  }

  async markPlayerConnected(code, playerId) {
    const session = await Session.findByCode(code);
    if (!session) return;

    const player = await Player.findById(playerId);
    if (!player || player.session_id !== session.id) return;

    await Player.setConnected(playerId, true);
    await this.emitRefresh(code);
  }

  async markPlayerDisconnected(code, playerId) {
    const session = await Session.findByCode(code);
    if (!session) return;

    const player = await Player.findById(playerId);
    if (!player || player.session_id !== session.id) return;

    await Player.setConnected(playerId, false);

    if (player.is_host) {
      this.clearTimer(code);
      await Session.deleteByCode(code);
      await this.emitRefresh(code);
      return;
    }

    await this.emitRefresh(code);
  }

  async requireHost(sessionId, playerId) {
    const player = await Player.findById(playerId);
    if (!player || player.session_id !== sessionId || !player.is_host) {
      throw new Error('Action réservée à l\'hôte');
    }
    return player;
  }

  async getRawState(code) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    const players = await Player.findBySession(session.id);
    const musics = await Music.findBySession(session.id);
    const queue = await SessionQueue.findBySession(session.id);
    const votesResult = await query(
      `SELECT v.*
       FROM votes v
       WHERE v.session_id = $1`,
      [session.id]
    );

    return {
      session,
      players,
      musics,
      queue,
      votes: votesResult.rows,
    };
  }

  computeStats(rawState) {
    const playersById = new Map(rawState.players.map((player) => [player.id, player]));
    const musicById = new Map(rawState.musics.map((music) => [music.id, music]));

    const validVotes = rawState.votes.filter((vote) => playersById.get(vote.voter_id)?.connected);

    const votesReceived = new Map();
    const correctGuesses = new Map();
    const correctlyGuessedCount = new Map();

    for (const vote of validVotes) {
      votesReceived.set(vote.guessed_player_id, (votesReceived.get(vote.guessed_player_id) || 0) + 1);

      const music = musicById.get(vote.music_id);
      if (!music) continue;

      if (vote.guessed_player_id === music.player_id) {
        correctGuesses.set(vote.voter_id, (correctGuesses.get(vote.voter_id) || 0) + 1);
        correctlyGuessedCount.set(music.player_id, (correctlyGuessedCount.get(music.player_id) || 0) + 1);
      }
    }

    const players = rawState.players.map((player) => {
      const votesReceivedCount = votesReceived.get(player.id) || 0;
      const correctGuessesCount = correctGuesses.get(player.id) || 0;
      const correctlyGuessed = correctlyGuessedCount.get(player.id) || 0;

      return {
        ...player,
        votesReceived: votesReceivedCount,
        correctGuesses: correctGuessesCount,
        correctlyGuessed,
        finalScore: votesReceivedCount + correctGuessesCount * 2,
      };
    });

    const ranking = [...players].sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return { players, ranking };
  }

  buildCurrentRound(rawState, requesterId) {
    const { session, queue, musics, players, votes } = rawState;
    if (session.phase !== 'voting') {
      return null;
    }

    const currentEntry = queue[session.current_music_index];
    if (!currentEntry) {
      return null;
    }

    const currentMusic = musics.find((music) => music.id === currentEntry.music_id);
    if (!currentMusic) {
      return null;
    }

    const owner = players.find((player) => player.id === currentMusic.player_id);

    const activeVotes = votes
      .filter((vote) => vote.music_id === currentMusic.id)
      .filter((vote) => players.find((player) => player.id === vote.voter_id)?.connected);

    const voteCountsByPlayer = {};
    for (const vote of activeVotes) {
      voteCountsByPlayer[vote.guessed_player_id] = (voteCountsByPlayer[vote.guessed_player_id] || 0) + 1;
    }

    const requesterVote = activeVotes.find((vote) => vote.voter_id === requesterId) || null;

    const options = players
      .filter((player) => player.id !== requesterId && player.id !== currentMusic.player_id)
      .map((player) => ({
        id: player.id,
        name: player.name,
        votes: voteCountsByPlayer[player.id] || 0,
      }));

    return {
      stage: session.voting_stage,
      stageEndsAt: toIso(session.stage_ends_at),
      trackIndex: session.current_music_index + 1,
      totalTracks: queue.length,
      music: {
        id: currentMusic.id,
        title: currentMusic.title,
        artist: currentMusic.artist,
        filePath: currentMusic.file_path,
      },
      options,
      yourVote: requesterVote?.guessed_player_id || null,
      reveal: session.show_answers && session.voting_stage === 'reveal'
        ? {
            owner: owner ? { id: owner.id, name: owner.name } : null,
            voteCountsByPlayer,
            correctVoters: activeVotes
              .filter((vote) => vote.guessed_player_id === currentMusic.player_id)
              .map((vote) => {
                const player = players.find((item) => item.id === vote.voter_id);
                return player ? { id: player.id, name: player.name } : null;
              })
              .filter(Boolean),
          }
        : null,
    };
  }

  sanitizeMusics(rawState, requesterId) {
    const { session, musics } = rawState;

    if (session.phase === 'selection') {
      return musics
        .filter((music) => music.player_id === requesterId)
        .map((music) => ({
          id: music.id,
          title: music.title,
          artist: music.artist,
          file_path: music.file_path,
          player_id: music.player_id,
        }));
    }

    if (session.phase === 'voting') {
      return musics.map((music) => ({
        id: music.id,
        title: music.title,
        artist: music.artist,
        file_path: music.file_path,
      }));
    }

    return musics;
  }

  async getState(code, requesterId = null) {
    const rawState = await this.getRawState(code);
    const countsRaw = await Music.countByPlayer(rawState.session.id);
    const musicCountByPlayer = Object.fromEntries(countsRaw.map((row) => [row.player_id, row.count]));
    const { players, ranking } = this.computeStats(rawState);

    const state = {
      session: {
        ...rawState.session,
        selection_ends_at: toIso(rawState.session.selection_ends_at),
        stage_ends_at: toIso(rawState.session.stage_ends_at),
        voting_started_at: toIso(rawState.session.voting_started_at),
        totalVotingDuration: rawState.queue.length * (rawState.session.extract_duration + rawState.session.voting_duration),
      },
      players: players.map((player) => ({
        ...player,
        musicCount: musicCountByPlayer[player.id] || 0,
      })),
      musics: this.sanitizeMusics(rawState, requesterId),
      currentRound: this.buildCurrentRound(rawState, requesterId),
      ranking,
    };

    return state;
  }

  async getResults(code) {
    const state = await this.getState(code, null);
    return state;
  }
}
