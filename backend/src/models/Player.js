import { query } from '../config/database.js';

export default class Player {
  static async create({ sessionId, name }) {
    const result = await query(
      `INSERT INTO players (session_id, name, score)
       VALUES ($1, $2, 0)
       RETURNING *`,
      [sessionId, name]
    );
    return result.rows[0];
  }

  static async findBySession(sessionId) {
    const result = await query('SELECT * FROM players WHERE session_id = $1 ORDER BY created_at ASC', [sessionId]);
    return result.rows;
  }

  static async incrementScore(playerId, delta) {
    const result = await query(
      'UPDATE players SET score = score + $1 WHERE id = $2 RETURNING *',
      [delta, playerId]
    );
    return result.rows[0] || null;
  }
}
