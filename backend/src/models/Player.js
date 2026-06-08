import { query } from '../config/database.js';

export default class Player {
  static async create({ sessionId, name, isBot = false }) {
    const result = await query(
      `INSERT INTO players (session_id, name, score, is_bot, is_connected, is_observer)
       VALUES ($1, $2, 0, $3, TRUE, FALSE)
       RETURNING *`,
      [sessionId, name, isBot]
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

  static async updateConnectionStatus(playerId, isConnected) {
    const result = await query(
      'UPDATE players SET is_connected = $1 WHERE id = $2 RETURNING *',
      [isConnected, playerId]
    );
    return result.rows[0] || null;
  }

  static async setObserver(playerId, isObserver) {
    const result = await query(
      'UPDATE players SET is_observer = $1 WHERE id = $2 RETURNING *',
      [isObserver, playerId]
    );
    return result.rows[0] || null;
  }

  static async resetScoresAndStatusBySession(sessionId) {
    const result = await query(
      `UPDATE players 
       SET score = 0, is_observer = FALSE 
       WHERE session_id = $1 RETURNING *`,
      [sessionId]
    );
    return result.rows;
  }

  static async deletePlayer(playerId) {
    await query('DELETE FROM players WHERE id = $1', [playerId]);
  }
}
