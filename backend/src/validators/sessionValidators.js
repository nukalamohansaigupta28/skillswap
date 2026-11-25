const { body, param } = require('express-validator');

const proposeSessionValidator = [
  body('matchRequestId')
    .notEmpty()
    .withMessage('matchRequestId is required')
    .isMongoId()
    .withMessage('Invalid matchRequestId format'),
  body('scheduledAt')
    .notEmpty()
    .withMessage('scheduledAt is required')
    .isISO8601()
    .withMessage('scheduledAt must be a valid ISO 8601 date string'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('durationMinutes must be an integer between 15 and 240 minutes'),
  body('mode')
    .notEmpty()
    .withMessage('mode is required')
    .isIn(['online', 'offline'])
    .withMessage('mode must be either online or offline'),
  body('meetingLink')
    .optional()
    .trim(),
  body('locationAddress')
    .optional()
    .trim()
];

const rescheduleSessionValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid session ID format'),
  body('scheduledAt')
    .notEmpty()
    .withMessage('scheduledAt is required')
    .isISO8601()
    .withMessage('scheduledAt must be a valid ISO 8601 date string')
];

module.exports = {
  proposeSessionValidator,
  rescheduleSessionValidator
};

