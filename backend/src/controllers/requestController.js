const MatchRequest = require('../models/MatchRequest');
const User = require('../models/User');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const { createNotification } = require('../services/notificationService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Send a swap match request (Mutual or One-Way Credit)
// @route   POST /api/requests
// @access  Private
const sendMatchRequest = asyncHandler(async (req, res) => {
  const { receiverId, skillRequestedId, skillOfferedId, matchType = 'MUTUAL', message = '' } = req.body;

  // 1. Prevent self-requests
  if (receiverId === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot send a swap request to yourself.');
  }

  // 2. Verify receiver exists and is active
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw ApiError.notFound('Receiver user does not exist.');
  }
  if (receiver.status === 'suspended') {
    throw ApiError.forbidden('Cannot send request: receiver account is suspended.');
  }

  // 3. Verify requested skill exists and receiver actually teaches it
  const skillRequested = await Skill.findById(skillRequestedId);
  if (!skillRequested) {
    throw ApiError.notFound('Requested skill does not exist.');
  }

  const receiverTeachesSkill = await UserSkill.findOne({
    user: receiverId,
    skill: skillRequestedId,
    type: 'TEACH'
  });
  if (!receiverTeachesSkill) {
    throw ApiError.badRequest(`Receiver does not have "${skillRequested.name}" listed under their TEACH skills.`);
  }

  // 4. Validate offered skill if mutual
  let validatedOfferedSkillId = null;
  const upperType = matchType.toUpperCase();
  if (upperType === 'MUTUAL') {
    if (!skillOfferedId) {
      throw ApiError.badRequest('skillOfferedId is required for MUTUAL match requests.');
    }
    const skillOffered = await Skill.findById(skillOfferedId);
    if (!skillOffered) {
      throw ApiError.notFound('Offered skill does not exist.');
    }
    const senderTeachesSkill = await UserSkill.findOne({
      user: req.user._id,
      skill: skillOfferedId,
      type: 'TEACH'
    });
    if (!senderTeachesSkill) {
      throw ApiError.badRequest(`You do not have "${skillOffered.name}" listed under your TEACH skills.`);
    }
    validatedOfferedSkillId = skillOffered._id;
  } else if (upperType === 'ONE_WAY') {
    // Check sender has at least 1 credit for booking
    if (req.user.creditBalance < 1) {
      throw ApiError.badRequest('Insufficient skill credits. You need at least 1 credit to initiate a one-way swap.');
    }
  } else {
    throw ApiError.badRequest('matchType must be either MUTUAL or ONE_WAY.');
  }

  // 5. Prevent duplicate pending requests
  const existingPendingRequest = await MatchRequest.findOne({
    sender: req.user._id,
    receiver: receiverId,
    status: 'pending'
  });
  if (existingPendingRequest) {
    throw ApiError.conflict('You already have a pending swap request with this user.');
  }

  const matchRequest = await MatchRequest.create({
    sender: req.user._id,
    receiver: receiverId,
    skillOffered: validatedOfferedSkillId,
    skillRequested: skillRequested._id,
    matchType: upperType,
    status: 'pending',
    message: message || ''
  });

  const populated = await matchRequest.populate([
    { path: 'sender', select: 'name bio location photoUrl ratingAverage' },
    { path: 'receiver', select: 'name bio location photoUrl ratingAverage' },
    { path: 'skillOffered', select: 'name category' },
    { path: 'skillRequested', select: 'name category' }
  ]);

  // Dispatch real-time in-app notification to receiver
  await createNotification({
    user: receiverId,
    sender: req.user._id,
    type: 'MATCH_REQUEST',
    title: 'New Skill Swap Request',
    body: `${req.user.name} sent you a ${upperType} swap request for "${skillRequested.name}".`,
    link: '/requests',
    metadata: { matchRequestId: matchRequest._id }
  });

  res.status(201).json({
    success: true,
    message: 'Match swap request sent successfully.',
    data: populated
  });
});

// @desc    Get swap requests (received or sent)
// @route   GET /api/requests
// @access  Private
const getMatchRequests = asyncHandler(async (req, res) => {
  const { type = 'received', status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (type === 'sent') {
    query.sender = req.user._id;
  } else {
    query.receiver = req.user._id;
  }

  if (status && status !== 'all') {
    query.status = status.toLowerCase();
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [requests, total] = await Promise.all([
    MatchRequest.find(query)
      .populate('sender', 'name bio location photoUrl ratingAverage ratingCount')
      .populate('receiver', 'name bio location photoUrl ratingAverage ratingCount')
      .populate('skillOffered', 'name category')
      .populate('skillRequested', 'name category')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }),
    MatchRequest.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    count: requests.length,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    data: requests
  });
});

// @desc    Update request status: accept, decline, or cancel
// @route   PATCH /api/requests/:id
// @access  Private
const updateMatchRequestStatus = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const requestId = req.params.id;

  const matchRequest = await MatchRequest.findById(requestId);
  if (!matchRequest) {
    throw ApiError.notFound('Match request not found.');
  }

  if (matchRequest.status !== 'pending') {
    throw ApiError.badRequest(`Cannot modify request with current status: "${matchRequest.status}".`);
  }

  const isSender = matchRequest.sender.toString() === req.user._id.toString();
  const isReceiver = matchRequest.receiver.toString() === req.user._id.toString();

  if (!isSender && !isReceiver) {
    throw ApiError.forbidden('You are not authorized to update this request.');
  }

  if (action === 'accept') {
    if (!isReceiver) {
      throw ApiError.forbidden('Only the receiver can accept a match request.');
    }
    matchRequest.status = 'accepted';
    matchRequest.respondedAt = new Date();

    // Trigger notification to sender
    await createNotification({
      user: matchRequest.sender,
      sender: req.user._id,
      type: 'REQUEST_ACCEPTED',
      title: 'Swap Request Accepted! 🎉',
      body: `${req.user.name} accepted your swap request! You can now chat and book sessions.`,
      link: `/chat/${req.user._id}`,
      metadata: { matchRequestId: matchRequest._id }
    });
  } else if (action === 'decline') {
    if (!isReceiver) {
      throw ApiError.forbidden('Only the receiver can decline a match request.');
    }
    matchRequest.status = 'declined';
    matchRequest.respondedAt = new Date();

    await createNotification({
      user: matchRequest.sender,
      sender: req.user._id,
      type: 'REQUEST_DECLINED',
      title: 'Swap Request Declined',
      body: `${req.user.name} declined your swap request.`,
      link: '/requests',
      metadata: { matchRequestId: matchRequest._id }
    });
  } else if (action === 'cancel') {
    if (!isSender) {
      throw ApiError.forbidden('Only the sender can cancel a pending match request.');
    }
    matchRequest.status = 'cancelled';
    matchRequest.respondedAt = new Date();
  } else {
    throw ApiError.badRequest('Invalid action. Must be accept, decline, or cancel.');
  }

  await matchRequest.save();

  const populated = await matchRequest.populate([
    { path: 'sender', select: 'name bio location photoUrl' },
    { path: 'receiver', select: 'name bio location photoUrl' },
    { path: 'skillOffered', select: 'name category' },
    { path: 'skillRequested', select: 'name category' }
  ]);

  res.status(200).json({
    success: true,
    message: `Match request ${matchRequest.status} successfully.`,
    data: populated
  });
});

module.exports = {
  sendMatchRequest,
  getMatchRequests,
  updateMatchRequestStatus
};
