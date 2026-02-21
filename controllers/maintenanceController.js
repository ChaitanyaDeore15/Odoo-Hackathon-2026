const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const AuditLog = require('../models/AuditLog');
const { uploadReceipt } = require('../config/multer');

exports.index = async (req, res) => {
    try {
        const { search = '', status = '', sort = 'id', order = 'DESC' } = req.query;
        const records = await Maintenance.findAll({ search, status, sort, order });
        res.render('maintenance/index', { title: 'Maintenance', user: req.session.user, records, query: req.query });
    } catch (err) { console.error(err); res.redirect('/dashboard'); }
};

exports.getAdd = async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll();
        res.render('maintenance/form', { title: 'Log Maintenance', user: req.session.user, vehicles, record: null });
    } catch (err) { console.error(err); res.redirect('/maintenance'); }
};

exports.postAdd = [
    uploadReceipt.single('receipt'),
    async (req, res) => {
        try {
            const { vehicle_id, issue, cost, service_date } = req.body;
            if (!vehicle_id || !issue || !service_date) {
                req.flash('error', 'Vehicle, issue, and service date are required.');
                return res.redirect('/maintenance/add');
            }
            const receipt_path = req.file ? req.file.path : null;
            const id = await Maintenance.create({ vehicle_id, issue, cost: cost || 0, service_date, receipt_path });
            await AuditLog.create({ user_id: req.session.user.id, action: 'MAINTENANCE_CREATED', entity: 'maintenance', entity_id: id, detail: `Vehicle ID: ${vehicle_id}, Issue: ${issue}` });
            req.flash('success', 'Maintenance logged. Vehicle status set to "In Shop".');
            res.redirect('/maintenance');
        } catch (err) {
            console.error(err);
            req.flash('error', 'Failed to log maintenance.');
            res.redirect('/maintenance/add');
        }
    },
];

exports.resolve = async (req, res) => {
    try {
        await Maintenance.resolve(req.params.id);
        await AuditLog.create({ user_id: req.session.user.id, action: 'MAINTENANCE_RESOLVED', entity: 'maintenance', entity_id: req.params.id, detail: 'Status set to resolved, vehicle back to available.' });
        req.flash('success', 'Maintenance resolved. Vehicle status set to "Available".');
        res.redirect('/maintenance');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to resolve maintenance.');
        res.redirect('/maintenance');
    }
};
