const express = require('express');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ─── AHA Blood Pressure Classification ─────────────────────────────────────
function classifyBP(systolic, diastolic) {
  if (systolic > 180 || diastolic > 120) return 'Hypertensive Crisis';
  if (systolic >= 140 || diastolic >= 90) return 'Stage 2 Hypertension';
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) return 'Stage 1 Hypertension';
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) return 'Elevated';
  return 'Normal';
}

// ─── Dashboard Summary ────────────────────────────────────────────────────
router.get('/dashboard-summary', (req, res) => {
  const uid = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(uid);

  // Today's water
  const waterToday = db.prepare(`
    SELECT COALESCE(SUM(glasses), 0) as glasses FROM water_logs 
    WHERE user_id = ? AND date(logged_at) = date('now','localtime')
  `).get(uid);

  // Latest weight
  const latestWeight = db.prepare(
    'SELECT weight_kg, logged_at FROM weight_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 1'
  ).get(uid);

  // Latest BP
  const latestBP = db.prepare(
    'SELECT systolic, diastolic, pulse, category, logged_at FROM blood_pressure_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 1'
  ).get(uid);

  // Latest glucose
  const latestGlucose = db.prepare(
    'SELECT reading, reading_type, logged_at FROM glucose_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 1'
  ).get(uid);

  // Latest sleep
  const latestSleep = db.prepare(
    'SELECT duration_hours, quality, logged_at FROM sleep_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 1'
  ).get(uid);

  // Today's steps
  const todaySteps = db.prepare(`
    SELECT COALESCE(SUM(steps), 0) as steps FROM step_logs
    WHERE user_id = ? AND date(logged_at) = date('now','localtime')
  `).get(uid);

  // Active medications + today's status
  const medications = db.prepare(`
    SELECT m.*, 
      (SELECT status FROM medication_logs ml WHERE ml.medication_id = m.id 
       AND date(ml.logged_at) = date('now','localtime') ORDER BY ml.logged_at DESC LIMIT 1) as today_status
    FROM medications m WHERE m.user_id = ? AND m.is_active = 1
  `).all(uid);

  // Adherence rate (last 30 days)
  const adherenceData = db.prepare(`
    SELECT 
      COUNT(CASE WHEN status = 'taken' THEN 1 END) as taken,
      COUNT(*) as total
    FROM medication_logs WHERE user_id = ? AND logged_at >= date('now', '-30 days')
  `).get(uid);

  const adherenceRate = adherenceData.total > 0
    ? Math.round((adherenceData.taken / adherenceData.total) * 100)
    : 0;

  // Active goals
  const goals = db.prepare(
    "SELECT * FROM health_goals WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 5"
  ).all(uid);

  // BMI calculation
  let bmi = null;
  let bmiCategory = null;
  const w = latestWeight?.weight_kg || profile?.weight;
  const h = profile?.height;
  if (w && h) {
    bmi = parseFloat((w / Math.pow(h / 100, 2)).toFixed(1));
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi < 25) bmiCategory = 'Normal';
    else if (bmi < 30) bmiCategory = 'Overweight';
    else bmiCategory = 'Obese';
  }

  return res.json({
    profile,
    hydration: { glasses: waterToday.glasses, goal: profile?.water_goal_glasses || 8 },
    weight: latestWeight,
    bmi: { value: bmi, category: bmiCategory },
    bloodPressure: latestBP,
    glucose: latestGlucose,
    sleep: latestSleep,
    steps: { today: todaySteps.steps, goal: profile?.step_goal || 10000 },
    medications,
    adherenceRate,
    goals
  });
});

// ─── Water / Hydration ───────────────────────────────────────────────────
router.get('/water', (req, res) => {
  const logs = db.prepare(`
    SELECT date(logged_at,'localtime') as day, SUM(glasses) as glasses
    FROM water_logs WHERE user_id = ?
    GROUP BY date(logged_at,'localtime')
    ORDER BY day DESC LIMIT 30
  `).all(req.user.id);
  return res.json(logs);
});

