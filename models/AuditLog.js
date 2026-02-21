const db = require('../config/db');

const AuditLog = {
    async create({ user_id = null, action, entity = null, entity_id = null, detail = null }) {
        await db.query(
            'INSERT INTO audit_logs (user_id, action, entity, entity_id, detail) VALUES (?,?,?,?,?)',
            [user_id, action, entity, entity_id, detail]
        );
    },

    async findAll(limit = 100) {
        const [rows] = await db.query(`
      SELECT al.*, u.name AS user_name, u.email AS user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `, [limit]);
        return rows;
    },
};

module.exports = AuditLog;
