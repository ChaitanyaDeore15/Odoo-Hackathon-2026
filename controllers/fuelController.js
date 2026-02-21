const FuelLog = require('../models/FuelLog');
const Vehicle = require('../models/Vehicle');

exports.index = async (req, res) => {
    try {
        const { search = '', sort = 'id', order = 'DESC' } = req.query;
        const [logs, totals, monthly] = await Promise.all([
            FuelLog.findAll({ search, sort, order }),
            FuelLog.totalCosts(),
            FuelLog.monthlySummary(),
        ]);
        res.render('fuel/index', { title: 'Expenses', user: req.session.user, logs, totals, monthly, query: req.query });
    } catch (err) { console.error(err); res.redirect('/dashboard'); }
};

exports.getAdd = async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll();
        res.render('fuel/form', { title: 'Log Fuel', user: req.session.user, vehicles });
    } catch (err) { console.error(err); res.redirect('/fuel'); }
};

exports.postAdd = async (req, res) => {
    try {
        const { vehicle_id, liters, cost, date } = req.body;
        if (!vehicle_id || !liters || !cost || !date) {
            req.flash('error', 'All fields are required.');
            return res.redirect('/fuel/add');
        }
        await FuelLog.create({ vehicle_id, liters, cost, date });
        req.flash('success', 'Fuel log added.');
        res.redirect('/fuel');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to log fuel.');
        res.redirect('/fuel/add');
    }
};
