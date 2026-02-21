const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const AuditLog = require('../models/AuditLog');
const { uploadTripAttach } = require('../config/multer');

exports.index = async (req, res) => {
    try {
        const { search = '', status = '', sort = 'id', order = 'DESC' } = req.query;
        const trips = await Trip.findAll({ search, status, sort, order });
        res.render('trips/index', { title: 'Trip Dispatcher', user: req.session.user, trips, query: req.query });
    } catch (err) { console.error(err); res.redirect('/dashboard'); }
};

exports.getAdd = async (req, res) => {
    try {
        const [vehicles, drivers] = await Promise.all([Vehicle.findAvailable(), Driver.findAvailable()]);
        res.render('trips/form', { title: 'Create Trip', user: req.session.user, vehicles, drivers, trip: null });
    } catch (err) { console.error(err); res.redirect('/trips'); }
};

exports.postAdd = [
    uploadTripAttach.single('attachment'),
    async (req, res) => {
        try {
            const { vehicle_id, driver_id, origin, destination, cargo_weight } = req.body;
            if (!vehicle_id || !driver_id || !origin || !destination || !cargo_weight) {
                req.flash('error', 'All fields are required.');
                return res.redirect('/trips/add');
            }

            // Business rule: check cargo capacity
            const vehicle = await Vehicle.findById(vehicle_id);
            if (!vehicle) { req.flash('error', 'Vehicle not found.'); return res.redirect('/trips/add'); }
            if (parseFloat(cargo_weight) > parseFloat(vehicle.max_capacity)) {
                req.flash('error', `Cargo weight (${cargo_weight}t) exceeds vehicle capacity (${vehicle.max_capacity}t).`);
                return res.redirect('/trips/add');
            }
            if (vehicle.status !== 'available') {
                req.flash('error', 'Selected vehicle is not available.');
                return res.redirect('/trips/add');
            }

            // Business rule: block expired license
            const driver = await Driver.findById(driver_id);
            if (!driver) { req.flash('error', 'Driver not found.'); return res.redirect('/trips/add'); }
            if (new Date(driver.license_expiry) < new Date()) {
                req.flash('error', `Driver's license expired on ${driver.license_expiry}. Cannot assign.`);
                return res.redirect('/trips/add');
            }
            if (driver.status !== 'available') {
                req.flash('error', 'Selected driver is not available.');
                return res.redirect('/trips/add');
            }

            const attachment_path = req.file ? req.file.path : null;
            const id = await Trip.create({ vehicle_id, driver_id, origin, destination, cargo_weight, attachment_path });
            await AuditLog.create({ user_id: req.session.user.id, action: 'TRIP_CREATED', entity: 'trips', entity_id: id, detail: `${origin} → ${destination}` });

            req.flash('success', 'Trip created successfully.');
            res.redirect('/trips');
        } catch (err) {
            console.error(err);
            req.flash('error', 'Failed to create trip.');
            res.redirect('/trips/add');
        }
    },
];

exports.dispatch = async (req, res) => {
    try {
        await Trip.updateStatus(req.params.id, 'dispatched');
        await AuditLog.create({ user_id: req.session.user.id, action: 'TRIP_DISPATCHED', entity: 'trips', entity_id: req.params.id });
        req.flash('success', 'Trip dispatched. Vehicle and driver marked as On Trip.');
        res.redirect('/trips');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to dispatch trip.');
        res.redirect('/trips');
    }
};

exports.complete = async (req, res) => {
    try {
        await Trip.updateStatus(req.params.id, 'completed');
        await AuditLog.create({ user_id: req.session.user.id, action: 'TRIP_COMPLETED', entity: 'trips', entity_id: req.params.id });
        req.flash('success', 'Trip completed. Vehicle and driver are now available.');
        res.redirect('/trips');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to complete trip.');
        res.redirect('/trips');
    }
};

exports.cancel = async (req, res) => {
    try {
        await Trip.updateStatus(req.params.id, 'cancelled');
        await AuditLog.create({ user_id: req.session.user.id, action: 'TRIP_CANCELLED', entity: 'trips', entity_id: req.params.id });
        req.flash('success', 'Trip cancelled.');
        res.redirect('/trips');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to cancel trip.');
        res.redirect('/trips');
    }
};
