const db = require('../config/db');
const Vehicle = require('./Vehicle');

const Maintenance = {
    async findAll({ search = '', status = '', sort = 'id', order = 'DESC' } = {}) {
        let q = `
      SELECT m.*, v.license_plate, v.model
      FROM maintenance m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE 1=1
    `;
        const params = [];
        if (search) { q += ' AND (m.issue LIKE ? OR v.license_plate LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
        if (status) { q += ' AND m.status = ?'; params.push(status); }
        q += ` ORDER BY m.${['id', 'service_date', 'cost', 'status'].includes(sort) ? sort : 'id'} ${order === 'ASC' ? 'ASC' : 'DESC'}`;

        const [rows] = await db.query(q, params);
        return rows;
    },

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM maintenance WHERE id=?', [id]);
        return rows[0] || null;
    },

    async create({ vehicle_id, issue, cost, service_date, receipt_path }) {
        const [r] = await db.query(
            'INSERT INTO maintenance (vehicle_id, issue, cost, service_date, receipt_path) VALUES (?,?,?,?,?)',
            [vehicle_id, issue, cost, service_date, receipt_path || null]
        );
        // Auto-set vehicle to "In Shop"
        await Vehicle.updateStatus(vehicle_id, 'in_shop');
        return r.insertId;
    },

    async resolve(id) {
        const m = await this.findById(id);
        if (!m) throw new Error('Maintenance record not found');
        await db.query("UPDATE maintenance SET status='resolved' WHERE id=?", [id]);
        await Vehicle.updateStatus(m.vehicle_id, 'available');
    },

    async countOpen() {
        const [rows] = await db.query("SELECT COUNT(*) AS cnt FROM maintenance WHERE status='open'");
        return rows[0].cnt;
    },
};

module.exports = Maintenance;
