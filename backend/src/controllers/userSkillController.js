const UserSkill = require('../models/UserSkill');
const Skill = require('../models/Skill');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get current user's teach and learn skills
// @route   GET /api/users/me/skills
// @access  Private
const getMySkills = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = { user: req.user._id };

  if (type && ['TEACH', 'LEARN'].includes(type.toUpperCase())) {
    filter.type = type.toUpperCase();
  }

  const userSkills = await UserSkill.find(filter)
    .populate('skill', 'name category description status')
    .sort({ createdAt: -1 });

  const teach = userSkills.filter((item) => item.type === 'TEACH');
  const learn = userSkills.filter((item) => item.type === 'LEARN');

  res.status(200).json({
    success: true,
    total: userSkills.length,
    teach,
    learn,
    data: userSkills
  });
});

// @desc    Add a skill to current user's TEACH or LEARN list
// @route   POST /api/users/me/skills
// @access  Private
const addUserSkill = asyncHandler(async (req, res) => {
  const { skillId, type, proficiency = 'Intermediate', description = '' } = req.body;

  if (!skillId || !type) {
    throw ApiError.badRequest('skillId and type (TEACH or LEARN) are required.');
  }

  const upperType = type.toUpperCase();
  if (!['TEACH', 'LEARN'].includes(upperType)) {
    throw ApiError.badRequest('type must be either TEACH or LEARN.');
  }

  // Verify that the skill exists
  const skill = await Skill.findById(skillId);
  if (!skill) {
    throw ApiError.notFound('Skill not found in catalog.');
  }

  // Non-admins cannot link pending/rejected skills unless they created them
  if (skill.status !== 'approved' && skill.createdBy?.toString() !== req.user._id.toString()) {
    throw ApiError.badRequest('Cannot add a skill that is not yet approved by an admin.');
  }

  // Check for duplicate
  const existing = await UserSkill.findOne({
    user: req.user._id,
    skill: skillId,
    type: upperType
  });

  if (existing) {
    throw ApiError.conflict(`You already have "${skill.name}" listed under ${upperType}.`);
  }

  const userSkill = await UserSkill.create({
    user: req.user._id,
    skill: skillId,
    type: upperType,
    proficiency,
    description
  });

  const populated = await userSkill.populate('skill', 'name category description status');

  res.status(201).json({
    success: true,
    message: `Skill added to your ${upperType} list.`,
    data: populated
  });
});

// @desc    Update a user skill's proficiency or description
// @route   PUT /api/users/me/skills/:id
// @access  Private
const updateUserSkill = asyncHandler(async (req, res) => {
  const { proficiency, description } = req.body;

  const userSkill = await UserSkill.findById(req.params.id);
  if (!userSkill) {
    throw ApiError.notFound('User skill record not found.');
  }

  if (userSkill.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only update your own skill entries.');
  }

  if (proficiency) {
    if (!['Beginner', 'Intermediate', 'Expert'].includes(proficiency)) {
      throw ApiError.badRequest('Proficiency must be Beginner, Intermediate, or Expert.');
    }
    userSkill.proficiency = proficiency;
  }

  if (description !== undefined) {
    userSkill.description = description;
  }

  await userSkill.save();
  const populated = await userSkill.populate('skill', 'name category description status');

  res.status(200).json({
    success: true,
    message: 'User skill updated successfully.',
    data: populated
  });
});

// @desc    Remove a skill from current user's profile
// @route   DELETE /api/users/me/skills/:id
// @access  Private
const deleteUserSkill = asyncHandler(async (req, res) => {
  const userSkill = await UserSkill.findById(req.params.id);
  if (!userSkill) {
    throw ApiError.notFound('User skill record not found.');
  }

  if (userSkill.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only delete your own skill entries.');
  }

  await userSkill.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Skill removed from your profile.'
  });
});

module.exports = {
  getMySkills,
  addUserSkill,
  updateUserSkill,
  deleteUserSkill
};
