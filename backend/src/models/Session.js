import { query } from '../config/database.js';

export default class Session {
  static async create({ code, hostName }) {
    const result = await query(
      `INSERT INTO sessions (code, host_name, phase)
       VALUES ($1, $2, 'selection')
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
