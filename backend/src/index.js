const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const backOrderRoutes = require('./routes/backOrderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/back-orders', backOrderRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
