const { getRankedMatchesForUser, calculateMatchScore } = require('../services/matchingService');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get ranked match suggestions for current user
// @route   GET /api/matches
// @access  Private
const getRankedMatches = asyncHandler(async (req, res) => {
  const { category, city, matchType, page, limit } = req.query;

  const results = await getRankedMatchesForUser(req.user._id, {
    category,
    city,
    matchType,
    page,
    limit
  });

  res.status(200).json({
    success: true,
    data: results.matches,
    pagination: {
      total: results.total,
      page: results.page,
      limit: results.limit,
      totalPages: results.totalPages
    },
    ...results
  });
});

// @desc    Get detailed match analysis with a specific candidate user
// @route   GET /api/matches/:targetUserId
// @access  Private
const getMatchDetailsWithUser = asyncHandler(async (req, res) => {
  const targetUserId = req.params.targetUserId;

  if (targetUserId === req.user._id.toString()) {
    throw ApiError.badRequest('Cannot calculate match score with yourself.');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser || targetUser.status === 'suspended') {
    throw ApiError.notFound('Target user not found or unavailable.');
  }

  const [currentUserSkills, targetUserSkills] = await Promise.all([
    UserSkill.find({ user: req.user._id }).populate('skill'),
    UserSkill.find({ user: targetUserId }).populate('skill')
  ]);

  const analysis = calculateMatchScore(
    req.user,
    targetUser,
    currentUserSkills,
    targetUserSkills
  );

  res.status(200).json({
    success: true,
    targetUser: {
      _id: targetUser._id,
      name: targetUser.name,
      bio: targetUser.bio,
      location: targetUser.location,
      ratingAverage: targetUser.ratingAverage,
      ratingCount: targetUser.ratingCount,
      photoUrl: targetUser.photoUrl
    },
    ...analysis
  });
});

module.exports = {
  getRankedMatches,
  getMatchDetailsWithUser
};

