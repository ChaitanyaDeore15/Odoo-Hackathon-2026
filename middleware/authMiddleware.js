/**
 * Authentication & Role-Based Access Middleware
 */

exports.isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) return next();
    req.flash('error', 'Please log in to continue.');
    res.redirect('/login');
};

exports.isVerified = (req, res, next) => {
    if (req.session.user && req.session.user.is_verified) return next();
    req.flash('error', 'Please verify your email before logging in.');
    res.redirect('/login');
};

// Role access matrix
const ROLE_ROUTES = {
    manager: ['*'],                                           // full access
    dispatcher: ['/vehicles', '/trips', '/dashboard', '/'],
    safety_officer: ['/drivers', '/maintenance', '/dashboard', '/'],
    analyst: ['/fuel', '/analytics', '/dashboard', '/'],
};

exports.hasRole = (...allowedRoles) => (req, res, next) => {
    if (!req.session.user) {
        req.flash('error', 'Unauthorized.');
        return res.redirect('/login');
    }
    const role = req.session.user.role;
    if (role === 'manager' || allowedRoles.includes(role)) return next();
    return res.status(403).render('error', {
        user: req.session.user,
        code: 403,
        message: 'You do not have permission to access this page.',
    });
};
