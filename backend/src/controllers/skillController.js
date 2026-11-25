const Skill = require('../models/Skill');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get skill catalog (with search, category filter, and pagination)
// @route   GET /api/skills
// @access  Public
const getSkills = asyncHandler(async (req, res) => {
  const { search, category, status, page = 1, limit = 20 } = req.query;

  const query = {};

  // Regular users see approved skills; admins can specify status or view all
  if (status) {
    if (req.user && req.user.role === 'admin') {
      if (status !== 'all') {
        query.status = status;
      }
    } else {
      query.status = 'approved';
    }
  } else {
    query.status = 'approved';
  }

  if (category) {
    query.category = category;
  }

  if (search) {
    query.name = { $regex: new RegExp(search.trim(), 'i') };
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [skills, total] = await Promise.all([
    Skill.find(query)
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(limitNum)
      .sort({ name: 1 }),
    Skill.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    count: skills.length,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    data: skills
  });
});

// @desc    Suggest / Propose a new skill
// @route   POST /api/skills
// @access  Private (Authenticated User)
const createSkill = asyncHandler(async (req, res) => {
  const { name, category, description } = req.body;

  if (!name || !category) {
    throw ApiError.badRequest('Skill name and category are required.');
  }

  // Case-insensitive check for existing skill
  const existing = await Skill.findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
  });

  if (existing) {
    throw ApiError.conflict(`Skill "${name}" already exists in category "${existing.category}".`);
  }

  // Admins can automatically approve skills they create
  const initialStatus = req.user.role === 'admin' ? 'approved' : 'pending';

  const skill = await Skill.create({
    name: name.trim(),
    category,
    description: description || '',
    status: initialStatus,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: initialStatus === 'approved' 
      ? 'Skill created and automatically approved.' 
      : 'Skill submitted for admin approval.',
    data: skill
  });
});

// @desc    Approve or reject a suggested custom skill
// @route   PATCH /api/skills/:id/approve
// @access  Private (Admin Only)
const approveSkill = asyncHandler(async (req, res) => {
  const { status = 'approved' } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    throw ApiError.badRequest('Status must be either "approved" or "rejected".');
  }

  const skill = await Skill.findById(req.params.id);
  if (!skill) {
    throw ApiError.notFound('Skill not found.');
  }

  skill.status = status;
  await skill.save();

  res.status(200).json({
    success: true,
    message: `Skill status updated to ${status}.`,
    data: skill
  });
});

module.exports = {
  getSkills,
  createSkill,
  approveSkill
};