router.post('/water', (req, res) => {
  const { glasses = 1 } = req.body;
  if (glasses < 1) return res.status(400).json({ error: 'Glasses must be positive' });
  const result = db.prepare('INSERT INTO water_logs (user_id, glasses) VALUES (?, ?)').run(req.user.id, glasses);
  return res.status(201).json({ id: result.lastInsertRowid, glasses, logged_at: new Date().toISOString() });
});

router.delete('/water/:id', (req, res) => {
  const log = db.prepare('SELECT id FROM water_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  db.prepare('DELETE FROM water_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return res.json({ message: 'Deleted' });
});

// ─── Weight ─────────────────────────────────────────────────────────────
router.get('/weight', (req, res) => {
  const logs = db.prepare(
    'SELECT * FROM weight_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 60'
  ).all(req.user.id);
  return res.json(logs);
});

router.post('/weight', (req, res) => {
  const { weight_kg, notes } = req.body;
  if (!weight_kg || weight_kg <= 0) return res.status(400).json({ error: 'Valid weight required' });
  const result = db.prepare('INSERT INTO weight_logs (user_id, weight_kg, notes) VALUES (?, ?, ?)').run(req.user.id, weight_kg, notes || null);
  // Update profile weight
  db.prepare('UPDATE profiles SET weight = ? WHERE user_id = ?').run(weight_kg, req.user.id);
  return res.status(201).json({ id: result.lastInsertRowid, weight_kg, notes, logged_at: new Date().toISOString() });
});

router.delete('/weight/:id', (req, res) => {
  const log = db.prepare('SELECT id FROM weight_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  db.prepare('DELETE FROM weight_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return res.json({ message: 'Deleted' });
});

// ─── Sleep ──────────────────────────────────────────────────────────────
router.get('/sleep', (req, res) => {
  const logs = db.prepare(
    'SELECT * FROM sleep_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 30'
  ).all(req.user.id);
  return res.json(logs);
});

router.post('/sleep', (req, res) => {
  const { bedtime, wake_time, quality = 'Normal', notes } = req.body;
  if (!bedtime || !wake_time) return res.status(400).json({ error: 'Bedtime and wake time required' });

  // Calculate duration
  const bed = new Date(`1970-01-01T${bedtime}`);
  let wake = new Date(`1970-01-01T${wake_time}`);
  if (wake <= bed) wake = new Date(`1970-01-02T${wake_time}`);
  const duration_hours = parseFloat(((wake - bed) / 3600000).toFixed(2));

  const result = db.prepare(
    'INSERT INTO sleep_logs (user_id, bedtime, wake_time, duration_hours, quality, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, bedtime, wake_time, duration_hours, quality, notes || null);

  return res.status(201).json({ id: result.lastInsertRowid, bedtime, wake_time, duration_hours, quality });
});

router.delete('/sleep/:id', (req, res) => {
  const log = db.prepare('SELECT id FROM sleep_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  db.prepare('DELETE FROM sleep_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return res.json({ message: 'Deleted' });
});

// ─── Exercise ────────────────────────────────────────────────────────────
router.get('/exercise', (req, res) => {
  const logs = db.prepare(
    'SELECT * FROM exercise_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 50'
  ).all(req.user.id);
  return res.json(logs);
});

router.post('/exercise', (req, res) => {
  const { activity_type, duration_minutes, calories_burned, intensity = 'Moderate', notes } = req.body;
  if (!activity_type || !duration_minutes) return res.status(400).json({ error: 'Activity type and duration required' });
  const result = db.prepare(
    'INSERT INTO exercise_logs (user_id, activity_type, duration_minutes, calories_burned, intensity, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, activity_type, duration_minutes, calories_burned || null, intensity, notes || null);
  return res.status(201).json({ id: result.lastInsertRowid, activity_type, duration_minutes, calories_burned, intensity });
});

router.delete('/exercise/:id', (req, res) => {
  const log = db.prepare('SELECT id FROM exercise_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  db.prepare('DELETE FROM exercise_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return res.json({ message: 'Deleted' });
});

// ─── Steps ──────────────────────────────────────────────────────────────
router.get('/steps', (req, res) => {
  const logs = db.prepare(`
    SELECT date(logged_at,'localtime') as day, SUM(steps) as steps
    FROM step_logs WHERE user_id = ?
    GROUP BY date(logged_at,'localtime')
    ORDER BY day DESC LIMIT 30
  `).all(req.user.id);
  return res.json(logs);
});

router.post('/steps', (req, res) => {
  const { steps } = req.body;
  if (!steps || steps < 0) return res.status(400).json({ error: 'Valid step count required' });
  const result = db.prepare('INSERT INTO step_logs (user_id, steps) VALUES (?, ?)').run(req.user.id, steps);
  return res.status(201).json({ id: result.lastInsertRowid, steps, logged_at: new Date().toISOString() });
});

router.delete('/steps/:id', (req, res) => {
  const log = db.prepare('SELECT id FROM step_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  db.prepare('DELETE FROM step_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return res.json({ message: 'Deleted' });
});

// ─── Blood Pressure ──────────────────────────────────────────────────────
router.get('/blood-pressure', (req, res) => {
  const logs = db.prepare(
    'SELECT * FROM blood_pressure_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 60'
  ).all(req.user.id);
  return res.json(logs);
});

router.post('/blood-pressure', (req, res) => {
  const { systolic, diastolic, pulse, notes } = req.body;
  if (!systolic || !diastolic) return res.status(400).json({ error: 'Systolic and diastolic values required' });

  const category = classifyBP(systolic, diastolic);
  const result = db.prepare(
    'INSERT INTO blood_pressure_logs (user_id, systolic, diastolic, pulse, category, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, systolic, diastolic, pulse || null, category, notes || null);

  const isEmergency = category === 'Hypertensive Crisis';
  return res.status(201).json({
    id: result.lastInsertRowid, systolic, diastolic, pulse, category,
    isEmergency,
    emergencyMessage: isEmergency ? '⚠️ Hypertensive Crisis Detected! Seek immediate medical attention. Call 112.' : null
  });
});

router.delete('/blood-pressure/:id', (req, res) => {
  const log = db.prepare('SELECT id FROM blood_pressure_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  db.prepare('DELETE FROM blood_pressure_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return res.json({ message: 'Deleted' });
});

// ─── Blood Glucose ───────────────────────────────────────────────────────
router.get('/glucose', (req, res) => {
  const logs = db.prepare(
    'SELECT * FROM glucose_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 60'
  ).all(req.user.id);
  return res.json(logs);
});

router.post('/glucose', (req, res) => {
  const { reading, reading_type = 'Fasting', notes } = req.body;
  if (!reading || reading <= 0) return res.status(400).json({ error: 'Valid glucose reading required' });
  const result = db.prepare(
    'INSERT INTO glucose_logs (user_id, reading, reading_type, notes) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, reading, reading_type, notes || null);
  return res.status(201).json({ id: result.lastInsertRowid, reading, reading_type });
});

router.delete('/glucose/:id', (req, res) => {
  const log = db.prepare('SELECT id FROM glucose_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  db.prepare('DELETE FROM glucose_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return res.json({ message: 'Deleted' });
});

// ─── Heart Rate ──────────────────────────────────────────────────────────
router.get('/heart-rate', (req, res) => {
  const logs = db.prepare(
    'SELECT * FROM heart_rate_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 60'
  ).all(req.user.id);
  return res.json(logs);
});

router.post('/heart-rate', (req, res) => {
  const { bpm, reading_type = 'Resting', notes } = req.body;
  if (!bpm || bpm <= 0) return res.status(400).json({ error: 'Valid BPM required' });
  const result = db.prepare(
    'INSERT INTO heart_rate_logs (user_id, bpm, reading_type, notes) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, bpm, reading_type, notes || null);
  return res.status(201).json({ id: result.lastInsertRowid, bpm, reading_type });
});

router.delete('/heart-rate/:id', (req, res) => {
  const log = db.prepare('SELECT id FROM heart_rate_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  db.prepare('DELETE FROM heart_rate_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return res.json({ message: 'Deleted' });
});

module.exports = router;
