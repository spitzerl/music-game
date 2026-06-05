import { query } from '../config/database.js';
import Session from '../models/Session.js';
import Player from '../models/Player.js';
import Music from '../models/Music.js';

const VALID_PHASES = ['selection', 'voting', 'results'];

export default class GameService {
  async createSession(hostName) {
    const code = await Session.generateCode();
    const session = await Session.create({ code, hostName });
    const host = await Player.create({ sessionId: session.id, name: hostName });
    return { session, host };
  }

  async joinSession(code, playerName) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    const player = await Player.create({ sessionId: session.id, name: playerName });
    return { session, player };
  }

  async addMusic(code, payload) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    if (session.phase !== 'selection') {
      throw new Error('La phase de sélection est terminée');
    }

    return Music.create({ sessionId: session.id, ...payload });
  }

  async submitVote(code, voterId, musicId, guessedPlayerId) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    if (session.phase !== 'voting') {
      throw new Error('La phase de vote n\'est pas active');
    }

    const music = await Music.findById(musicId);
    if (!music || music.session_id !== session.id) {
      throw new Error('Musique invalide');
    }

    const previousVoteResult = await query(
      `SELECT guessed_player_id
       FROM votes
       WHERE session_id = $1 AND voter_id = $2 AND music_id = $3`,
      [session.id, voterId, musicId]
    );
    const previousGuess = previousVoteResult.rows[0]?.guessed_player_id ?? null;

    await query(
      `INSERT INTO votes (session_id, voter_id, music_id, guessed_player_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id, voter_id, music_id)
       DO UPDATE SET guessed_player_id = EXCLUDED.guessed_player_id`,
      [session.id, voterId, musicId, guessedPlayerId]
    );

    const wasCorrect = previousGuess === music.player_id;
    const isCorrect = guessedPlayerId === music.player_id;

    if (!wasCorrect && isCorrect) {
      await Player.incrementScore(voterId, 1);
    } else if (wasCorrect && !isCorrect) {
      await Player.incrementScore(voterId, -1);
    }

    return this.getState(code);
  }

  async setPhase(code, phase) {
    if (!VALID_PHASES.includes(phase)) {
      throw new Error('Phase invalide');
    }

    const session = await Session.updatePhase(code, phase);
    if (!session) {
      throw new Error('Session introuvable');
    }

    return this.getState(code);
  }

  async getState(code) {
    const session = await Session.findByCode(code);
    if (!session) {
      throw new Error('Session introuvable');
    }

    const players = await Player.findBySession(session.id);
    const musics = await Music.findBySession(session.id);

    return {
      session,
      players,
      musics,
    };
  }

  async getResults(code) {
    const state = await this.getState(code);
    const ranking = [...state.players].sort((a, b) => b.score - a.score);
    return { ...state, ranking };
  }
}
