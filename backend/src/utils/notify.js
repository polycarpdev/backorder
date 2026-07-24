const pool = require('../db');
const { sendEmail } = require('./mailer');

async function notify({ userId, type, message, backOrderId }) {
  await pool.query(
    `INSERT INTO notifications (user_id, type, message, back_order_id)
     VALUES ($1, $2, $3, $4)`,
    [userId, type, message, backOrderId || null]
  );

  const userResult = await pool.query('SELECT email, name FROM users WHERE id = $1', [userId]);
  const user = userResult.rows[0];

  if (user) {
    sendEmail({
      to: user.email,
      subject: 'BackOrder Update',
      text: `Hi ${user.name},\n\n${message}\n\nLog in to BackOrder to view details.`,
    });
  }
}

async function notifyAllAdmins({ type, message, backOrderId }) {
  const admins = await pool.query(`SELECT id FROM users WHERE role = 'ADMIN'`);
  for (const admin of admins.rows) {
    await notify({ userId: admin.id, type, message, backOrderId });
  }
}

module.exports = { notify, notifyAllAdmins };
