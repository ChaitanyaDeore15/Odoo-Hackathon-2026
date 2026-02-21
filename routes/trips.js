const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tripController');
const { isAuthenticated, isVerified, hasRole } = require('../middleware/authMiddleware');

const guard = [isAuthenticated, isVerified, hasRole('manager', 'dispatcher')];

router.get('/', ...guard, ctrl.index);
router.get('/add', ...guard, ctrl.getAdd);
router.post('/add', ...guard, ctrl.postAdd);
router.post('/dispatch/:id', ...guard, ctrl.dispatch);
router.post('/complete/:id', ...guard, ctrl.complete);
router.post('/cancel/:id', ...guard, ctrl.cancel);

module.exports = router;
