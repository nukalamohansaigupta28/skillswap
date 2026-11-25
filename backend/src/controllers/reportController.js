const Report = require('../models/Report');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    File a safety / misconduct report against a user
// @route   POST /api/reports
// @access  Private
const createReport = asyncHandler(async (req, res) => {
  const { reportedUserId, reason, details } = req.body;
  const currentUserId = req.user._id;

  if (!reportedUserId || !reason || !details) {
    throw ApiError.badRequest('reportedUserId, reason, and details are required.');
  }

  if (reportedUserId.toString() === currentUserId.toString()) {
    throw ApiError.badRequest('You cannot submit a report against yourself.');
  }

  const reportedUser = await User.findById(reportedUserId);
  if (!reportedUser) {
    throw ApiError.notFound('Reported user could not be found.');
  }

  const report = await Report.create({
    reporter: currentUserId,
    reportedUser: reportedUserId,
    reason,
    details: details.trim(),
    status: 'open'
  });

  const populated = await report.populate([
    { path: 'reporter', select: 'name email' },
    { path: 'reportedUser', select: 'name email status' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Report submitted successfully. Our safety moderation team will investigate.',
    data: populated
  });
});

module.exports = {
  createReport
};

