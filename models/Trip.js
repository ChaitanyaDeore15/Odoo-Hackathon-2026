const db = require('../config/db');
const Vehicle = require('./Vehicle');
const Driver = require('./Driver');

const Trip = {
    async findAll({ search = '', status = '', sort = 'id', order = 'DESC' } = {}) {
        const allowed = ['id', 'origin', 'destination', 'status', 'created_at'];
        const col = allowed.includes(sort) ? sort : 'id';
        const dir = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        let q = `
      SELECT t.*, v.license_plate, v.model, d.name AS driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers  d ON t.driver_id  = d.id
      WHERE 1=1
    `;
        const params = [];
        if (search) {
            q += ' AND (t.origin LIKE ? OR t.destination LIKE ? OR v.license_plate LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (status) { q += ' AND t.status = ?'; params.push(status); }
        q += ` ORDER BY t.${col} ${dir}`;

        const [rows] = await db.query(q, params);
        return rows;
    },

    async findById(id) {
        const [rows] = await db.query(
            `SELECT t.*, v.license_plate, v.model, v.max_capacity, d.name AS driver_name, d.license_expiry
       FROM trips t
       JOIN vehicles v ON t.vehicle_id = v.id
       JOIN drivers  d ON t.driver_id  = d.id
       WHERE t.id = ?`, [id]
        );
        return rows[0] || null;
    },

    async create({ vehicle_id, driver_id, origin, destination, cargo_weight, attachment_path }) {
        const [r] = await db.query(
            'INSERT INTO trips (vehicle_id, driver_id, origin, destination, cargo_weight, attachment_path) VALUES (?,?,?,?,?,?)',
            [vehicle_id, driver_id, origin, destination, cargo_weight, attachment_path || null]
        );
        return r.insertId;
    },

    async updateStatus(id, status) {
        const trip = await this.findById(id);
        if (!trip) throw new Error('Trip not found');

        const updates = { status };
        if (status === 'dispatched') updates.start_time = new Date();
        if (status === 'completed' || status === 'cancelled') updates.end_time = new Date();

        const setClauses = Object.keys(updates).map(k => `${k}=?`).join(', ');
        await db.query(`UPDATE trips SET ${setClauses} WHERE id=?`, [...Object.values(updates), id]);

        // cascade vehicle & driver status
        if (status === 'dispatched') {
            await Vehicle.updateStatus(trip.vehicle_id, 'on_trip');
            await Driver.updateStatus(trip.driver_id, 'on_trip');
        }
        if (status === 'completed' || status === 'cancelled') {
            await Vehicle.updateStatus(trip.vehicle_id, 'available');
            await Driver.updateStatus(trip.driver_id, 'available');
        }
    },

    async countPending() {
        const [rows] = await db.query("SELECT COUNT(*) AS cnt FROM trips WHERE status='pending'");
        return rows[0].cnt;
    },
};

module.exports = Trip;
