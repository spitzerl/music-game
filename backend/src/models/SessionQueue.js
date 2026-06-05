import { query } from '../config/database.js';

export default class SessionQueue {
  static async reset(sessionId, musicIds) {
    await query('DELETE FROM session_music_queue WHERE session_id = $1', [sessionId]);
    for (let index = 0; index < musicIds.length; index += 1) {
      await query(
        `INSERT INTO session_music_queue (session_id, music_id, position)
         VALUES ($1, $2, $3)`,
        [sessionId, musicIds[index], index]
      );
    }
  }

  static async findBySession(sessionId) {
    const result = await query(
      `SELECT q.session_id, q.music_id, q.position, m.player_id
       FROM session_music_queue q
       JOIN musics m ON m.id = q.music_id
       WHERE q.session_id = $1
       ORDER BY q.position ASC`,
      [sessionId]
    );
    return result.rows;
  }

  static async clear(sessionId) {
    await query('DELETE FROM session_music_queue WHERE session_id = $1', [sessionId]);
  }
}
