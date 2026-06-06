import { query } from '../config/database.js';

const DEFAULT_CONFIG = {
  maxMusicsPerPlayer: 3,
  selectionDuration: 120,
  extractDuration: 20,
  votingDuration: 30,
  showAnswers: true,
  maxPlayers: null,
};

export default class Session {
  static normalizeConfig(config = {}) {
    const maxMusicsPerPlayer = Number.parseInt(config.maxMusicsPerPlayer ?? DEFAULT_CONFIG.maxMusicsPerPlayer, 10);
    const selectionDuration = Number.parseInt(config.selectionDuration ?? DEFAULT_CONFIG.selectionDuration, 10);
    const extractDuration = Number.parseInt(config.extractDuration ?? DEFAULT_CONFIG.extractDuration, 10);
    const votingDuration = Number.parseInt(config.votingDuration ?? DEFAULT_CONFIG.votingDuration, 10);
    const showAnswers = config.showAnswers ?? DEFAULT_CONFIG.showAnswers;
    const maxPlayersRaw = config.maxPlayers;
    const maxPlayers = maxPlayersRaw === null || maxPlayersRaw === undefined || maxPlayersRaw === ''
      ? null
      : Number.parseInt(maxPlayersRaw, 10);

    if (!Number.isInteger(maxMusicsPerPlayer) || maxMusicsPerPlayer < 1 || maxMusicsPerPlayer > 20) {
      throw new Error('maxMusicsPerPlayer invalide');
    }
    if (!Number.isInteger(selectionDuration) || selectionDuration < 10 || selectionDuration > 3600) {
      throw new Error('selectionDuration invalide');
    }
    if (!Number.isInteger(extractDuration) || extractDuration < 5 || extractDuration > 120) {
      throw new Error('extractDuration invalide');
    }
    if (!Number.isInteger(votingDuration) || votingDuration < 5 || votingDuration > 300) {
      throw new Error('votingDuration invalide');
    }
    if (typeof showAnswers !== 'boolean') {
      throw new Error('showAnswers invalide');
    }
    if (maxPlayers !== null && (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 100)) {
      throw new Error('maxPlayers invalide');
    }

    return {
      maxMusicsPerPlayer,
      selectionDuration,
      extractDuration,
      votingDuration,
      showAnswers,
      maxPlayers,
    };
  }

  static async create({ code, hostName, config = {} }) {
    const normalized = Session.normalizeConfig(config);
    const result = await query(
      `INSERT INTO sessions (
        code,
        host_name,
        phase,
        max_musics_per_player,
        selection_duration,
        extract_duration,
        voting_duration,
        show_answers,
        max_players
      )
      VALUES ($1, $2, 'waiting', $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        code,
        hostName,
        normalized.maxMusicsPerPlayer,
        normalized.selectionDuration,
        normalized.extractDuration,
        normalized.votingDuration,
        normalized.showAnswers,
        normalized.maxPlayers,
      ]
    );
    return result.rows[0];
  }

  static async findByCode(code) {
    const result = await query('SELECT * FROM sessions WHERE code = $1', [code]);
    return result.rows[0] || null;
  }

  static async updateConfig(code, config) {
    const normalized = Session.normalizeConfig(config);
    const result = await query(
      `UPDATE sessions
       SET max_musics_per_player = $1,
           selection_duration = $2,
           extract_duration = $3,
           voting_duration = $4,
           show_answers = $5,
           max_players = $6,
           updated_at = NOW()
       WHERE code = $7
       RETURNING *`,
      [
        normalized.maxMusicsPerPlayer,
        normalized.selectionDuration,
        normalized.extractDuration,
        normalized.votingDuration,
        normalized.showAnswers,
        normalized.maxPlayers,
        code,
      ]
    );
    return result.rows[0] || null;
  }

  static async updateRuntime(code, changes) {
    const keys = Object.keys(changes);
    if (!keys.length) {
      return Session.findByCode(code);
    }

    const columns = keys.map((key, index) => `${key} = $${index + 1}`);
    const values = keys.map((key) => changes[key]);

    const result = await query(
      `UPDATE sessions
       SET ${columns.join(', ')}, updated_at = NOW()
       WHERE code = $${values.length + 1}
       RETURNING *`,
      [...values, code]
    );
    return result.rows[0] || null;
  }

  static async deleteByCode(code) {
    await query('DELETE FROM sessions WHERE code = $1', [code]);
  }

  static async generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    while (true) {
      let code = '';
      for (let i = 0; i < 6; i += 1) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }

      const existing = await Session.findByCode(code);
      if (!existing) {
        return code;
      }
    }
  }
}
