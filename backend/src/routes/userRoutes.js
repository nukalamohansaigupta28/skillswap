const express = require('express');
const router = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  uploadPhoto,
  getUserProfile,
  searchUsers
} = require('../controllers/userController');

const {
  getMySkills,
  addUserSkill,
  updateUserSkill,
  deleteUserSkill
} = require('../controllers/userSkillController');

const { getUserReviews } = require('../controllers/reviewController');

const { updateProfileValidator, userIdParamValidator } = require('../validators/userValidators');
const { addUserSkillValidator } = require('../validators/skillValidators');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public route to browse/search teachers & learners
router.get('/search', searchUsers);

// Authenticated current user profile
router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, updateProfileValidator, validate, updateMyProfile);
router.post('/me/photo', authenticate, upload.single('photo'), uploadPhoto);

// Authenticated user skills (TEACH / LEARN)
router.get('/me/skills', authenticate, getMySkills);
router.post('/me/skills', authenticate, addUserSkillValidator, validate, addUserSkill);
router.put('/me/skills/:id', authenticate, updateUserSkill);
router.delete('/me/skills/:id', authenticate, deleteUserSkill);

// Public route to get a user's reviews
router.get('/:id/reviews', userIdParamValidator, validate, getUserReviews);

// Public route to view a user profile by ID
router.get('/:id', userIdParamValidator, validate, getUserProfile);

module.exports = router;
