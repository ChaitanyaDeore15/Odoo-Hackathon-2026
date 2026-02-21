const Vehicle = require('../models/Vehicle');
const AuditLog = require('../models/AuditLog');

exports.index = async (req, res) => {
    try {
        const { search = '', status = '', sort = 'id', order = 'ASC' } = req.query;
        const vehicles = await Vehicle.findAll({ search, status, sort, order });
        res.render('vehicles/index', { title: 'Vehicle Registry', user: req.session.user, vehicles, query: req.query });
    } catch (err) { console.error(err); res.redirect('/dashboard'); }
};

exports.getAdd = (req, res) =>
    res.render('vehicles/form', { title: 'Add Vehicle', user: req.session.user, vehicle: null });

exports.postAdd = async (req, res) => {
    try {
        const { license_plate, model, type, max_capacity, odometer } = req.body;
        if (!license_plate || !model || !type || !max_capacity) {
            req.flash('error', 'All fields are required.');
            return res.redirect('/vehicles/add');
        }
        const id = await Vehicle.create({ license_plate, model, type, max_capacity, odometer });
        await AuditLog.create({ user_id: req.session.user.id, action: 'VEHICLE_CREATED', entity: 'vehicles', entity_id: id, detail: `Plate: ${license_plate}` });
        req.flash('success', 'Vehicle added successfully.');
        res.redirect('/vehicles');
    } catch (err) {
        console.error(err);
        req.flash('error', err.code === 'ER_DUP_ENTRY' ? 'License plate already exists.' : 'Failed to add vehicle.');
        res.redirect('/vehicles/add');
    }
};

exports.getEdit = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) { req.flash('error', 'Vehicle not found.'); return res.redirect('/vehicles'); }
        res.render('vehicles/form', { title: 'Edit Vehicle', user: req.session.user, vehicle });
    } catch (err) { console.error(err); res.redirect('/vehicles'); }
};

exports.postEdit = async (req, res) => {
    try {
        const { license_plate, model, type, max_capacity, odometer } = req.body;
        await Vehicle.update(req.params.id, { license_plate, model, type, max_capacity, odometer });
        await AuditLog.create({ user_id: req.session.user.id, action: 'VEHICLE_UPDATED', entity: 'vehicles', entity_id: req.params.id, detail: `Plate: ${license_plate}` });
        req.flash('success', 'Vehicle updated successfully.');
        res.redirect('/vehicles');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to update vehicle.');
        res.redirect(`/vehicles/edit/${req.params.id}`);
    }
};

exports.postDelete = async (req, res) => {
    try {
        await Vehicle.delete(req.params.id);
        await AuditLog.create({ user_id: req.session.user.id, action: 'VEHICLE_DELETED', entity: 'vehicles', entity_id: req.params.id });
        req.flash('success', 'Vehicle deleted.');
        res.redirect('/vehicles');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Cannot delete vehicle. It may have related records.');
        res.redirect('/vehicles');
    }
};
