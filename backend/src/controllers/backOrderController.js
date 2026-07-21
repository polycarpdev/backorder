const pool = require('../db');

async function createBackOrder(req, res) {
  const { client_name, stock_code, stock_description, quantity } = req.body;

  if (!client_name || !stock_code || !stock_description || !quantity) {
    return res.status(400).json({ error: 'client_name, stock_code, stock_description, and quantity are required' });
  }

  const result = await pool.query(
    `INSERT INTO back_orders (client_name, stock_code, stock_description, quantity, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [client_name, stock_code, stock_description, quantity, req.user.id]
  );

  res.status(201).json(result.rows[0]);
}

async function getBackOrders(req, res) {
  const result = await pool.query(
    `SELECT bo.*, s.name AS supplier_name, u.name AS assigned_staff_name, c.name AS created_by_name
     FROM back_orders bo
     LEFT JOIN suppliers s ON bo.supplier_id = s.id
     LEFT JOIN users u ON bo.assigned_staff_id = u.id
     LEFT JOIN users c ON bo.created_by = c.id
     ORDER BY bo.created_at DESC`
  );

  res.json(result.rows);
}

async function getBackOrderById(req, res) {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT bo.*, s.name AS supplier_name, u.name AS assigned_staff_name, c.name AS created_by_name
     FROM back_orders bo
     LEFT JOIN suppliers s ON bo.supplier_id = s.id
     LEFT JOIN users u ON bo.assigned_staff_id = u.id
     LEFT JOIN users c ON bo.created_by = c.id
     WHERE bo.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Back order not found' });
  }

  res.json(result.rows[0]);
}

module.exports = { createBackOrder, getBackOrders, getBackOrderById };
