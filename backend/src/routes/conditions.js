const express = require('express');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/conditions — public endpoint for condition library
router.get('/', (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM conditions WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (name LIKE ? OR symptoms LIKE ? OR category LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY category, name';
  const conditions = db.prepare(query).all(...params);
  return res.json(conditions);
});

// GET /api/conditions/categories
router.get('/categories', (req, res) => {
  const cats = db.prepare('SELECT DISTINCT category FROM conditions ORDER BY category').all();
  return res.json(cats.map(c => c.category));
});

// GET /api/conditions/:id
router.get('/:id', (req, res) => {
  const condition = db.prepare('SELECT * FROM conditions WHERE id = ?').get(req.params.id);
  if (!condition) return res.status(404).json({ error: 'Condition not found' });
  return res.json(condition);
});

module.exports = router;
