const db = require('../config/db');
const Vehicle = require('../models/Vehicle');
const Maintenance = require('../models/Maintenance');
const Trip = require('../models/Trip');

// Dashboard page
exports.getDashboard = async (req, res) => {
    try {
        res.render('dashboard/index', {
            title: 'Dashboard',
            user: req.session.user,
        });
    } catch (err) {
        console.error(err);
        res.render('error', { user: req.session.user, code: 500, message: 'Dashboard load failed.' });
    }
};

// JSON endpoint for AJAX KPI polling
exports.getKpis = async (req, res) => {
    try {
        const [statusCounts, openMaint, pendingCargo] = await Promise.all([
            Vehicle.countByStatus(),
            Maintenance.countOpen(),
            Trip.countPending(),
        ]);

        const statusMap = {};
        for (const row of statusCounts) statusMap[row.status] = parseInt(row.cnt);

        const activeFleet = statusMap['available'] || 0;
        const onTrip = statusMap['on_trip'] || 0;
        const inShop = statusMap['in_shop'] || 0;
        const total = activeFleet + onTrip + inShop;
        const utilizationRate = total > 0 ? Math.round((onTrip / total) * 100) : 0;

        res.json({
            activeFleet,
            maintenanceAlerts: openMaint,
            utilizationRate,
            pendingCargo,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'KPI fetch failed' });
    }
};
