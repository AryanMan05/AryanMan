const express = require('express');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/profile
router.get('/', (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  const user = db.prepare('SELECT id, email, full_name, role, created_at FROM users WHERE id = ?').get(req.user.id);
  return res.json({ ...user, profile });
});

// PUT /api/profile
router.put('/', (req, res) => {
  const {
    name, full_name, age, gender, date_of_birth, height, weight, blood_group, activity_level,
    water_goal_glasses, step_goal, sleep_goal_hours, allergies,
    emergency_contact, emergency_contact_name, emergency_contact_phone, onboarding_completed
  } = req.body;

  const contactName = emergency_contact || emergency_contact_name;
  const existing = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.user.id);

  if (existing) {
    db.prepare(`
      UPDATE profiles SET
        age = COALESCE(?, age),
        gender = COALESCE(?, gender),
        date_of_birth = COALESCE(?, date_of_birth),
        height = COALESCE(?, height),
        weight = COALESCE(?, weight),
        blood_group = COALESCE(?, blood_group),
        activity_level = COALESCE(?, activity_level),
        water_goal_glasses = COALESCE(?, water_goal_glasses),
        step_goal = COALESCE(?, step_goal),
        sleep_goal_hours = COALESCE(?, sleep_goal_hours),
        allergies = COALESCE(?, allergies),
        emergency_contact_name = COALESCE(?, emergency_contact_name),
        emergency_contact_phone = COALESCE(?, emergency_contact_phone),
        onboarding_completed = COALESCE(?, onboarding_completed),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      age !== undefined ? age : null,
      gender !== undefined ? gender : null,
      date_of_birth !== undefined ? date_of_birth : null,
      height !== undefined ? height : null,
      weight !== undefined ? weight : null,
      blood_group !== undefined ? blood_group : null,
      activity_level !== undefined ? activity_level : null,
      water_goal_glasses !== undefined ? water_goal_glasses : null,
      step_goal !== undefined ? step_goal : null,
      sleep_goal_hours !== undefined ? sleep_goal_hours : null,
      allergies !== undefined ? allergies : null,
      contactName !== undefined ? contactName : null,
      emergency_contact_phone !== undefined ? emergency_contact_phone : null,
      onboarding_completed !== undefined ? onboarding_completed : null,
      req.user.id
    );
  } else {
    db.prepare(`
      INSERT INTO profiles (user_id, age, gender, date_of_birth, height, weight, blood_group, 
        activity_level, water_goal_glasses, step_goal, sleep_goal_hours, allergies, 
        emergency_contact_name, emergency_contact_phone, onboarding_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, age || null, gender || null, date_of_birth || null, height || null, weight || null, blood_group || null,
      activity_level || 'sedentary', water_goal_glasses || 8, step_goal || 10000, sleep_goal_hours || 8.0, allergies || null,
      contactName || null, emergency_contact_phone || null, onboarding_completed ?? 0
    );
  }

  // Update name / full_name if provided
  const updatedName = name || full_name;
  if (updatedName) {
    db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(updatedName, req.user.id);
  }

  // If weight provided and no weight log exists, add an initial log
  if (weight) {
    const existingLog = db.prepare('SELECT id FROM weight_logs WHERE user_id = ? LIMIT 1').get(req.user.id);
    if (!existingLog) {
      db.prepare('INSERT INTO weight_logs (user_id, weight_kg, notes) VALUES (?, ?, ?)').run(req.user.id, weight, 'Initial weight profile');
    }
  }

  const updated = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  const updatedUser = db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(req.user.id);
  return res.json({ message: 'Profile updated successfully', profile: updated, user: updatedUser });
});

module.exports = router;
