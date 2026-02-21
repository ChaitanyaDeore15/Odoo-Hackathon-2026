const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/maintenanceController');
const { isAuthenticated, isVerified, hasRole } = require('../middleware/authMiddleware');

const guard = [isAuthenticated, isVerified, hasRole('manager', 'safety_officer')];

router.get('/', ...guard, ctrl.index);
router.get('/add', ...guard, ctrl.getAdd);
router.post('/add', ...guard, ctrl.postAdd);
router.post('/resolve/:id', ...guard, ctrl.resolve);

module.exports = router;
