const Message = require('../models/Message');
const MatchRequest = require('../models/MatchRequest');
const User = require('../models/User');
const { getIO, isUserOnline } = require('../services/socketService');
const { createNotification } = require('../services/notificationService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all conversation threads for current user
// @route   GET /api/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  // 1. Find all accepted matches for the user
  const acceptedMatches = await MatchRequest.find({
    $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    status: 'accepted'
  }).populate('sender receiver skillRequested skillOffered');

  // Extract distinct conversation partner IDs
  const partnerMap = new Map();
  for (const match of acceptedMatches) {
    const isSender = match.sender._id.toString() === currentUserId.toString();
    const partner = isSender ? match.receiver : match.sender;
    const partnerId = partner._id.toString();

    if (!partnerMap.has(partnerId)) {
      partnerMap.set(partnerId, {
        partner: {
          _id: partner._id,
          name: partner.name,
          photoUrl: partner.photoUrl,
          location: partner.location,
          ratingAverage: partner.ratingAverage
        },
        matchRequest: {
          _id: match._id,
          matchType: match.matchType,
          skillRequested: match.skillRequested?.name,
          skillOffered: match.skillOffered?.name
        },
        conversationId: Message.getConversationId(currentUserId, partner._id)
      });
    }
  }

  // 2. Fetch last message and unread count for each conversation
  const conversationList = [];
  for (const [partnerId, data] of partnerMap.entries()) {
    const lastMessage = await Message.findOne({ conversationId: data.conversationId })
      .sort({ createdAt: -1 });

    const unreadCount = await Message.countDocuments({
      conversationId: data.conversationId,
      receiver: currentUserId,
      readAt: null
    });

    conversationList.push({
      ...data,
      lastMessage: lastMessage ? {
        text: lastMessage.text,
        sender: lastMessage.sender,
        createdAt: lastMessage.createdAt,
        readAt: lastMessage.readAt
      } : null,
      unreadCount,
      isPartnerOnline: isUserOnline(partnerId)
    });
  }

  // Sort by last message date descending
  conversationList.sort((a, b) => {
    const dateA = a.lastMessage?.createdAt || new Date(0);
    const dateB = b.lastMessage?.createdAt || new Date(0);
    return new Date(dateB) - new Date(dateA);
  });

  res.status(200).json({
    success: true,
    count: conversationList.length,
    data: conversationList
  });
});

// @desc    Get paginated message history with a matched user
// @route   GET /api/conversations/:targetUserId/messages
// @access  Private
const getMessagesForUser = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const targetUserId = req.params.targetUserId;
  const { page = 1, limit = 50 } = req.query;

  // Verify accepted match exists
  const acceptedMatch = await MatchRequest.findOne({
    $or: [
      { sender: currentUserId, receiver: targetUserId },
      { sender: targetUserId, receiver: currentUserId }
    ],
    status: 'accepted'
  });

  if (!acceptedMatch && req.user.role !== 'admin') {
    throw ApiError.forbidden('Chat is only permitted between users with an accepted swap request.');
  }

  const conversationId = Message.getConversationId(currentUserId, targetUserId);
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [messages, total] = await Promise.all([
    Message.find({ conversationId })
      .populate('sender', 'name photoUrl')
      .populate('receiver', 'name photoUrl')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }),
    Message.countDocuments({ conversationId })
  ]);

  res.status(200).json({
    success: true,
    conversationId,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    },
    data: messages.reverse() // Return chronological order
  });
});

// @desc    Send chat message via REST fallback
// @route   POST /api/conversations/:targetUserId/messages
// @access  Private
const sendMessageFallback = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const targetUserId = req.params.targetUserId;
  const { text } = req.body;

  if (!text || !text.trim()) {
    throw ApiError.badRequest('Message text is required.');
  }

  // Verify accepted match exists
  const acceptedMatch = await MatchRequest.findOne({
    $or: [
      { sender: currentUserId, receiver: targetUserId },
      { sender: targetUserId, receiver: currentUserId }
    ],
    status: 'accepted'
  });

  if (!acceptedMatch) {
    throw ApiError.forbidden('Chat is only allowed between users with an accepted swap request.');
  }

  const conversationId = Message.getConversationId(currentUserId, targetUserId);

  const message = await Message.create({
    conversationId,
    sender: currentUserId,
    receiver: targetUserId,
    text: text.trim(),
    createdAt: new Date()
  });

  const populated = await message.populate([
    { path: 'sender', select: 'name photoUrl' },
    { path: 'receiver', select: 'name photoUrl' }
  ]);

  // Emit real-time message through Socket.io if active
  const io = getIO();
  if (io) {
    io.to(`user:${targetUserId}`).emit('message:new', populated);
    io.to(`user:${currentUserId}`).emit('message:new', populated);
  }

  // If receiver is offline, dispatch notification
  if (!isUserOnline(targetUserId)) {
    await createNotification({
      user: targetUserId,
      sender: currentUserId,
      type: 'NEW_MESSAGE',
      title: `New message from ${req.user.name}`,
      body: text.trim().substring(0, 100),
      link: `/chat/${currentUserId}`,
      metadata: { conversationId, senderId: currentUserId }
    });
  }

  res.status(201).json({
    success: true,
    data: populated
  });
});

// @desc    Mark incoming messages in a conversation as read
// @route   PATCH /api/conversations/:targetUserId/read
// @access  Private
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const targetUserId = req.params.targetUserId;
  const conversationId = Message.getConversationId(currentUserId, targetUserId);

  const result = await Message.updateMany(
    { conversationId, receiver: currentUserId, readAt: null },
    { readAt: new Date() }
  );

  const io = getIO();
  if (io) {
    io.to(`user:${targetUserId}`).emit('message:read', {
      readerId: currentUserId,
      conversationId
    });
  }

  res.status(200).json({
    success: true,
    message: 'Messages marked as read.',
    modifiedCount: result.modifiedCount
  });
});

module.exports = {
  getConversations,
  getMessagesForUser,
  sendMessageFallback,
  markMessagesAsRead
};

