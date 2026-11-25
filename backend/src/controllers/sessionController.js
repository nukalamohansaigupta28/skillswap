const Session = require('../models/Session');
const MatchRequest = require('../models/MatchRequest');
const User = require('../models/User');
const Skill = require('../models/Skill');
const { transferSessionCredits, calculateCreditAmount } = require('../services/walletService');
const { createNotification } = require('../services/notificationService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Propose a new learning session
// @route   POST /api/sessions
// @access  Private
const proposeSession = asyncHandler(async (req, res) => {
  const {
    matchRequestId,
    skillId,
    scheduledAt,
    durationMinutes = 60,
    mode,
    meetingLink = '',
    locationAddress = ''
  } = req.body;

  // 1. Verify match request exists and was accepted
  const matchRequest = await MatchRequest.findById(matchRequestId);
  if (!matchRequest) {
    throw ApiError.notFound('Match request not found.');
  }

  if (matchRequest.status !== 'accepted') {
    throw ApiError.badRequest(
      `Sessions can only be scheduled for accepted match requests. Current status: "${matchRequest.status}".`
    );
  }

  // 2. Verify current user is party to this match request
  const isSender = matchRequest.sender.toString() === req.user._id.toString();
  const isReceiver = matchRequest.receiver.toString() === req.user._id.toString();

  if (!isSender && !isReceiver) {
    throw ApiError.forbidden('You are not authorized to schedule sessions for this match request.');
  }

  // 3. Determine Teacher and Learner
  let teacherId;
  let learnerId;
  let targetSkillId = skillId || matchRequest.skillRequested;

  if (matchRequest.matchType === 'ONE_WAY') {
    teacherId = matchRequest.receiver;
    learnerId = matchRequest.sender;
    targetSkillId = matchRequest.skillRequested;
  } else {
    // Mutual match: inspect requested vs offered skill
    if (skillId && matchRequest.skillOffered && skillId.toString() === matchRequest.skillOffered.toString()) {
      teacherId = matchRequest.sender;
      learnerId = matchRequest.receiver;
    } else {
      teacherId = matchRequest.receiver;
      learnerId = matchRequest.sender;
      targetSkillId = matchRequest.skillRequested;
    }
  }

  // 4. Verify scheduled date is in the future
  const sessionDate = new Date(scheduledAt);
  if (isNaN(sessionDate.getTime()) || sessionDate <= new Date()) {
    throw ApiError.badRequest('Session scheduledAt must be a valid future date and time.');
  }

  // 5. Verify duration
  const duration = parseInt(durationMinutes, 10);
  if (isNaN(duration) || duration < 15 || duration > 240) {
    throw ApiError.badRequest('durationMinutes must be between 15 and 240 minutes.');
  }

  // 6. Check learner credit balance
  const requiredCredits = calculateCreditAmount(duration);
  const learner = await User.findById(learnerId);
  if (!learner) {
    throw ApiError.notFound('Learner user not found.');
  }
  if (learner.creditBalance < requiredCredits) {
    throw ApiError.badRequest(
      `Learner has insufficient credits (${learner.creditBalance}) for this ${duration}-minute session (${requiredCredits} credits required).`
    );
  }

  // 7. Validate mode details
  if (mode === 'offline' && !locationAddress) {
    throw ApiError.badRequest('locationAddress is required for offline sessions.');
  }

  const session = await Session.create({
    matchRequest: matchRequest._id,
    teacher: teacherId,
    learner: learnerId,
    skill: targetSkillId,
    scheduledAt: sessionDate,
    durationMinutes: duration,
    mode,
    meetingLink: meetingLink || (mode === 'online' ? 'https://meet.jit.si/skillswap-' + Date.now() : ''),
    locationAddress: locationAddress || '',
    status: 'proposed',
    proposedBy: req.user._id,
    completionConfirmation: {
      teacherConfirmed: false,
      learnerConfirmed: false
    },
    creditsTransferred: false
  });

  const populated = await session.populate([
    { path: 'teacher', select: 'name bio location photoUrl ratingAverage' },
    { path: 'learner', select: 'name bio location photoUrl ratingAverage' },
    { path: 'skill', select: 'name category' },
    { path: 'proposedBy', select: 'name' }
  ]);

  // Notify the other user about the proposed session
  const otherUserId = req.user._id.toString() === teacherId.toString() ? learnerId : teacherId;
  await createNotification({
    user: otherUserId,
    sender: req.user._id,
    type: 'SESSION_PROPOSED',
    title: 'New Session Proposed',
    body: `${req.user.name} proposed a ${duration}-minute session for "${populated.skill?.name}" on ${sessionDate.toLocaleDateString()}.`,
    link: '/sessions',
    metadata: { sessionId: session._id }
  });

  res.status(201).json({
    success: true,
    message: 'Session proposed successfully. Awaiting confirmation.',
    data: populated
  });
});

// @desc    Get user sessions (filter by upcoming/past/status)
// @route   GET /api/sessions
// @access  Private
const getSessions = asyncHandler(async (req, res) => {
  const { status, timeframe, page = 1, limit = 20 } = req.query;
  const currentUserId = req.user._id;

  const query = {
    $or: [{ teacher: currentUserId }, { learner: currentUserId }]
  };

  if (status && status !== 'all') {
    query.status = status;
  }

  const now = new Date();
  if (timeframe === 'upcoming') {
    query.scheduledAt = { $gte: now };
    if (!status) query.status = { $in: ['proposed', 'confirmed', 'rescheduled'] };
  } else if (timeframe === 'past') {
    query.$or = [
      { scheduledAt: { $lt: now } },
      { status: { $in: ['completed', 'cancelled'] } }
    ];
    query.$and = [{ $or: [{ teacher: currentUserId }, { learner: currentUserId }] }];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [sessions, total] = await Promise.all([
    Session.find(query)
      .populate('teacher', 'name bio location photoUrl ratingAverage')
      .populate('learner', 'name bio location photoUrl ratingAverage')
      .populate('skill', 'name category')
      .skip(skip)
      .limit(limitNum)
      .sort({ scheduledAt: 1 }),
    Session.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    count: sessions.length,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    data: sessions
  });
});

// @desc    Get single session by ID
// @route   GET /api/sessions/:id
// @access  Private
const getSessionById = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id)
    .populate('teacher', 'name bio location photoUrl ratingAverage')
    .populate('learner', 'name bio location photoUrl ratingAverage')
    .populate('skill', 'name category')
    .populate('proposedBy', 'name');

  if (!session) {
    throw ApiError.notFound('Session not found.');
  }

  const isTeacher = session.teacher._id.toString() === req.user._id.toString();
  const isLearner = session.learner._id.toString() === req.user._id.toString();

  if (!isTeacher && !isLearner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You are not authorized to view this session.');
  }

  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    Confirm a proposed or rescheduled session
// @route   PATCH /api/sessions/:id/confirm
// @access  Private
const confirmSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    throw ApiError.notFound('Session not found.');
  }

  const isTeacher = session.teacher.toString() === req.user._id.toString();
  const isLearner = session.learner.toString() === req.user._id.toString();

  if (!isTeacher && !isLearner) {
    throw ApiError.forbidden('You are not a participant in this session.');
  }

  if (session.status !== 'proposed' && session.status !== 'rescheduled') {
    throw ApiError.badRequest(`Cannot confirm session with status: "${session.status}".`);
  }

  // Proposer cannot confirm their own proposal
  if (session.proposedBy.toString() === req.user._id.toString()) {
    throw ApiError.badRequest('You proposed this session time; waiting for the other party to confirm.');
  }

  session.status = 'confirmed';
  await session.save();

  const populated = await session.populate([
    { path: 'teacher', select: 'name photoUrl' },
    { path: 'learner', select: 'name photoUrl' },
    { path: 'skill', select: 'name category' }
  ]);

  // Notify the session proposer that their proposal was confirmed
  await createNotification({
    user: session.proposedBy,
    sender: req.user._id,
    type: 'SESSION_CONFIRMED',
    title: 'Session Confirmed! 📅',
    body: `${req.user.name} confirmed the session for "${populated.skill?.name}".`,
    link: '/sessions',
    metadata: { sessionId: session._id }
  });

  res.status(200).json({
    success: true,
    message: 'Session confirmed successfully.',
    data: populated
  });
});

