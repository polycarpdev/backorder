const bcrypt = require('bcrypt');
const pool = require('../db');
const { logAction } = require('../utils/auditLog');

async function getUsers(req, res) {
  const { role } = req.query;
  let query = 'SELECT id, name, email, role, is_active, created_at FROM users';
  const params = [];

  if (role) {
    query += ' WHERE role = $1';
    params.push(role);
  }
  query += ' ORDER BY name ASC';

  const result = await pool.query(query, params);
  res.json(result.rows);
}

async function createUser(req, res) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required' });
  }

  if (!['ADMIN', 'CRO', 'STAFF'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'A user with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, is_active, created_at`,
    [name, email, passwordHash, role]
  );

  await logAction({
    entityType: 'user',
    entityId: result.rows[0].id,
    userId: req.user.id,
    action: 'USER_CREATED',
    newValue: `${result.rows[0].name} (${role})`,
  });

  res.status(201).json(result.rows[0]);
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (email) {
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Another user already has this email' });
    }
  }

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (email) {
    fields.push(`email = $${paramIndex++}`);
    values.push(email);
  }
  if (role && ['ADMIN', 'CRO', 'STAFF'].includes(role)) {
    fields.push(`role = $${paramIndex++}`);
    values.push(role);
  }
  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    fields.push(`password_hash = $${paramIndex++}`);
    values.push(passwordHash);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, name, email, role, is_active, created_at`,
    values
  );

  await logAction({
    entityType: 'user',
    entityId: id,
    userId: req.user.id,
    action: 'USER_UPDATED',
    fieldChanged: Object.keys(req.body).join(', '),
  });

  res.json(result.rows[0]);
}

async function setUserActiveStatus(req, res) {
  const { id } = req.params;
  const { is_active } = req.body;

  if (Number(id) === req.user.id) {
    return res.status(400).json({ error: 'You cannot suspend your own account' });
  }

  const existing = await pool.query('SELECT name FROM users WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const result = await pool.query(
    `UPDATE users SET is_active = $1 WHERE id = $2
     RETURNING id, name, email, role, is_active, created_at`,
    [is_active, id]
  );

  await logAction({
    entityType: 'user',
    entityId: id,
    userId: req.user.id,
    action: is_active ? 'USER_REACTIVATED' : 'USER_SUSPENDED',
    newValue: existing.rows[0].name,
  });

  res.json(result.rows[0]);
}

module.exports = { getUsers, createUser, updateUser, setUserActiveStatus };
