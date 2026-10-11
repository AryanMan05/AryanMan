const express = require('express');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/medications — list active prescriptions
router.get('/', (req, res) => {
  const meds = db.prepare(`
    SELECT m.*,
      (SELECT status FROM medication_logs ml WHERE ml.medication_id = m.id
       AND date(ml.logged_at) = date('now','localtime') ORDER BY ml.logged_at DESC LIMIT 1) as today_status,
      ROUND(
        100.0 * (SELECT COUNT(*) FROM medication_logs ml2 WHERE ml2.medication_id = m.id AND ml2.status = 'taken' AND ml2.logged_at >= date('now','-30 days')) /
        MAX(1, (SELECT COUNT(*) FROM medication_logs ml3 WHERE ml3.medication_id = m.id AND ml3.logged_at >= date('now','-30 days'))), 0
      ) as adherence_rate
    FROM medications m WHERE m.user_id = ? AND m.is_active = 1 ORDER BY m.created_at DESC
  `).all(req.user.id);
  return res.json(meds);
});

// POST /api/medications — add prescription
router.post('/', (req, res) => {
  const { name, dosage, frequency, reminder_time, instructions } = req.body;
  if (!name) return res.status(400).json({ error: 'Medication name is required' });
  const result = db.prepare(
    'INSERT INTO medications (user_id, name, dosage, frequency, reminder_time, instructions) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, name, dosage || null, frequency || null, reminder_time || null, instructions || null);
  return res.status(201).json({ id: result.lastInsertRowid, name, dosage, frequency, reminder_time, instructions, is_active: 1 });
});

// PUT /api/medications/:id — update prescription
router.put('/:id', (req, res) => {
  const med = db.prepare('SELECT id FROM medications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!med) return res.status(404).json({ error: 'Medication not found' });

  const { name, dosage, frequency, reminder_time, instructions, is_active } = req.body;
  db.prepare(`
    UPDATE medications SET
      name = COALESCE(?, name),
      dosage = COALESCE(?, dosage),
      frequency = COALESCE(?, frequency),
      reminder_time = COALESCE(?, reminder_time),
      instructions = COALESCE(?, instructions),
      is_active = COALESCE(?, is_active)
    WHERE id = ? AND user_id = ?
  `).run(name, dosage, frequency, reminder_time, instructions, is_active, req.params.id, req.user.id);

  return res.json({ message: 'Medication updated' });
});

// DELETE /api/medications/:id
router.delete('/:id', (req, res) => {
  const med = db.prepare('SELECT id FROM medications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!med) return res.status(404).json({ error: 'Medication not found' });
  db.prepare('UPDATE medications SET is_active = 0 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return res.json({ message: 'Medication deactivated' });
});

// POST /api/medications/:id/log — take or skip
router.post('/:id/log', (req, res) => {
  const { status } = req.body;
  if (!['taken', 'skipped'].includes(status)) {
    return res.status(400).json({ error: 'Status must be "taken" or "skipped"' });
  }

  const med = db.prepare('SELECT id FROM medications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!med) return res.status(404).json({ error: 'Medication not found' });

  const result = db.prepare(
    'INSERT INTO medication_logs (medication_id, user_id, status) VALUES (?, ?, ?)'
  ).run(req.params.id, req.user.id, status);

  return res.status(201).json({ id: result.lastInsertRowid, medication_id: req.params.id, status });
});

// GET /api/medications/history — medication log history
router.get('/history', (req, res) => {
  const logs = db.prepare(`
    SELECT ml.*, m.name as medication_name, m.dosage
    FROM medication_logs ml
    JOIN medications m ON ml.medication_id = m.id
    WHERE ml.user_id = ?
    ORDER BY ml.logged_at DESC LIMIT 90
  `).all(req.user.id);
  return res.json(logs);
});

module.exports = router;
