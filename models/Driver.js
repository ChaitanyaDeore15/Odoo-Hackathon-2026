const db = require('../config/db');

const Driver = {
    async findAll({ search = '', status = '', sort = 'id', order = 'ASC' } = {}) {
        const allowed = ['id', 'name', 'license_number', 'license_expiry', 'safety_score', 'status'];
        const col = allowed.includes(sort) ? sort : 'id';
        const dir = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        let q = 'SELECT * FROM drivers WHERE 1=1';
        const params = [];
        if (search) { q += ' AND (name LIKE ? OR license_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
        if (status) { q += ' AND status = ?'; params.push(status); }
        q += ` ORDER BY ${col} ${dir}`;

        const [rows] = await db.query(q, params);
        return rows;
    },

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM drivers WHERE id = ?', [id]);
        return rows[0] || null;
    },

    async findAvailable() {
        const [rows] = await db.query(
            "SELECT * FROM drivers WHERE status = 'available' AND license_expiry >= CURDATE()"
        );
        return rows;
    },

    async create({ name, license_number, license_expiry, safety_score, document_path }) {
        const [r] = await db.query(
            'INSERT INTO drivers (name, license_number, license_expiry, safety_score, document_path) VALUES (?,?,?,?,?)',
            [name, license_number, license_expiry, safety_score || 100, document_path || null]
        );
        return r.insertId;
    },

    async update(id, { name, license_number, license_expiry, safety_score, document_path }) {
        await db.query(
            'UPDATE drivers SET name=?, license_number=?, license_expiry=?, safety_score=?, document_path=COALESCE(?,document_path) WHERE id=?',
            [name, license_number, license_expiry, safety_score, document_path, id]
        );
    },

    async updateStatus(id, status) {
        await db.query('UPDATE drivers SET status=? WHERE id=?', [status, id]);
    },

    async delete(id) {
        await db.query('DELETE FROM drivers WHERE id=?', [id]);
    },
};

module.exports = Driver;
