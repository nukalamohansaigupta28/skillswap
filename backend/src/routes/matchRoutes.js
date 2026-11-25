const express = require('express');
const router = express.Router();

const { getRankedMatches, getMatchDetailsWithUser } = require('../controllers/matchController');
const { authenticate } = require('../middleware/auth');

// All match endpoints require authentication
router.use(authenticate);

// GET /api/matches - Retrieve ranked match suggestions
router.get('/', getRankedMatches);

// GET /api/matches/:targetUserId - Deep match score breakdown with specific user
router.get('/:targetUserId', getMatchDetailsWithUser);

module.exports = router;

