const pool = require('../db');

async function getAuditLogs(req, res) {
  const { back_order_id } = req.query;

  let query = `
    SELECT al.*, u.name AS user_name, bo.stock_code, bo.client_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN back_orders bo ON al.back_order_id = bo.id
  `;
  const params = [];

  if (back_order_id) {
    query += ' WHERE al.back_order_id = $1';
    params.push(back_order_id);
  }

  query += ' ORDER BY al.created_at DESC';

  const result = await pool.query(query, params);
  res.json(result.rows);
}

module.exports = { getAuditLogs };
