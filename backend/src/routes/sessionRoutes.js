const express = require('express');
const router = express.Router();

const {
  proposeSession,
  getSessions,
  getSessionById,
  confirmSession,
  rescheduleSession,
  cancelSession,
  completeSession
} = require('../controllers/sessionController');

const {
  proposeSessionValidator,
  rescheduleSessionValidator
} = require('../validators/sessionValidators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Propose a new session
router.post('/', proposeSessionValidator, validate, proposeSession);

// Get user sessions
router.get('/', getSessions);

// Get single session details
router.get('/:id', getSessionById);

// Confirm session
router.patch('/:id/confirm', confirmSession);

// Reschedule session
router.patch('/:id/reschedule', rescheduleSessionValidator, validate, rescheduleSession);

// Cancel session
router.patch('/:id/cancel', cancelSession);

// Mark completed & settle credits
router.patch('/:id/complete', completeSession);

module.exports = router;

