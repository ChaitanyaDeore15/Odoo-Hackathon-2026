const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const transporter = require('../config/mailer');

// ── GET /signup ──────────────────────────────────────────────
exports.getSignup = (req, res) => res.render('auth/signup', { title: 'Sign Up' });

// ── POST /signup ─────────────────────────────────────────────
exports.postSignup = async (req, res) => {
    console.log('📥 POST /signup request received');
    console.log('Body:', { ...req.body, password: '***', confirm_password: '***' });
    try {
        const { name, email, password, confirm_password, role } = req.body;

        if (!name || !email || !password || !role) {
            console.log('❌ Signup failed: Missing fields');
            req.flash('error', 'All fields are required.');
            return res.redirect('/signup');
        }
        if (password !== confirm_password) {
            console.log('❌ Signup failed: Password mismatch');
            req.flash('error', 'Passwords do not match.');
            return res.redirect('/signup');
        }
        if (password.length < 8) {
            console.log('❌ Signup failed: Password too short');
            req.flash('error', 'Password must be at least 8 characters.');
            return res.redirect('/signup');
        }

        const existing = await User.findByEmail(email);
        if (existing) {
            console.log(`❌ Signup failed: Email ${email} already exists`);
            req.flash('error', 'An account with this email already exists.');
            return res.redirect('/signup');
        }

        const validRoles = ['manager', 'dispatcher', 'safety_officer', 'analyst'];
        if (!validRoles.includes(role)) {
            console.log(`❌ Signup failed: Invalid role ${role}`);
            req.flash('error', 'Invalid role selected.');
            return res.redirect('/signup');
        }

        console.log(`⏳ Creating user ${email} in database...`);
        const { id, otp } = await User.create({ name, email, password, role });
        console.log(`✅ User created with ID ${id}. Generated OTP: ${otp}`);

        // Send OTP email
        console.log(`Attempting to send OTP email to: ${email}...`);
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: email,
                subject: 'Fleet System — Verify Your Email',
                html: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
              <h2 style="color:#2563eb;margin-bottom:8px;">Fleet Management System</h2>
              <p style="color:#374151;">Hi <strong>${name}</strong>,</p>
              <p style="color:#374151;">Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
              <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1e40af;text-align:center;padding:24px 0;">${otp}</div>
              <p style="color:#6b7280;font-size:13px;">If you did not create this account, ignore this email.</p>
            </div>
          `,
            });
            console.log('✅ OTP email sent successfully!');
        } catch (mailErr) {
            console.error('❌ Failed to send OTP email:', mailErr);
            // We don't throw here so we can still set the session and redirect, 
            // but the user won't get the code. Let's redirect with error instead.
            req.flash('error', 'Failed to send verification email. Please check your SMTP settings.');
            return res.redirect('/signup');
        }

        req.session.pendingEmail = email;
        req.flash('success', 'Account created! Check your email for the OTP.');
        res.redirect('/verify-email');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Registration failed. Please try again.');
        res.redirect('/signup');
    }
};

// ── GET /verify-email ────────────────────────────────────────
exports.getVerifyEmail = (req, res) => {
    if (!req.session.pendingEmail) return res.redirect('/signup');
    res.render('auth/verify-email', { title: 'Verify Email', email: req.session.pendingEmail });
};

// ── GET /resend-otp ──────────────────────────────────────────
exports.resendOtp = async (req, res) => {
    try {
        const email = req.session.pendingEmail;
        if (!email) return res.redirect('/signup');

        const user = await User.findByEmail(email);
        if (!user) return res.redirect('/signup');
        if (user.is_verified) return res.redirect('/login');

        // Reuse the logic from User.create but just for update
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        // We'll need a way to update just OTP
        const db = require('../config/db');
        await db.query('UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?', [otp, expiry, user.id]);

        console.log(`✉️  Resending OTP to: ${email}...`);
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Fleet System — New Verification Code',
            html: `
                <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
                  <h2 style="color:#2563eb;margin-bottom:8px;">Fleet Management System</h2>
                  <p style="color:#374151;">Your new verification code is below. It expires in <strong>10 minutes</strong>.</p>
                  <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1e40af;text-align:center;padding:24px 0;">${otp}</div>
                </div>
            `,
        });
        console.log('✅ Resend successful!');
        req.flash('success', 'A new OTP has been sent to your email.');
        res.redirect('/verify-email');
    } catch (err) {
        console.error('❌ Resend OTP failed:', err);
        req.flash('error', 'Failed to resend OTP. Please try again later.');
        res.redirect('/verify-email');
    }
};

// ── POST /verify-email ───────────────────────────────────────
exports.postVerifyEmail = async (req, res) => {
    try {
        const email = req.session.pendingEmail;
        console.log(`📥 POST /verify-email attempt for: ${email}`);
        if (!email) return res.redirect('/signup');

        const { otp } = req.body;
        const user = await User.findByOtp(email, otp);
        if (!user) {
            console.log(`❌ Invalid OTP attempt for ${email}`);
            req.flash('error', 'Invalid or expired OTP. Please try again.');
            return res.redirect('/verify-email');
        }

        await User.verifyEmail(user.id);
        delete req.session.pendingEmail;
        console.log(`✅ Email verified for: ${email}`);
        req.flash('success', 'Email verified! You can now log in.');
        res.redirect('/login');
    } catch (err) {
        console.error('❌ Verification error:', err);
        req.flash('error', 'Verification failed.');
        res.redirect('/verify-email');
    }
};

// ── GET /login ───────────────────────────────────────────────
exports.getLogin = (req, res) => res.render('auth/login', { title: 'Login' });

// ── POST /login ──────────────────────────────────────────────
exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            req.flash('error', 'Email and password are required.');
            return res.redirect('/login');
        }

        const user = await User.findByEmail(email);
        if (!user) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        if (!user.is_verified) {
            req.session.pendingEmail = email;
            req.flash('error', 'Please verify your email first. Check your inbox for the OTP.');
            return res.redirect('/verify-email');
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            is_verified: user.is_verified,
        };

        await AuditLog.create({ user_id: user.id, action: 'LOGIN', entity: 'users', entity_id: user.id, detail: `User logged in: ${user.email}` });

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Login failed. Please try again.');
        res.redirect('/login');
    }
};

// ── GET /logout ──────────────────────────────────────────────
exports.logout = async (req, res) => {
    if (req.session.user) {
        await AuditLog.create({ user_id: req.session.user.id, action: 'LOGOUT', entity: 'users', entity_id: req.session.user.id, detail: 'User logged out.' });
    }
    req.session.destroy(() => res.redirect('/login'));
};

// ── GET /forgot-password ─────────────────────────────────────
exports.getForgotPassword = (req, res) =>
    res.render('auth/forgot-password', { title: 'Forgot Password' });

// ── POST /forgot-password ────────────────────────────────────
exports.postForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            req.flash('error', 'Email is required.');
            return res.redirect('/forgot-password');
        }

        const user = await User.findByEmail(email);
        // Always show same message to prevent email enumeration
        if (!user) {
            req.flash('success', 'If that email is registered, you will receive a reset link shortly.');
            return res.redirect('/forgot-password');
        }

        const plainToken = await User.setResetTokenHash(email);
        const resetUrl = `${process.env.APP_URL}/reset-password/${plainToken}`;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Fleet System Password Reset',
            html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
          <h2 style="color:#2563eb;margin-bottom:8px;">Fleet Management System</h2>
          <p style="color:#374151;">Hi <strong>${user.name}</strong>,</p>
          <p style="color:#374151;">We received a request to reset your password. Click the button below. This link expires in <strong>15 minutes</strong>.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${resetUrl}" style="background:#2563eb;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">Reset Password</a>
          </div>
          <p style="color:#6b7280;font-size:13px;">Or copy this link: <a href="${resetUrl}" style="color:#2563eb;">${resetUrl}</a></p>
          <p style="color:#6b7280;font-size:13px;">If you did not request this, ignore this email. Your password will remain unchanged.</p>
        </div>
      `,
        });

        await AuditLog.create({ user_id: user.id, action: 'FORGOT_PASSWORD', entity: 'users', entity_id: user.id, detail: 'Password reset email sent.' });

        req.flash('success', 'Password reset link sent to your email.');
        res.redirect('/forgot-password');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to send reset email. Please try again.');
        res.redirect('/forgot-password');
    }
};

