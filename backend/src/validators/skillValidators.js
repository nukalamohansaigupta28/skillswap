const { body, param, query } = require('express-validator');

const createSkillValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Skill name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Skill name must be between 2 and 100 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'Music',
      'Cooking',
      'Coding',
      'Languages',
      'Sports',
      'Art',
      'Academics',
      'Other'
    ])
    .withMessage('Invalid category specified'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const approveSkillValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Skill ID format'),
  body('status')
    .optional()
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be approved or rejected')
];

const addUserSkillValidator = [
  body('skillId')
    .notEmpty()
    .withMessage('skillId is required')
    .isMongoId()
    .withMessage('Invalid skillId format'),
  body('type')
    .notEmpty()
    .withMessage('type is required')
    .isIn(['TEACH', 'LEARN'])
    .withMessage('type must be either TEACH or LEARN'),
  body('proficiency')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Expert'])
    .withMessage('proficiency must be Beginner, Intermediate, or Expert'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('description cannot exceed 500 characters')
];

module.exports = {
  createSkillValidator,
  approveSkillValidator,
  addUserSkillValidator
};

