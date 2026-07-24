const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { getUsers, createUser, updateUser, setUserActiveStatus } = require('../controllers/userController');

const router = express.Router();

router.get('/', verifyToken, requireRole('ADMIN'), getUsers);
router.post('/', verifyToken, requireRole('ADMIN'), createUser);
router.patch('/:id', verifyToken, requireRole('ADMIN'), updateUser);
router.patch('/:id/active', verifyToken, requireRole('ADMIN'), setUserActiveStatus);

module.exports = router;
