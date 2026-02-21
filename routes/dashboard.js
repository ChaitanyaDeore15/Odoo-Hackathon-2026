const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { isAuthenticated, isVerified } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, isVerified, ctrl.getDashboard);
router.get('/api/kpis', isAuthenticated, isVerified, ctrl.getKpis);

module.exports = router;
