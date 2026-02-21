const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { forgotPasswordLimiter } = require('../middleware/rateLimiter');

router.get('/signup', auth.getSignup);
router.post('/signup', auth.postSignup);
router.get('/verify-email', auth.getVerifyEmail);
router.post('/verify-email', auth.postVerifyEmail);
router.get('/resend-otp', auth.resendOtp);
router.get('/login', auth.getLogin);
router.post('/login', auth.postLogin);
router.get('/logout', auth.logout);
router.get('/forgot-password', auth.getForgotPassword);
router.post('/forgot-password', forgotPasswordLimiter, auth.postForgotPassword);
router.get('/reset-password/:token', auth.getResetPassword);
router.post('/reset-password/:token', auth.postResetPassword);

module.exports = router;
