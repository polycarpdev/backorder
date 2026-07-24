const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { searchClients, getClientById } = require('../controllers/clientController');

const router = express.Router();

router.get('/', verifyToken, searchClients);
router.get('/:id', verifyToken, getClientById);

module.exports = router;
