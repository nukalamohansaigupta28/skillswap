const express = require('express');
const router = express.Router();

const { getSkills, createSkill, approveSkill } = require('../controllers/skillController');
const { createSkillValidator, approveSkillValidator } = require('../validators/skillValidators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

// Public route to browse approved skills
router.get('/', getSkills);

// Authenticated user can propose a new custom skill
router.post('/', authenticate, createSkillValidator, validate, createSkill);

// Admin-only route to approve/reject a pending skill
router.patch(
  '/:id/approve',
  authenticate,
  authorizeRoles('admin'),
  approveSkillValidator,
  validate,
  approveSkill
);

module.exports = router;