// @desc    Reschedule a session to a new date/time
// @route   PATCH /api/sessions/:id/reschedule
// @access  Private
const rescheduleSession = asyncHandler(async (req, res) => {
  const { scheduledAt } = req.body;

  const session = await Session.findById(req.params.id);
  if (!session) {
    throw ApiError.notFound('Session not found.');
  }

  const isTeacher = session.teacher.toString() === req.user._id.toString();
  const isLearner = session.learner.toString() === req.user._id.toString();

  if (!isTeacher && !isLearner) {
    throw ApiError.forbidden('You are not a participant in this session.');
  }

  if (session.status === 'completed' || session.status === 'cancelled') {
    throw ApiError.badRequest(`Cannot reschedule a ${session.status} session.`);
  }

  const newDate = new Date(scheduledAt);
  if (isNaN(newDate.getTime()) || newDate <= new Date()) {
    throw ApiError.badRequest('scheduledAt must be a valid future date.');
  }

  session.scheduledAt = newDate;
  session.status = 'rescheduled';
  session.proposedBy = req.user._id;
  session.reminderSent = false;
  session.completionConfirmation = {
    teacherConfirmed: false,
    learnerConfirmed: false
  };

  await session.save();

  const otherUserId = isTeacher ? session.learner : session.teacher;
  await createNotification({
    user: otherUserId,
    sender: req.user._id,
    type: 'SESSION_PROPOSED',
    title: 'Session Rescheduled',
    body: `${req.user.name} proposed rescheduling your session to ${newDate.toLocaleDateString()}.`,
    link: '/sessions',
    metadata: { sessionId: session._id }
  });

  res.status(200).json({
    success: true,
    message: 'Session reschedule proposed. Awaiting confirmation.',
    data: session
  });
});

