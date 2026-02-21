const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        req.flash('error', 'Too many password reset requests. Please try again after 15 minutes.');
        res.redirect('/forgot-password');
    },
    // Use ipKeyGenerator for proper IPv6 support (required in express-rate-limit v8)
    keyGenerator: (req) => req.body?.email || ipKeyGenerator(req),
    validate: { ip: false }, // Suppress aggressive validation if using custom generator with helper
});

module.exports = { forgotPasswordLimiter };
