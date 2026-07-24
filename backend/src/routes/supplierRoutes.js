const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { getSuppliers, createSupplier } = require('../controllers/supplierController');

const router = express.Router();

router.get('/', verifyToken, getSuppliers);
router.post('/', verifyToken, requireRole('ADMIN'), createSupplier);

module.exports = router;
