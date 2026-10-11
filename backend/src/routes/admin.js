const express = require('express');
const os = require('os');
const { db } = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────
router.get('/dashboard', (req, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get();
  const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_active = 1 AND role = 'user'").get();
  const suspendedUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_active = 0").get();
  const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get();

  const recentSignups = db.prepare(
    "SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10"
  ).all();

  // Total logs across all 8 trackers
  const waterLogs = db.prepare("SELECT COUNT(*) as count FROM water_logs").get();
  const weightLogs = db.prepare("SELECT COUNT(*) as count FROM weight_logs").get();
  const sleepLogs = db.prepare("SELECT COUNT(*) as count FROM sleep_logs").get();
  const exerciseLogs = db.prepare("SELECT COUNT(*) as count FROM exercise_logs").get();
  const stepLogs = db.prepare("SELECT COUNT(*) as count FROM step_logs").get();
  const bpLogs = db.prepare("SELECT COUNT(*) as count FROM blood_pressure_logs").get();
  const glucoseLogs = db.prepare("SELECT COUNT(*) as count FROM glucose_logs").get();
  const heartRateLogs = db.prepare("SELECT COUNT(*) as count FROM heart_rate_logs").get();

  const totalLogs = waterLogs.count + weightLogs.count + sleepLogs.count + exerciseLogs.count +
    stepLogs.count + bpLogs.count + glucoseLogs.count + heartRateLogs.count;

  const medicationLogs = db.prepare("SELECT COUNT(*) as count FROM medication_logs").get();
  const takenLogs = db.prepare("SELECT COUNT(*) as count FROM medication_logs WHERE status = 'taken'").get();

  const conditionsCount = db.prepare("SELECT COUNT(*) as count FROM conditions").get();

  return res.json({
    users: {
      total: totalUsers.count,
      active: activeUsers.count,
      suspended: suspendedUsers.count,
      admins: adminCount.count
    },
    trackerLogs: {
      total: totalLogs,
      water: waterLogs.count,
      weight: weightLogs.count,
      sleep: sleepLogs.count,
      exercise: exerciseLogs.count,
      steps: stepLogs.count,
      bloodPressure: bpLogs.count,
      glucose: glucoseLogs.count,
      heartRate: heartRateLogs.count
    },
    medications: {
      totalLogs: medicationLogs.count,
      taken: takenLogs.count,
      adherenceRate: medicationLogs.count > 0
        ? Math.round((takenLogs.count / medicationLogs.count) * 100)
        : 0
    },
    conditions: conditionsCount.count,
    recentSignups
  });
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────
router.get('/users', (req, res) => {
  const { search, role, is_active } = req.query;
  let query = `SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at,
    p.age, p.gender, p.onboarding_completed
    FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE 1=1`;
  const params = [];

  if (search) {
    query += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (role) {
    query += ' AND u.role = ?';
    params.push(role);
  }
  if (is_active !== undefined) {
    query += ' AND u.is_active = ?';
    params.push(parseInt(is_active));
  }

  query += ' ORDER BY u.created_at DESC';
  const users = db.prepare(query).all(...params);
  return res.json(users);
});

// ─── PUT /api/admin/users/:id/role ────────────────────────────────────────
router.put('/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Role must be "user" or "admin"' });
  }

  // Prevent self-demotion
  if (parseInt(req.params.id) === req.user.id && role === 'user') {
    return res.status(403).json({ error: 'Admins cannot demote themselves' });
  }

  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  return res.json({ message: `User role updated to ${role}` });
});

// ─── PUT /api/admin/users/:id/status ─────────────────────────────────────
router.put('/users/:id/status', (req, res) => {
  const { is_active } = req.body;

  // Prevent self-suspension
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(403).json({ error: 'Admins cannot suspend their own account' });
  }

  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, req.params.id);
  return res.json({ message: `User account ${is_active ? 'activated' : 'suspended'}` });
});

// ─── Conditions CRUD (Admin CMS) ──────────────────────────────────────────
// POST /api/admin/conditions
router.post('/conditions', (req, res) => {
  const { name, category, overview, symptoms, causes, risk_factors, treatments, prevention, when_to_seek_help } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'Name and category are required' });

  const result = db.prepare(`
    INSERT INTO conditions (name, category, overview, symptoms, causes, risk_factors, treatments, prevention, when_to_seek_help)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, category, overview || null, symptoms || null, causes || null, risk_factors || null, treatments || null, prevention || null, when_to_seek_help || null);

  return res.status(201).json({ id: result.lastInsertRowid, name, category });
});

// PUT /api/admin/conditions/:id
router.put('/conditions/:id', (req, res) => {
  const { name, category, overview, symptoms, causes, risk_factors, treatments, prevention, when_to_seek_help } = req.body;
  const condition = db.prepare('SELECT id FROM conditions WHERE id = ?').get(req.params.id);
  if (!condition) return res.status(404).json({ error: 'Condition not found' });

  db.prepare(`
    UPDATE conditions SET
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      overview = COALESCE(?, overview),
      symptoms = COALESCE(?, symptoms),
      causes = COALESCE(?, causes),
      risk_factors = COALESCE(?, risk_factors),
      treatments = COALESCE(?, treatments),
      prevention = COALESCE(?, prevention),
      when_to_seek_help = COALESCE(?, when_to_seek_help),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, category, overview, symptoms, causes, risk_factors, treatments, prevention, when_to_seek_help, req.params.id);

  return res.json({ message: 'Condition updated' });
});

// DELETE /api/admin/conditions/:id
router.delete('/conditions/:id', (req, res) => {
  const condition = db.prepare('SELECT id FROM conditions WHERE id = ?').get(req.params.id);
  if (!condition) return res.status(404).json({ error: 'Condition not found' });
  db.prepare('DELETE FROM conditions WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Condition deleted' });
});

// ─── GET /api/admin/system ────────────────────────────────────────────────
router.get('/system', (req, res) => {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();

  // Check WAL mode
  const walMode = db.pragma('journal_mode', { simple: true });

  // DB file size
  const path = require('path');
  const fs = require('fs');
  const dbPath = path.join(__dirname, '../../data/care_connect.db');
  let dbSizeBytes = 0;
  try {
    dbSizeBytes = fs.statSync(dbPath).size;
  } catch (e) {}

  return res.json({
    server: {
      uptime: Math.floor(uptime),
      uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development'
    },
    memory: {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 10) / 10,
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024 * 10) / 10,
      rssMB: Math.round(memUsage.rss / 1024 / 1024 * 10) / 10
    },
    database: {
      walMode: walMode === 'wal',
      sizeBytes: dbSizeBytes,
      sizeMB: Math.round(dbSizeBytes / 1024 / 1024 * 100) / 100,
      path: dbPath
    },
    ai: {
      geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'),
      model: 'gemini-2.0-flash'
    }
  });
});

module.exports = router;
