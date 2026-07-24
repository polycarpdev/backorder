const pool = require('../db');
const { logAction } = require('../utils/auditLog');
const { notify } = require('../utils/notify');

async function getComments(req, res) {
  const { backOrderId } = req.params;

  const result = await pool.query(
    `SELECT c.*, u.name AS author_name, u.role AS author_role
     FROM back_order_comments c
     LEFT JOIN users u ON c.author_id = u.id
     WHERE c.back_order_id = $1
     ORDER BY c.created_at ASC`,
    [backOrderId]
  );

  res.json(result.rows);
}

async function createComment(req, res) {
  const { backOrderId } = req.params;
  const { message, is_change_request, proposed_changes } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const backOrderResult = await pool.query('SELECT * FROM back_orders WHERE id = $1', [backOrderId]);
  if (backOrderResult.rows.length === 0) {
    return res.status(404).json({ error: 'Back order not found' });
  }
  const backOrder = backOrderResult.rows[0];

  const result = await pool.query(
    `INSERT INTO back_order_comments (back_order_id, author_id, message, is_change_request, proposed_changes, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      backOrderId,
      req.user.id,
      message.trim(),
      !!is_change_request,
      proposed_changes ? JSON.stringify(proposed_changes) : null,
      is_change_request ? 'OPEN' : null,
    ]
  );

  const comment = result.rows[0];

  if (is_change_request) {
    const admins = await pool.query(`SELECT id FROM users WHERE role = 'ADMIN'`);
    for (const admin of admins.rows) {
      await notify({
        userId: admin.id,
        type: 'CHANGE_REQUEST',
        message: `${req.user.name} requested a change on ${backOrder.stock_code} (${backOrder.client_name})`,
        backOrderId,
      });
    }
  } else {
    const notifyUserId = req.user.id === backOrder.created_by ? null : backOrder.created_by;
    if (notifyUserId) {
      await notify({
        userId: notifyUserId,
        type: 'NEW_COMMENT',
        message: `${req.user.name} commented on ${backOrder.stock_code} (${backOrder.client_name})`,
        backOrderId,
      });
    }
  }

  res.status(201).json(comment);
}

async function applyChangeRequest(req, res) {
  const { commentId } = req.params;

  const commentResult = await pool.query('SELECT * FROM back_order_comments WHERE id = $1', [commentId]);
  if (commentResult.rows.length === 0) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  const comment = commentResult.rows[0];

  if (!comment.is_change_request || comment.status !== 'OPEN') {
    return res.status(400).json({ error: 'This is not an open change request' });
  }

  const changes = comment.proposed_changes;
  if (!changes || Object.keys(changes).length === 0) {
    return res.status(400).json({ error: 'No structured changes to apply' });
  }

  const allowedFields = ['client_name', 'stock_description', 'quantity'];
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (changes[field] !== undefined) {
      setClauses.push(`${field} = $${paramIndex}`);
      values.push(changes[field]);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: 'No valid fields in proposed changes' });
  }

  values.push(comment.back_order_id);
  const updateResult = await pool.query(
    `UPDATE back_orders SET ${setClauses.join(', ')}, updated_at = now() WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  await pool.query(`UPDATE back_order_comments SET status = 'APPLIED' WHERE id = $1`, [commentId]);

  await logAction({
    entityType: 'back_order',
    entityId: comment.back_order_id,
    backOrderId: comment.back_order_id,
    userId: req.user.id,
    action: 'CHANGE_REQUEST_APPLIED',
    fieldChanged: Object.keys(changes).join(', '),
    oldValue: null,
    newValue: JSON.stringify(changes),
  });

  await notify({
    userId: comment.author_id,
    type: 'CHANGE_REQUEST_APPLIED',
    message: `Your change request on back order #${comment.back_order_id} was applied`,
    backOrderId: comment.back_order_id,
  });

  res.json(updateResult.rows[0]);
}

async function dismissChangeRequest(req, res) {
  const { commentId } = req.params;

  const commentResult = await pool.query('SELECT * FROM back_order_comments WHERE id = $1', [commentId]);
  if (commentResult.rows.length === 0) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  const comment = commentResult.rows[0];

  if (!comment.is_change_request || comment.status !== 'OPEN') {
    return res.status(400).json({ error: 'This is not an open change request' });
  }

  await pool.query(`UPDATE back_order_comments SET status = 'DISMISSED' WHERE id = $1`, [commentId]);

  await notify({
    userId: comment.author_id,
    type: 'CHANGE_REQUEST_DISMISSED',
    message: `Your change request on back order #${comment.back_order_id} was dismissed`,
    backOrderId: comment.back_order_id,
  });

  res.json({ success: true });
}

module.exports = { getComments, createComment, applyChangeRequest, dismissChangeRequest };
