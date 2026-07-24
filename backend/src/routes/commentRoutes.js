const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getComments,
  createComment,
  applyChangeRequest,
  dismissChangeRequest,
} = require('../controllers/commentController');

const router = express.Router();

router.get('/back-orders/:backOrderId/comments', verifyToken, getComments);
router.post('/back-orders/:backOrderId/comments', verifyToken, createComment);
router.patch('/comments/:commentId/apply', verifyToken, requireRole('ADMIN'), applyChangeRequest);
router.patch('/comments/:commentId/dismiss', verifyToken, requireRole('ADMIN'), dismissChangeRequest);

module.exports = router;
