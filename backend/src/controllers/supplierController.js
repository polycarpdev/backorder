const pool = require('../db');

async function getSuppliers(req, res) {
  const result = await pool.query('SELECT * FROM suppliers ORDER BY name ASC');
  res.json(result.rows);
}

async function createSupplier(req, res) {
  const { name, contact } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Supplier name is required' });
  }
  const result = await pool.query(
    'INSERT INTO suppliers (name, contact) VALUES ($1, $2) RETURNING *',
    [name, contact || null]
  );
  res.status(201).json(result.rows[0]);
}

module.exports = { getSuppliers, createSupplier };
