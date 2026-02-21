const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = {
    async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
    },

    async findById(id) {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0] || null;
    },

    async findByTokenHash(hash) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE reset_token_hash = ? AND token_expiry > NOW()',
            [hash]
        );
        return rows[0] || null;
    },

    async findByOtp(email, otp) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ? AND otp = ? AND otp_expiry > NOW()',
            [email, otp]
        );
        return rows[0] || null;
    },

    async create({ name, email, password, role }) {
        const hashed = await bcrypt.hash(password, 12);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, otp, otp_expiry) VALUES (?,?,?,?,?,?)',
            [name, email, hashed, role, otp, expiry]
        );
        return { id: result.insertId, otp };
    },

    async verifyEmail(id) {
        await db.query(
            'UPDATE users SET is_verified = 1, otp = NULL, otp_expiry = NULL WHERE id = ?',
            [id]
        );
    },

    async setResetTokenHash(email) {
        const plainToken = crypto.randomBytes(32).toString('hex');
        const hash = crypto.createHash('sha256').update(plainToken).digest('hex');
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        await db.query(
            'UPDATE users SET reset_token_hash = ?, token_expiry = ? WHERE email = ?',
            [hash, expiry, email]
        );
        return plainToken; // send this in email
    },

    async clearResetToken(id) {
        await db.query(
            'UPDATE users SET reset_token_hash = NULL, token_expiry = NULL WHERE id = ?',
            [id]
        );
    },

    async updatePassword(id, newPassword) {
        const hashed = await bcrypt.hash(newPassword, 12);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, id]);
    },
};

module.exports = User;
