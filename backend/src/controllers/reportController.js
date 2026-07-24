const pool = require('../db');

async function getReport(req, res) {
  const { role, id: userId } = req.user;
  const { date_from, date_to, status, client_id, supplier_id, staff_id } = req.query;

  let query = `
    SELECT bo.*, s.name AS supplier_name, u.name AS assigned_staff_name,
           c.name AS created_by_name, cl.name AS client_full_name
    FROM back_orders bo
    LEFT JOIN suppliers s ON bo.supplier_id = s.id
    LEFT JOIN users u ON bo.assigned_staff_id = u.id
    LEFT JOIN users c ON bo.created_by = c.id
    LEFT JOIN clients cl ON bo.client_id = cl.id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  if (role === 'CRO') {
    query += ` AND bo.created_by = $${idx++}`;
    params.push(userId);
  } else if (role === 'STAFF') {
    query += ` AND bo.assigned_staff_id = $${idx++}`;
    params.push(userId);
  }

  if (date_from) {
    query += ` AND bo.created_at >= $${idx++}`;
    params.push(date_from);
  }
  if (date_to) {
    query += ` AND bo.created_at <= $${idx++}`;
    params.push(date_to);
  }
  if (status) {
    query += ` AND bo.status = $${idx++}`;
    params.push(status);
  }
  if (client_id) {
    query += ` AND bo.client_id = $${idx++}`;
    params.push(client_id);
  }
  if (supplier_id) {
    query += ` AND bo.supplier_id = $${idx++}`;
    params.push(supplier_id);
  }
  if (staff_id && role === 'ADMIN') {
    query += ` AND bo.assigned_staff_id = $${idx++}`;
    params.push(staff_id);
  }

  query += ' ORDER BY bo.created_at DESC';

  const result = await pool.query(query, params);
  res.json(result.rows);
}

module.exports = { getReport };
