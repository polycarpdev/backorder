require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./db');

async function seed() {
  const passwordHash = await bcrypt.hash('changeme123', 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    ['Polycarp', 'admin@backorder.local', passwordHash, 'ADMIN']
  );
  console.log('Admin user seeded (or already existed).');
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