// @desc    Cancel a session
// @route   PATCH /api/sessions/:id/cancel
// @access  Private
const cancelSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    throw ApiError.notFound('Session not found.');
  }

  const isTeacher = session.teacher.toString() === req.user._id.toString();
  const isLearner = session.learner.toString() === req.user._id.toString();

  if (!isTeacher && !isLearner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You are not authorized to cancel this session.');
  }

  if (session.status === 'completed') {
    throw ApiError.badRequest('Completed sessions cannot be cancelled.');
  }

  session.status = 'cancelled';
  await session.save();

  const otherUserId = isTeacher ? session.learner : session.teacher;
  await createNotification({
    user: otherUserId,
    sender: req.user._id,
    type: 'SESSION_CANCELLED',
    title: 'Session Cancelled',
    body: `${req.user.name} cancelled the scheduled session.`,
    link: '/sessions',
    metadata: { sessionId: session._id }
  });

  res.status(200).json({
    success: true,
    message: 'Session cancelled. Zero credits were transferred.',
    data: session
  });
});

// @desc    Mark session completion and trigger atomic credit settlement
// @route   PATCH /api/sessions/:id/complete
// @access  Private
const completeSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    throw ApiError.notFound('Session not found.');
  }

  const isTeacher = session.teacher.toString() === req.user._id.toString();
  const isLearner = session.learner.toString() === req.user._id.toString();

  if (!isTeacher && !isLearner) {
    throw ApiError.forbidden('You are not a participant in this session.');
  }

  if (session.status === 'cancelled') {
    throw ApiError.badRequest('Cannot complete a cancelled session.');
  }

  const now = new Date();
  if (isTeacher) {
    session.completionConfirmation.teacherConfirmed = true;
    session.completionConfirmation.teacherConfirmedAt = now;
  }
  if (isLearner) {
    session.completionConfirmation.learnerConfirmed = true;
    session.completionConfirmation.learnerConfirmedAt = now;
  }

  await session.save();

  // If both confirmed and credits not yet transferred, execute atomic credit transfer
  let settlementResult = null;
  const bothConfirmed =
    session.completionConfirmation.teacherConfirmed &&
    session.completionConfirmation.learnerConfirmed;

  if (bothConfirmed && !session.creditsTransferred) {
    settlementResult = await transferSessionCredits(session);

    // Notify teacher of earned credit
    await createNotification({
      user: session.teacher,
      sender: session.learner,
      type: 'CREDIT_EARNED',
      title: 'Credits Earned! ⭐',
      body: `You earned ${settlementResult.credits} credit(s) for teaching your session!`,
      link: '/wallet',
      metadata: { sessionId: session._id }
    });

    // Notify learner of spent credit
    await createNotification({
      user: session.learner,
      sender: session.teacher,
      type: 'CREDIT_SPENT',
      title: 'Session Completed',
      body: `Your learning session has been completed and ${settlementResult.credits} credit(s) transferred.`,
      link: '/wallet',
      metadata: { sessionId: session._id }
    });
  }

  const freshSession = await Session.findById(session._id).populate([
    { path: 'teacher', select: 'name creditBalance' },
    { path: 'learner', select: 'name creditBalance' },
    { path: 'skill', select: 'name category' }
  ]);

  res.status(200).json({
    success: true,
    message: bothConfirmed
      ? 'Session marked completed by both users! Credits transferred successfully.'
      : 'Completion confirmed. Waiting for the other party to confirm.',
    settlement: settlementResult,
    data: freshSession
  });
});

module.exports = {
  proposeSession,
  getSessions,
  getSessionById,
  confirmSession,
  rescheduleSession,
  cancelSession,
  completeSession
};
