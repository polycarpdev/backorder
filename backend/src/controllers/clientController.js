const pool = require('../db');

async function searchClients(req, res) {
  const { search } = req.query;

  if (!search) {
    const result = await pool.query('SELECT * FROM clients ORDER BY name ASC');
    return res.json(result.rows);
  }

  const result = await pool.query(
    'SELECT * FROM clients WHERE name ILIKE $1 ORDER BY name ASC LIMIT 10',
    [`%${search}%`]
  );

  res.json(result.rows);
}

async function getClientById(req, res) {
  const { id } = req.params;

  const client = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);

  if (client.rows.length === 0) {
    return res.status(404).json({ error: 'Client not found' });
  }

  const backOrders = await pool.query(
    `SELECT bo.*, s.name AS supplier_name, u.name AS assigned_staff_name
     FROM back_orders bo
     LEFT JOIN suppliers s ON bo.supplier_id = s.id
     LEFT JOIN users u ON bo.assigned_staff_id = u.id
     WHERE bo.client_id = $1
     ORDER BY bo.created_at DESC`,
    [id]
  );

  res.json({ client: client.rows[0], backOrders: backOrders.rows });
}

async function findOrCreateClient(name) {
  const existing = await pool.query('SELECT * FROM clients WHERE name = $1', [name]);
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const created = await pool.query(
    'INSERT INTO clients (name) VALUES ($1) RETURNING *',
    [name]
  );
  return created.rows[0];
}

module.exports = { searchClients, getClientById, findOrCreateClient };
