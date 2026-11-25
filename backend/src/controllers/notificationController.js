const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { read, page = 1, limit = 20 } = req.query;
  const currentUserId = req.user._id;

  const query = { user: currentUserId };
  if (read !== undefined) {
    query.read = read === 'true';
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .populate('sender', 'name photoUrl')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: currentUserId, read: false })
  ]);

  res.status(200).json({
    success: true,
    unreadCount,
    count: notifications.length,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    data: notifications
  });
});

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw ApiError.notFound('Notification not found.');
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You are not authorized to update this notification.');
  }

  notification.read = true;
  notification.readAt = new Date();
  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Notification marked as read.',
    data: notification
  });
});

// @desc    Mark all user notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true, readAt: new Date() }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read.',
    modifiedCount: result.modifiedCount
  });
});

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};

