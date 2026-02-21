const db = require('../config/db');

const Vehicle = {
    async findAll({ search = '', status = '', sort = 'id', order = 'ASC' } = {}) {
        const allowed = ['id', 'license_plate', 'model', 'type', 'status', 'odometer'];
        const col = allowed.includes(sort) ? sort : 'id';
        const dir = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        let q = 'SELECT * FROM vehicles WHERE 1=1';
        const params = [];
        if (search) { q += ' AND (license_plate LIKE ? OR model LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
        if (status) { q += ' AND status = ?'; params.push(status); }
        q += ` ORDER BY ${col} ${dir}`;

        const [rows] = await db.query(q, params);
        return rows;
    },

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [id]);
        return rows[0] || null;
    },

    async findAvailable() {
        const [rows] = await db.query("SELECT * FROM vehicles WHERE status = 'available'");
        return rows;
    },

    async create({ license_plate, model, type, max_capacity, odometer }) {
        const [r] = await db.query(
            'INSERT INTO vehicles (license_plate, model, type, max_capacity, odometer) VALUES (?,?,?,?,?)',
            [license_plate, model, type, max_capacity, odometer || 0]
        );
        return r.insertId;
    },

    async update(id, { license_plate, model, type, max_capacity, odometer }) {
        await db.query(
            'UPDATE vehicles SET license_plate=?, model=?, type=?, max_capacity=?, odometer=? WHERE id=?',
            [license_plate, model, type, max_capacity, odometer, id]
        );
    },

    async updateStatus(id, status) {
        await db.query('UPDATE vehicles SET status=? WHERE id=?', [status, id]);
    },

    async delete(id) {
        await db.query('DELETE FROM vehicles WHERE id=?', [id]);
    },

    async countByStatus() {
        const [rows] = await db.query(
            "SELECT status, COUNT(*) AS cnt FROM vehicles GROUP BY status"
        );
        return rows;
    },
};

module.exports = Vehicle;
