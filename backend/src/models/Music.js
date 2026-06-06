import { query } from '../config/database.js';

export default class Music {
  static async create({ sessionId, playerId, title, artist, filePath }) {
    const result = await query(
      `INSERT INTO musics (session_id, player_id, title, artist, file_path)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sessionId, playerId, title, artist, filePath]
    );
    return result.rows[0];
  }

  static async findBySession(sessionId) {
    const result = await query('SELECT * FROM musics WHERE session_id = $1 ORDER BY created_at ASC', [sessionId]);
    return result.rows;
  }

  static async findById(musicId) {
    const result = await query('SELECT * FROM musics WHERE id = $1', [musicId]);
    return result.rows[0] || null;
  }

  static async countByPlayer(sessionId) {
    const result = await query(
      `SELECT player_id, COUNT(*)::int AS count
       FROM musics
       WHERE session_id = $1
       GROUP BY player_id`,
      [sessionId]
    );
    return result.rows;
  }

  static async deleteById(musicId, playerId, sessionId) {
    const result = await query(
      `DELETE FROM musics
       WHERE id = $1 AND player_id = $2 AND session_id = $3
       RETURNING *`,
      [musicId, playerId, sessionId]
    );
    return result.rows[0] || null;
  }
}
