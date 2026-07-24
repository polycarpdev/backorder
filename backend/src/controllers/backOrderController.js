const pool = require('../db');
const { findOrCreateClient } = require('./clientController');
const { logAction } = require('../utils/auditLog');
const { notify, notifyAllAdmins } = require('../utils/notify');

async function createBackOrder(req, res) {
  const { client_name, stock_code, stock_description, quantity } = req.body;

  if (!client_name || !stock_code || !stock_description || !quantity) {
    return res.status(400).json({ error: 'client_name, stock_code, stock_description, and quantity are required' });
  }

  const client = await findOrCreateClient(client_name.trim());

  const result = await pool.query(
    `INSERT INTO back_orders (client_id, client_name, stock_code, stock_description, quantity, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [client.id, client.name, stock_code, stock_description, quantity, req.user.id]
  );

  const backOrder = result.rows[0];

  await logAction({
    entityType: 'back_order',
    entityId: backOrder.id,
    backOrderId: backOrder.id,
    userId: req.user.id,
    action: 'CREATED',
  });

  await notifyAllAdmins({
    type: 'NEW_BACK_ORDER',
    message: `${req.user.name} created a new back order for ${client.name} (${stock_code})`,
    backOrderId: backOrder.id,
  });

  res.status(201).json(backOrder);
}

async function getBackOrders(req, res) {
  const { role, id: userId } = req.user;

  let query = `
    SELECT bo.*, s.name AS supplier_name, u.name AS assigned_staff_name, c.name AS created_by_name
    FROM back_orders bo
    LEFT JOIN suppliers s ON bo.supplier_id = s.id
    LEFT JOIN users u ON bo.assigned_staff_id = u.id
    LEFT JOIN users c ON bo.created_by = c.id
  `;
  const params = [];

  if (role === 'CRO') {
    query += ' WHERE bo.created_by = $1';
    params.push(userId);
  } else if (role === 'STAFF') {
    query += ' WHERE bo.assigned_staff_id = $1';
    params.push(userId);
  }

  query += ' ORDER BY bo.created_at DESC';

  const result = await pool.query(query, params);
  res.json(result.rows);
}

async function getBackOrderById(req, res) {
  const { id } = req.params;
  const { role, id: userId } = req.user;

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

  const backOrder = result.rows[0];

  if (role === 'CRO' && backOrder.created_by !== userId) {
    return res.status(403).json({ error: 'You do not have access to this back order' });
  }
  if (role === 'STAFF' && backOrder.assigned_staff_id !== userId) {
    return res.status(403).json({ error: 'You do not have access to this back order' });
  }

  res.json(backOrder);
}

async function assignBackOrder(req, res) {
  const { id } = req.params;
  const { supplier_id, assigned_staff_id, eta } = req.body;

  if (!supplier_id || !assigned_staff_id || !eta) {
    return res.status(400).json({ error: 'supplier_id, assigned_staff_id, and eta are required' });
  }

  const existing = await pool.query('SELECT * FROM back_orders WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'Back order not found' });
  }

  const result = await pool.query(
    `UPDATE back_orders
     SET supplier_id = $1, assigned_staff_id = $2, eta = $3, status = 'ACTIVE', updated_at = now()
     WHERE id = $4
     RETURNING *`,
    [supplier_id, assigned_staff_id, eta, id]
  );

  const backOrder = result.rows[0];

  await logAction({
    entityType: 'back_order',
    entityId: id,
    backOrderId: id,
    userId: req.user.id,
    action: 'ASSIGNED',
    fieldChanged: 'supplier_id, assigned_staff_id, eta, status',
    oldValue: existing.rows[0].status,
    newValue: 'ACTIVE',
  });

  await notify({
    userId: assigned_staff_id,
    type: 'ASSIGNED_TO_YOU',
    message: `You've been assigned back order ${backOrder.stock_code} for ${backOrder.client_name}, ETA ${new Date(eta).toLocaleDateString()}`,
    backOrderId: id,
  });

  if (backOrder.created_by !== req.user.id) {
    await notify({
      userId: backOrder.created_by,
      type: 'BACK_ORDER_ASSIGNED',
      message: `Your back order for ${backOrder.client_name} (${backOrder.stock_code}) has been assigned and is now active`,
      backOrderId: id,
    });
  }

  res.json(backOrder);
}

async function updateStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!['PENDING_ASSIGNMENT', 'ACTIVE', 'COMPLETED', 'CLOSED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const existing = await pool.query('SELECT * FROM back_orders WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'Back order not found' });
  }

  const backOrder = existing.rows[0];
  const { role, id: userId } = req.user;

  const isAdmin = role === 'ADMIN';
  const isAssignedStaff = role === 'STAFF' && backOrder.assigned_staff_id === userId;
  const isValidStaffTransition = isAssignedStaff && backOrder.status === 'ACTIVE' && status === 'COMPLETED';

  if (!isAdmin && !isValidStaffTransition) {
    return res.status(403).json({ error: 'You do not have permission to make this status change' });
  }

  const result = await pool.query(
    `UPDATE back_orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, id]
  );

  const updated = result.rows[0];

  await logAction({
    entityType: 'back_order',
    entityId: id,
    backOrderId: id,
    userId,
    action: 'STATUS_UPDATED',
    fieldChanged: 'status',
    oldValue: backOrder.status,
    newValue: status,
  });

  if (status === 'COMPLETED') {
    await notifyAllAdmins({
      type: 'BACK_ORDER_COMPLETED',
      message: `${req.user.name} marked ${updated.client_name} (${updated.stock_code}) as restocked / completed`,
      backOrderId: id,
    });
    await notify({
      userId: updated.created_by,
      type: 'BACK_ORDER_COMPLETED',
      message: `Back order ${updated.stock_code} for ${updated.client_name} has been restocked`,
      backOrderId: id,
    });
  }

  if (status === 'CLOSED') {
    await notify({
      userId: updated.created_by,
      type: 'BACK_ORDER_CLOSED',
      message: `Back order ${updated.stock_code} for ${updated.client_name} is now closed`,
      backOrderId: id,
    });
  }

  res.json(updated);
}

module.exports = { createBackOrder, getBackOrders, getBackOrderById, assignBackOrder, updateStatus };
