require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

// ── View Engine ───────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global request logger for debugging
app.use((req, res, next) => {
    console.log(`🌐 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// ── Static Files ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Method Override (for DELETE/PUT via forms) ────────────────
app.use(methodOverride('_method'));

// ── Session ───────────────────────────────────────────────────
app.use(session({
    secret: process.env.SESSION_SECRET || 'fleet_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8, httpOnly: true }, // 8 hours
}));

// ── Flash Messages ────────────────────────────────────────────
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.user = req.session.user || null;
    next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/vehicles', require('./routes/vehicles'));
app.use('/drivers', require('./routes/drivers'));
app.use('/trips', require('./routes/trips'));
app.use('/maintenance', require('./routes/maintenance'));
app.use('/fuel', require('./routes/fuel'));
app.use('/analytics', require('./routes/analytics'));

// Root redirect
app.get('/', (req, res) => res.redirect(req.session.user ? '/dashboard' : '/login'));

// 404
app.use((req, res) =>
    res.status(404).render('error', { user: req.session.user, code: 404, message: 'Page not found.' })
);

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { user: req.session.user, code: 500, message: 'Internal server error.' });
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Fleet System running on http://localhost:${PORT}`));
