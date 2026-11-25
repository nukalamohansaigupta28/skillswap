const User = require('../models/User');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const Session = require('../models/Session');
const Review = require('../models/Review');
const Report = require('../models/Report');
const CreditTransaction = require('../models/CreditTransaction');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Admin: List and search users
// @route   GET /api/admin/users
// @access  Private (Admin Only)
const getAdminUsers = asyncHandler(async (req, res) => {
  const { search, role, status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (typeof search === 'string' && search.trim()) {
    query.$or = [
      { name: { $regex: new RegExp(search.trim(), 'i') } },
      { email: { $regex: new RegExp(search.trim(), 'i') } },
      { 'location.city': { $regex: new RegExp(search.trim(), 'i') } }
    ];
  }

  if (typeof role === 'string' && role.trim()) query.role = role.trim();
  if (typeof status === 'string' && status.trim()) query.status = status.trim();

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-passwordHash')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }),
    User.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    data: users
  });
});

// @desc    Admin: Suspend or activate user
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin Only)
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const targetUserId = req.params.id;

  if (!['active', 'suspended'].includes(status)) {
    throw ApiError.badRequest('Status must be either "active" or "suspended".');
  }

  // Prevent admin from suspending themselves
  if (targetUserId === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot suspend your own admin account.');
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  user.status = status;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User account status updated to "${status}".`,
    data: user.toJSON()
  });
});

// @desc    Admin: List safety and abuse reports
// @route   GET /api/admin/reports
// @access  Private (Admin Only)
const getAdminReports = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (typeof status === 'string' && status.trim() && status !== 'all') {
    query.status = status.trim();
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [reports, total] = await Promise.all([
    Report.find(query)
      .populate('reporter', 'name email photoUrl')
      .populate('reportedUser', 'name email status ratingAverage')
      .populate('resolvedBy', 'name')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }),
    Report.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    count: reports.length,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    data: reports
  });
});

// @desc    Admin: Resolve or dismiss safety report
// @route   PATCH /api/admin/reports/:id
// @access  Private (Admin Only)
const updateReportStatus = asyncHandler(async (req, res) => {
  const { status, resolutionNotes = '' } = req.body;

  if (!['open', 'investigating', 'resolved', 'dismissed'].includes(status)) {
    throw ApiError.badRequest('Invalid status. Must be open, investigating, resolved, or dismissed.');
  }

  const report = await Report.findById(req.params.id);
  if (!report) {
    throw ApiError.notFound('Report not found.');
  }

  report.status = status;
  report.resolutionNotes = resolutionNotes;
  report.resolvedBy = req.user._id;
  await report.save();

  const populated = await report.populate([
    { path: 'reporter', select: 'name email' },
    { path: 'reportedUser', select: 'name email status' },
    { path: 'resolvedBy', select: 'name' }
  ]);

  res.status(200).json({
    success: true,
    message: `Report marked as "${status}".`,
    data: populated
  });
});

// @desc    Admin: System Analytics & Platform Health Metrics
// @route   GET /api/admin/analytics
// @access  Private (Admin Only)
const getAdminAnalytics = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. User metrics
  const [totalUsers, activeUsers30Days, totalSessions, completedSessions] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } }),
    Session.countDocuments({}),
    Session.countDocuments({ status: 'completed' })
  ]);

  // 2. Credits circulated (sum of positive EARN + BONUS transactions)
  const creditCirculationResult = await CreditTransaction.aggregate([
    { $match: { type: { $in: ['EARN', 'BONUS'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const creditsCirculated = creditCirculationResult.length > 0 ? creditCirculationResult[0].total : 0;

  // 3. Platform average rating
  const avgRatingResult = await Review.aggregate([
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  const platformAverageRating = avgRatingResult.length > 0
    ? Math.round(avgRatingResult[0].avg * 10) / 10
    : 0;
  const totalReviewsCount = avgRatingResult.length > 0 ? avgRatingResult[0].count : 0;

  // 4. Top 10 popular skills by user participation
  const topSkillsResult = await UserSkill.aggregate([
    { $group: { _id: '$skill', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'skills',
        localField: '_id',
        foreignField: '_id',
        as: 'skillInfo'
      }
    },
    { $unwind: '$skillInfo' },
    {
      $project: {
        _id: 1,
        name: '$skillInfo.name',
        category: '$skillInfo.category',
        userCount: '$count'
      }
    }
  ]);

  // 5. Sessions per week (last 4 weeks)
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const weeklySessionsResult = await Session.aggregate([
    { $match: { createdAt: { $gte: fourWeeksAgo } } },
    {
      $group: {
        _id: { $week: '$createdAt' },
        count: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  const openReportsCount = await Report.countDocuments({ status: 'open' });

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        activeLast30Days: activeUsers30Days
      },
      sessions: {
        total: totalSessions,
        completed: completedSessions,
        sessionsPerWeek: weeklySessionsResult.map((w) => ({
          week: `Week ${w._id}`,
          total: w.count,
          completed: w.completed
        }))
      },
      credits: {
        totalCirculated: creditsCirculated
      },
      ratings: {
        platformAverage: platformAverageRating,
        totalReviews: totalReviewsCount
      },
      top10Skills: topSkillsResult,
      moderation: {
        openReports: openReportsCount
      }
    }
  });
});

module.exports = {
  getAdminUsers,
  updateUserStatus,
  getAdminReports,
  updateReportStatus,
  getAdminAnalytics
};
