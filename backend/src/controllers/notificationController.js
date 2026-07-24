const pool = require('../db');

async function getNotifications(req, res) {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  );
  res.json(result.rows);
}

async function markAsRead(req, res) {
  const { id } = req.params;
  await pool.query(
    `UPDATE notifications SET read_at = now() WHERE id = $1 AND user_id = $2`,
    [id, req.user.id]
  );
  res.json({ success: true });
}

async function markAllAsRead(req, res) {
  await pool.query(
    `UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL`,
    [req.user.id]
  );
  res.json({ success: true });
}

module.exports = { getNotifications, markAsRead, markAllAsRead };
