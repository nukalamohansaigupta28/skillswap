const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Submit a review after a completed session
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { sessionId, rating, comment = '' } = req.body;
  const currentUserId = req.user._id;

  if (!sessionId || !rating) {
    throw ApiError.badRequest('sessionId and rating (1-5) are required.');
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    throw ApiError.badRequest('Rating must be an integer between 1 and 5.');
  }

  // 1. Verify session exists and is completed
  const session = await Session.findById(sessionId);
  if (!session) {
    throw ApiError.notFound('Session not found.');
  }

  if (session.status !== 'completed') {
    throw ApiError.badRequest(
      `Reviews can only be submitted after a session is completed. Current status: "${session.status}".`
    );
  }

  // 2. Verify current user was a participant in the session
  const isTeacher = session.teacher.toString() === currentUserId.toString();
  const isLearner = session.learner.toString() === currentUserId.toString();

  if (!isTeacher && !isLearner) {
    throw ApiError.forbidden('You were not a participant in this session.');
  }

  // 3. Determine the reviewee (the other participant)
  const revieweeId = isTeacher ? session.learner : session.teacher;

  // 4. Strictly one review per user per session
  const existingReview = await Review.findOne({
    session: session._id,
    reviewer: currentUserId
  });

  if (existingReview) {
    throw ApiError.conflict('You have already submitted a review for this session.');
  }

  const review = await Review.create({
    session: session._id,
    reviewer: currentUserId,
    reviewee: revieweeId,
    rating: numRating,
    comment: comment.trim()
  });

  const populated = await review.populate([
    { path: 'reviewer', select: 'name photoUrl' },
    { path: 'reviewee', select: 'name ratingAverage ratingCount' },
    { path: 'session', select: 'scheduledAt durationMinutes skill' }
  ]);

  // Dispatch notification to reviewee
  await createNotification({
    user: revieweeId,
    sender: currentUserId,
    type: 'NEW_REVIEW',
    title: 'New Review Received! ⭐',
    body: `${req.user.name} left you a ${numRating}-star review: "${comment.trim().substring(0, 60)}"`,
    link: `/profile/${revieweeId}`,
    metadata: { reviewId: review._id, sessionId: session._id }
  });

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully. Recipient rating updated.',
    data: populated
  });
});

// @desc    Get reviews received by a user
// @route   GET /api/reviews/user/:id (and GET /api/users/:id/reviews)
// @access  Public
const getUserReviews = asyncHandler(async (req, res) => {
  const targetUserId = req.params.id || req.params.userId;
  const { page = 1, limit = 10 } = req.query;

  const user = await User.findById(targetUserId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    Review.find({ reviewee: targetUserId })
      .populate('reviewer', 'name photoUrl location')
      .populate({
        path: 'session',
        select: 'scheduledAt skill durationMinutes',
        populate: { path: 'skill', select: 'name category' }
      })
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }),
    Review.countDocuments({ reviewee: targetUserId })
  ]);

  res.status(200).json({
    success: true,
    count: reviews.length,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    ratingSummary: {
      average: user.ratingAverage,
      count: user.ratingCount
    },
    data: reviews
  });
});

module.exports = {
  createReview,
  getUserReviews
};

