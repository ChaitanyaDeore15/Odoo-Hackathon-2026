const db = require('../config/db');

const FuelLog = {
    async findAll({ search = '', sort = 'id', order = 'DESC' } = {}) {
        let q = `
      SELECT f.*, v.license_plate, v.model
      FROM fuel_logs f
      JOIN vehicles v ON f.vehicle_id = v.id
      WHERE 1=1
    `;
        const params = [];
        if (search) { q += ' AND v.license_plate LIKE ?'; params.push(`%${search}%`); }
        q += ` ORDER BY f.${['id', 'date', 'liters', 'cost'].includes(sort) ? sort : 'id'} ${order === 'ASC' ? 'ASC' : 'DESC'}`;
        const [rows] = await db.query(q, params);
        return rows;
    },

    async create({ vehicle_id, liters, cost, date }) {
        const [r] = await db.query(
            'INSERT INTO fuel_logs (vehicle_id, liters, cost, date) VALUES (?,?,?,?)',
            [vehicle_id, liters, cost, date]
        );
        return r.insertId;
    },

    async totalCosts() {
        const [rows] = await db.query(`
      SELECT 
        SUM(f.cost) AS total_fuel,
        (SELECT SUM(cost) FROM maintenance) AS total_maintenance
      FROM fuel_logs f
    `);
        return rows[0];
    },

    async monthlySummary() {
        const [rows] = await db.query(`
      SELECT DATE_FORMAT(date, '%Y-%m') AS month, SUM(cost) AS fuel_cost, SUM(liters) AS liters
      FROM fuel_logs
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);
        return rows;
    },
};

module.exports = FuelLog;
