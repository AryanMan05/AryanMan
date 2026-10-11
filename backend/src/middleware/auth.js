const jwt = require('jsonwebtoken');
const { db } = require('../db/database');

/**
 * Verify JWT and attach user to req.user
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'careconnect_fallback_secret_key_2026';
    const decoded = jwt.verify(token, jwtSecret);
    // Verify user still exists and is active
    const user = db.prepare('SELECT id, email, full_name, role, is_active FROM users WHERE id = ?').get(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Unauthorized: Account inactive or not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

/**
 * Enforce admin-only access — must be used AFTER requireAuth
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
