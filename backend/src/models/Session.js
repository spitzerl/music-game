import { query } from '../config/database.js';

export default class Session {
  static async create({ code, hostName }) {
    const result = await query(
      `INSERT INTO sessions (code, host_name, phase)
       VALUES ($1, $2, 'waiting')
       RETURNING *`,
      [code, hostName]
    );
    return result.rows[0];
  }

  static async findByCode(code) {
    const result = await query('SELECT * FROM sessions WHERE code = $1', [code]);
    return result.rows[0] || null;
  }

  static async updatePhase(code, phase) {
    const result = await query(
      'UPDATE sessions SET phase = $1, updated_at = NOW() WHERE code = $2 RETURNING *',
      [phase, code]
    );
    return result.rows[0] || null;
  }

  static async updateConfig(code, { maxMusicsPerPlayer, selectionDuration, extractDuration, votingDuration, showAnswers, maxPlayers }) {
    const result = await query(
      `UPDATE sessions 
       SET max_musics_per_player = COALESCE($1, max_musics_per_player),
           selection_duration = COALESCE($2, selection_duration),
           extract_duration = COALESCE($3, extract_duration),
           voting_duration = COALESCE($4, voting_duration),
           show_answers = COALESCE($5, show_answers),
           max_players = COALESCE($6, max_players),
           updated_at = NOW()
       WHERE code = $7 RETURNING *`,
      [maxMusicsPerPlayer, selectionDuration, extractDuration, votingDuration, showAnswers, maxPlayers, code]
    );
    return result.rows[0] || null;
  }

  static async updateVotingState(code, { currentMusicIndex, votingStatus, timerEndsAt }) {
    const result = await query(
      `UPDATE sessions
       SET current_music_index = COALESCE($1, current_music_index),
           voting_status = COALESCE($2, voting_status),
           timer_ends_at = $3,
           updated_at = NOW()
       WHERE code = $4 RETURNING *`,
      [currentMusicIndex, votingStatus, timerEndsAt, code]
    );
    return result.rows[0] || null;
  }

  static async reset(code) {
    const result = await query(
      `UPDATE sessions
       SET phase = 'waiting',
           current_music_index = -1,
           voting_status = 'idle',
           timer_ends_at = NULL,
           updated_at = NOW()
       WHERE code = $1 RETURNING *`,
      [code]
    );
    return result.rows[0] || null;
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
