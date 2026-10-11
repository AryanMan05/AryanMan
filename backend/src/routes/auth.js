const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(
    "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'user')"
  );

  try {
    const result = stmt.run(email.toLowerCase(), password_hash, full_name);
    // Create empty profile
    db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(result.lastInsertRowid);

    const jwtSecret = process.env.JWT_SECRET || 'careconnect_fallback_secret_key_2026';
    const token = jwt.sign(
      { id: result.lastInsertRowid, email: email.toLowerCase(), role: 'user' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: result.lastInsertRowid, email: email.toLowerCase(), full_name, role: 'user' }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Account has been suspended. Contact admin.' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'careconnect_fallback_secret_key_2026';
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
  });
});

// POST /api/auth/forgot-password  (simulation)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email.toLowerCase());
  // Always return success to prevent email enumeration
  return res.json({
    message: 'If an account exists with this email, a reset link has been sent. Please check your inbox.',
    simulated: true
  });
});

// POST /api/auth/reset-password  (simulation)
router.post('/reset-password', (req, res) => {
  const { email, new_password } = req.body;
  if (!email || !new_password) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(404).json({ error: 'Account not found' });

  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);

  return res.json({ message: 'Password updated successfully' });
});

// GET /api/auth/me
const { requireAuth } = require('../middleware/auth');
router.get('/me', requireAuth, (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  return res.json({ user: req.user, profile });
});

module.exports = router;
