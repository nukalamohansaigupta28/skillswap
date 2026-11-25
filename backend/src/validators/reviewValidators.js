const { body, param } = require('express-validator');

const createReviewValidator = [
  body('sessionId')
    .notEmpty()
    .withMessage('sessionId is required')
    .isMongoId()
    .withMessage('Invalid sessionId format'),
  body('rating')
    .notEmpty()
    .withMessage('rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('rating must be an integer between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('comment cannot exceed 1000 characters')
];

const createReportValidator = [
  body('reportedUserId')
    .notEmpty()
    .withMessage('reportedUserId is required')
    .isMongoId()
    .withMessage('Invalid reportedUserId format'),
  body('reason')
    .notEmpty()
    .withMessage('reason is required')
    .isIn([
      'INAPPROPRIATE_BEHAVIOR',
      'NO_SHOW',
      'HARASSMENT',
      'SPAM',
      'FRAUD',
      'OTHER'
    ])
    .withMessage('Invalid reason specified'),
  body('details')
    .trim()
    .notEmpty()
    .withMessage('details are required')
    .isLength({ max: 2000 })
    .withMessage('details cannot exceed 2000 characters')
];

module.exports = {
  createReviewValidator,
  createReportValidator
};

