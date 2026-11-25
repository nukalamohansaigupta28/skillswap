const { body, param } = require('express-validator');

const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('bio')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),
  body('location.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City cannot be empty if specified'),
  body('availability')
    .optional()
    .isArray()
    .withMessage('Availability must be an array of schedule slots')
];

const userIdParamValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid User ID format')
];

module.exports = {
  updateProfileValidator,
  userIdParamValidator
};

