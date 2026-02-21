const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/fuelController');
const { isAuthenticated, isVerified, hasRole } = require('../middleware/authMiddleware');

const guard = [isAuthenticated, isVerified, hasRole('manager', 'analyst')];

router.get('/', ...guard, ctrl.index);
router.get('/add', ...guard, ctrl.getAdd);
router.post('/add', ...guard, ctrl.postAdd);

module.exports = router;
