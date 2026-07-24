const pool = require('../db');

async function getNextStockCode(req, res) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${yy}${mm}-`;

  const result = await pool.query(
    `SELECT stock_code FROM back_orders WHERE stock_code LIKE $1 ORDER BY stock_code DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextNumber = 1;
  if (result.rows.length > 0) {
    const lastCode = result.rows[0].stock_code;
    const lastNumber = parseInt(lastCode.split('-')[1], 10);
    nextNumber = lastNumber + 1;
  }

  const code = `${prefix}${String(nextNumber).padStart(6, '0')}`;
  res.json({ stock_code: code });
}

module.exports = { getNextStockCode };
