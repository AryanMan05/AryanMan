const express = require('express');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/goals
router.get('/', (req, res) => {
  const goals = db.prepare(
    'SELECT * FROM health_goals WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  return res.json(goals);
});

// POST /api/goals
router.post('/', (req, res) => {
  const { category, title, target_value, current_value = 0, unit } = req.body;
  if (!category || !title || !target_value) {
    return res.status(400).json({ error: 'Category, title, and target value are required' });
  }
  const status = current_value >= target_value ? 'completed' : 'active';
  const result = db.prepare(
    'INSERT INTO health_goals (user_id, category, title, target_value, current_value, unit, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, category, title, target_value, current_value, unit || null, status);

  return res.status(201).json({ id: result.lastInsertRowid, category, title, target_value, current_value, unit, status });
});

// PUT /api/goals/:id
router.put('/:id', (req, res) => {
  const goal = db.prepare('SELECT id FROM health_goals WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const { title, target_value, current_value, unit, status } = req.body;

  // Auto-complete if current >= target
  const existingGoal = db.prepare('SELECT * FROM health_goals WHERE id = ?').get(req.params.id);
  const newCurrent = current_value !== undefined ? current_value : existingGoal.current_value;
  const newTarget = target_value !== undefined ? target_value : existingGoal.target_value;
  const autoStatus = status || (newCurrent >= newTarget ? 'completed' : existingGoal.status);

  db.prepare(`
    UPDATE health_goals SET
      title = COALESCE(?, title),
      target_value = COALESCE(?, target_value),
      current_value = COALESCE(?, current_value),
      unit = COALESCE(?, unit),
      status = ?
    WHERE id = ? AND user_id = ?
  `).run(title, target_value, current_value, unit, autoStatus, req.params.id, req.user.id);

  return res.json({ message: 'Goal updated', status: autoStatus });
});

// DELETE /api/goals/:id
router.delete('/:id', (req, res) => {
  const goal = db.prepare('SELECT id FROM health_goals WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });
  db.prepare('DELETE FROM health_goals WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  return res.json({ message: 'Goal deleted' });
});

module.exports = router;
