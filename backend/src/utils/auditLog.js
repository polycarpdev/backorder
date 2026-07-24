const pool = require('../db');

async function logAction({ entityType, entityId, backOrderId, userId, action, fieldChanged, oldValue, newValue }) {
  await pool.query(
    `INSERT INTO audit_logs (entity_type, entity_id, back_order_id, user_id, action, field_changed, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [entityType, entityId, backOrderId || null, userId, action, fieldChanged || null, oldValue || null, newValue || null]
  );
}

module.exports = { logAction };
