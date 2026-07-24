const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createBackOrder,
  getBackOrders,
  getBackOrderById,
  assignBackOrder,
  updateStatus,
} = require('../controllers/backOrderController');

const router = express.Router();

router.post('/', verifyToken, requireRole('ADMIN', 'CRO'), createBackOrder);
router.get('/', verifyToken, getBackOrders);
router.get('/:id', verifyToken, getBackOrderById);
router.patch('/:id/assign', verifyToken, requireRole('ADMIN'), assignBackOrder);
router.patch('/:id/status', verifyToken, requireRole('ADMIN', 'STAFF'), updateStatus);

module.exports = router;
