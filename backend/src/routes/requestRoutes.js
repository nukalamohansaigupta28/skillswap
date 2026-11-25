const express = require('express');
const router = express.Router();

const {
  sendMatchRequest,
  getMatchRequests,
  updateMatchRequestStatus
} = require('../controllers/requestController');

const {
  sendRequestValidator,
  updateRequestStatusValidator
} = require('../validators/matchValidators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Send new swap request
router.post('/', sendRequestValidator, validate, sendMatchRequest);

// List requests (query ?type=received|sent &status=pending|accepted|etc)
router.get('/', getMatchRequests);

// Update status with body { action: 'accept'|'decline'|'cancel' }
router.patch('/:id', updateRequestStatusValidator, validate, updateMatchRequestStatus);

// Convenience subroutes
router.patch('/:id/accept', (req, res, next) => {
  req.body.action = 'accept';
  updateMatchRequestStatus(req, res, next);
});

router.patch('/:id/decline', (req, res, next) => {
  req.body.action = 'decline';
  updateMatchRequestStatus(req, res, next);
});

router.patch('/:id/cancel', (req, res, next) => {
  req.body.action = 'cancel';
  updateMatchRequestStatus(req, res, next);
});

module.exports = router;

