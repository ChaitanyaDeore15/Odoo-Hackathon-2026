const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analyticsController');
const { isAuthenticated, isVerified, hasRole } = require('../middleware/authMiddleware');

const guard = [isAuthenticated, isVerified, hasRole('manager', 'analyst')];

router.get('/', ...guard, ctrl.index);

module.exports = router;