// ── GET /reset-password/:token ───────────────────────────────
exports.getResetPassword = async (req, res) => {
    try {
        const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findByTokenHash(hash);
        if (!user) {
            req.flash('error', 'Password reset link is invalid or has expired.');
            return res.redirect('/forgot-password');
        }
        res.render('auth/reset-password', { title: 'Reset Password', token: req.params.token });
    } catch (err) {
        console.error(err);
        res.redirect('/forgot-password');
    }
};

// ── POST /reset-password/:token ──────────────────────────────
exports.postResetPassword = async (req, res) => {
    try {
        const { password, confirm_password } = req.body;
        const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findByTokenHash(hash);

        if (!user) {
            req.flash('error', 'Password reset link is invalid or has expired.');
            return res.redirect('/forgot-password');
        }
        if (!password || password.length < 8) {
            req.flash('error', 'Password must be at least 8 characters.');
            return res.redirect(`/reset-password/${req.params.token}`);
        }
        if (password !== confirm_password) {
            req.flash('error', 'Passwords do not match.');
            return res.redirect(`/reset-password/${req.params.token}`);
        }

        await User.updatePassword(user.id, password);
        await User.clearResetToken(user.id); // single-use: clear immediately
        await AuditLog.create({ user_id: user.id, action: 'PASSWORD_RESET', entity: 'users', entity_id: user.id, detail: 'Password successfully reset.' });

        req.flash('success', 'Password reset successfully! Please log in.');
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Reset failed. Please try again.');
        res.redirect('/forgot-password');
    }
};
