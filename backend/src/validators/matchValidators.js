const { body, param, query } = require('express-validator');

const sendRequestValidator = [
  body('receiverId')
    .notEmpty()
    .withMessage('receiverId is required')
    .isMongoId()
    .withMessage('Invalid receiverId format'),
  body('skillRequestedId')
    .notEmpty()
    .withMessage('skillRequestedId is required')
    .isMongoId()
    .withMessage('Invalid skillRequestedId format'),
  body('matchType')
    .optional()
    .isIn(['MUTUAL', 'ONE_WAY'])
    .withMessage('matchType must be either MUTUAL or ONE_WAY'),
  body('skillOfferedId')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Invalid skillOfferedId format'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
];

const updateRequestStatusValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid request ID format'),
  body('action')
    .notEmpty()
    .withMessage('action is required')
    .isIn(['accept', 'decline', 'cancel'])
    .withMessage('action must be accept, decline, or cancel')
];

module.exports = {
  sendRequestValidator,
  updateRequestStatusValidator
};

