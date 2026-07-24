const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { getReport } = require('../controllers/reportController');

const router = express.Router();

router.get('/', verifyToken, getReport);

module.exports = router;
