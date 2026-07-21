const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createBackOrder,
  getBackOrders,
  getBackOrderById,
} = require('../controllers/backOrderController');

const router = express.Router();

router.post('/', verifyToken, requireRole('ADMIN', 'CRO'), createBackOrder);
router.get('/', verifyToken, getBackOrders);
router.get('/:id', verifyToken, getBackOrderById);

module.exports = router;
