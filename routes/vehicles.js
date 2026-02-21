const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vehicleController');
const { isAuthenticated, isVerified, hasRole } = require('../middleware/authMiddleware');

const guard = [isAuthenticated, isVerified, hasRole('manager', 'dispatcher')];

router.get('/', ...guard, ctrl.index);
router.get('/add', ...guard, ctrl.getAdd);
router.post('/add', ...guard, ctrl.postAdd);
router.get('/edit/:id', ...guard, ctrl.getEdit);
router.post('/edit/:id', ...guard, ctrl.postEdit);
router.post('/delete/:id', isAuthenticated, isVerified, hasRole('manager'), ctrl.postDelete);

module.exports = router;
