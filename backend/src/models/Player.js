import { query } from '../config/database.js';

export default class Player {
  static async create({ sessionId, name, clientId, isHost = false, isBot = false }) {
    const result = await query(
      `INSERT INTO players (session_id, name, client_id, is_host, is_bot, connected, can_vote)
       VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)
       RETURNING *`,
      [sessionId, name, clientId, isHost, isBot]
    );
    return result.rows[0];
  }

  static async findBySession(sessionId) {
    const result = await query(
      `SELECT *
       FROM players
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );
    return result.rows;
  }

  static async findById(playerId) {
    const result = await query('SELECT * FROM players WHERE id = $1', [playerId]);
    return result.rows[0] || null;
  }

  static async findByClientId(sessionId, clientId) {
    const result = await query('SELECT * FROM players WHERE session_id = $1 AND client_id = $2', [sessionId, clientId]);
    return result.rows[0] || null;
  }

  static async setConnected(playerId, connected) {
    const result = await query(
      `UPDATE players
       SET connected = $1,
           disconnected_at = CASE WHEN $1 THEN NULL ELSE NOW() END
       WHERE id = $2
       RETURNING *`,
      [connected, playerId]
    );
    return result.rows[0] || null;
  }

  static async setCanVote(playerId, canVote) {
    const result = await query(
      'UPDATE players SET can_vote = $1 WHERE id = $2 RETURNING *',
      [canVote, playerId]
    );
    return result.rows[0] || null;
  }

  static async updateName(playerId, name) {
    const result = await query('UPDATE players SET name = $1 WHERE id = $2 RETURNING *', [name, playerId]);
    return result.rows[0] || null;
  }
}
