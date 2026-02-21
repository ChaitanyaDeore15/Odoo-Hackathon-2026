const db = require('../config/db');

exports.index = async (req, res) => {
    try {
        const [tripsByDriver, fuelByVehicle, maintenanceByVehicle, tripsByMonth, recentAudit] = await Promise.all([
            db.query(`
        SELECT d.name AS driver_name, COUNT(t.id) AS total_trips,
               SUM(t.cargo_weight) AS total_cargo
        FROM trips t JOIN drivers d ON t.driver_id = d.id
        GROUP BY d.id ORDER BY total_trips DESC LIMIT 10
      `),
            db.query(`
        SELECT v.license_plate, v.model, SUM(f.cost) AS fuel_cost, SUM(f.liters) AS liters
        FROM fuel_logs f JOIN vehicles v ON f.vehicle_id = v.id
        GROUP BY v.id ORDER BY fuel_cost DESC LIMIT 10
      `),
            db.query(`
        SELECT v.license_plate, v.model, COUNT(m.id) AS incidents, SUM(m.cost) AS maint_cost
        FROM maintenance m JOIN vehicles v ON m.vehicle_id = v.id
        GROUP BY v.id ORDER BY maint_cost DESC LIMIT 10
      `),
            db.query(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS trips
        FROM trips GROUP BY month ORDER BY month DESC LIMIT 12
      `),
            db.query(`
        SELECT al.*, u.name AS user_name
        FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC LIMIT 20
      `),
        ]);

        res.render('analytics/index', {
            title: 'Analytics',
            user: req.session.user,
            tripsByDriver: tripsByDriver[0],
            fuelByVehicle: fuelByVehicle[0],
            maintenanceByVehicle: maintenanceByVehicle[0],
            tripsByMonth: tripsByMonth[0],
            recentAudit: recentAudit[0],
        });
    } catch (err) {
        console.error(err);
        res.render('error', { user: req.session.user, code: 500, message: 'Analytics load failed.' });
    }
};
