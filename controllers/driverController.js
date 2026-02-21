const Driver = require('../models/Driver');
const AuditLog = require('../models/AuditLog');
const { uploadDriverDoc } = require('../config/multer');

exports.index = async (req, res) => {
    try {
        const { search = '', status = '', sort = 'id', order = 'ASC' } = req.query;
        const drivers = await Driver.findAll({ search, status, sort, order });
        res.render('drivers/index', { title: 'Drivers', user: req.session.user, drivers, query: req.query });
    } catch (err) { console.error(err); res.redirect('/dashboard'); }
};

exports.getAdd = (req, res) =>
    res.render('drivers/form', { title: 'Add Driver', user: req.session.user, driver: null });

exports.postAdd = [
    uploadDriverDoc.single('driver_doc'),
    async (req, res) => {
        try {
            const { name, license_number, license_expiry, safety_score } = req.body;
            if (!name || !license_number || !license_expiry) {
                req.flash('error', 'Name, license number and expiry are required.');
                return res.redirect('/drivers/add');
            }
            const document_path = req.file ? req.file.path : null;
            const id = await Driver.create({ name, license_number, license_expiry, safety_score, document_path });
            await AuditLog.create({ user_id: req.session.user.id, action: 'DRIVER_CREATED', entity: 'drivers', entity_id: id, detail: `Driver: ${name}` });
            req.flash('success', 'Driver added successfully.');
            res.redirect('/drivers');
        } catch (err) {
            console.error(err);
            req.flash('error', err.code === 'ER_DUP_ENTRY' ? 'License number already exists.' : 'Failed to add driver.');
            res.redirect('/drivers/add');
        }
    },
];

exports.getEdit = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) { req.flash('error', 'Driver not found.'); return res.redirect('/drivers'); }
        res.render('drivers/form', { title: 'Edit Driver', user: req.session.user, driver });
    } catch (err) { console.error(err); res.redirect('/drivers'); }
};

exports.postEdit = [
    uploadDriverDoc.single('driver_doc'),
    async (req, res) => {
        try {
            const { name, license_number, license_expiry, safety_score } = req.body;
            const document_path = req.file ? req.file.path : null;
            await Driver.update(req.params.id, { name, license_number, license_expiry, safety_score, document_path });
            await AuditLog.create({ user_id: req.session.user.id, action: 'DRIVER_UPDATED', entity: 'drivers', entity_id: req.params.id, detail: `Driver: ${name}` });
            req.flash('success', 'Driver updated.');
            res.redirect('/drivers');
        } catch (err) {
            console.error(err);
            req.flash('error', 'Failed to update driver.');
            res.redirect(`/drivers/edit/${req.params.id}`);
        }
    },
];

exports.postDelete = async (req, res) => {
    try {
        await Driver.delete(req.params.id);
        await AuditLog.create({ user_id: req.session.user.id, action: 'DRIVER_DELETED', entity: 'drivers', entity_id: req.params.id });
        req.flash('success', 'Driver deleted.');
        res.redirect('/drivers');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Cannot delete driver with active trips.');
        res.redirect('/drivers');
    }
};
