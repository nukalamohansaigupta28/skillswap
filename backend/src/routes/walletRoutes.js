const express = require('express');
const router = express.Router();

const { getWallet } = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/wallet - Get credit balance and ledger
router.get('/', getWallet);

module.exports = router;

