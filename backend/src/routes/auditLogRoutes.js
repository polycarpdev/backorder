const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { getAuditLogs } = require('../controllers/auditLogController');

const router = express.Router();

router.get('/', verifyToken, requireRole('ADMIN'), getAuditLogs);

module.exports = router;
