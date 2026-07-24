const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { getNextStockCode } = require('../controllers/stockCodeController');

const router = express.Router();

router.get('/next', verifyToken, getNextStockCode);

module.exports = router;
