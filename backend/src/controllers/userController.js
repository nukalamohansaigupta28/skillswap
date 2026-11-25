const User = require('../models/User');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
const getMyProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toJSON(),
    data: req.user.toJSON()
  });
});

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, bio, location, availability } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;

  if (location && typeof location === 'object') {
    user.location = {
      city: location.city !== undefined ? location.city : user.location.city,
      country: location.country !== undefined ? location.country : user.location.country,
      coordinates: {
        lat: (location.coordinates && location.coordinates.lat !== undefined) ? location.coordinates.lat : user.location.coordinates.lat,
        lng: (location.coordinates && location.coordinates.lng !== undefined) ? location.coordinates.lng : user.location.coordinates.lng
      }
    };
  }

  if (availability !== undefined && Array.isArray(availability)) {
    user.availability = availability;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: user.toJSON()
  });
});

// @desc    Upload profile photo
// @route   POST /api/users/me/photo
// @access  Private
const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No image file provided');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const relativePath = `/uploads/${req.file.filename}`;
  user.photoUrl = relativePath;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Photo uploaded successfully',
    photoUrl: user.photoUrl,
    user: user.toJSON()
  });
});

// @desc    Get public user profile by ID with their teach and learn skills
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    'name bio location availability photoUrl ratingAverage ratingCount role status createdAt'
  );

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.status === 'suspended') {
    throw ApiError.forbidden('This user profile is currently unavailable.');
  }

  // Populate public skills
  const userSkills = await UserSkill.find({ user: user._id })
    .populate('skill', 'name category description')
    .sort({ type: 1 });

  const teachSkills = userSkills.filter((s) => s.type === 'TEACH');
  const learnSkills = userSkills.filter((s) => s.type === 'LEARN');

  res.status(200).json({
    success: true,
    user: {
      ...user.toJSON(),
      teachSkills,
      learnSkills
    }
  });
});

// @desc    Search public users (browse teachers/learners by skill, type, and location)
// @route   GET /api/users/search
// @access  Public
const searchUsers = asyncHandler(async (req, res) => {
  const { skill, type, location, city, search, page = 1, limit = 10 } = req.query;
  const userQuery = { status: 'active' };

  const targetCity = location || city;
  if (typeof targetCity === 'string' && targetCity.trim()) {
    userQuery['location.city'] = { $regex: new RegExp(targetCity.trim(), 'i') };
  }

  if (typeof search === 'string' && search.trim()) {
    userQuery.$or = [
      { name: { $regex: new RegExp(search.trim(), 'i') } },
      { bio: { $regex: new RegExp(search.trim(), 'i') } }
    ];
  }

  // If filtering by skill name or skill type (e.g. browse teachers of "Guitar")
  if ((typeof skill === 'string' && skill.trim()) || (typeof type === 'string' && type.trim())) {
    const userSkillQuery = {};
    if (typeof type === 'string' && type.trim()) {
      userSkillQuery.type = type.trim().toUpperCase();
    } else {
      userSkillQuery.type = 'TEACH'; // Default to browsing teachers if unspecified
    }

    if (typeof skill === 'string' && skill.trim()) {
      const matchingSkills = await Skill.find({
        name: { $regex: new RegExp(skill.trim(), 'i') },
        status: 'approved'
      }).select('_id');
      const skillIds = matchingSkills.map((s) => s._id);
      userSkillQuery.skill = { $in: skillIds };
    }

    const matchedUserSkills = await UserSkill.find(userSkillQuery).select('user skill');
    const matchedUserIds = [...new Set(matchedUserSkills.map((us) => us.user.toString()))];

    userQuery._id = { $in: matchedUserIds };
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(userQuery)
      .select('name bio location availability photoUrl ratingAverage ratingCount role createdAt')
      .skip(skip)
      .limit(limitNum)
      .sort({ ratingAverage: -1, createdAt: -1 }),
    User.countDocuments(userQuery)
  ]);

  // Attach skills for returned users
  const userIds = users.map((u) => u._id);
  const allUserSkills = await UserSkill.find({ user: { $in: userIds } })
    .populate('skill', 'name category');

  const populatedUsers = users.map((user) => {
    const userObj = user.toJSON();
    const skillsForUser = allUserSkills.filter((s) => s.user.toString() === user._id.toString());
    userObj.teachSkills = skillsForUser.filter((s) => s.type === 'TEACH');
    userObj.learnSkills = skillsForUser.filter((s) => s.type === 'LEARN');
    return userObj;
  });

  res.status(200).json({
    success: true,
    data: populatedUsers,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadPhoto,
  getUserProfile,
  searchUsers
};
