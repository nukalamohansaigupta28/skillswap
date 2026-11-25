const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const Message = require('../models/Message');
const MatchRequest = require('../models/MatchRequest');
const User = require('../models/User');
const { setNotificationIO, createNotification } = require('./notificationService');

let io = null;
// Map: userId (string) -> Set of socket IDs
const onlineUsers = new Map();

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Share IO with NotificationService
  setNotificationIO(io);

  // 1. Socket Authentication Middleware (JWT)
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.authorization) {
        const header = socket.handshake.headers.authorization;
        if (header.startsWith('Bearer ')) {
          token = header.split(' ')[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name status role');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (user.status === 'suspended') {
        return next(new Error('Authentication error: Account suspended'));
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        role: user.role
      };

      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  // 2. Connection Lifecycle & Event Routing
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`[Socket] User connected: ${socket.user.name} (${userId}) | Socket: ${socket.id}`);

    // Join personal room for 1-to-1 routing
    socket.join(`user:${userId}`);

    // Update online presence registry
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast online presence to all connected clients
    io.emit('presence:online', { userId, isOnline: true });
    socket.emit('presence:list', Array.from(onlineUsers.keys()));

    // Event: Send Message (1-to-1)
    socket.on('message:send', async (data, callback) => {
      try {
        const { receiverId, text } = data;

        if (!receiverId || !text || !text.trim()) {
          if (callback) callback({ success: false, error: 'receiverId and non-empty text required' });
          return;
        }

        // Rule: Chat allowed ONLY between users with an accepted match request
        const acceptedMatch = await MatchRequest.findOne({
          $or: [
            { sender: userId, receiver: receiverId },
            { sender: receiverId, receiver: userId }
          ],
          status: 'accepted'
        });

        if (!acceptedMatch) {
          const errMsg = 'Chat is only allowed between users with an accepted swap request.';
          socket.emit('error:chat', { message: errMsg });
          if (callback) callback({ success: false, error: errMsg });
          return;
        }

        const conversationId = Message.getConversationId(userId, receiverId);

        const newMessage = await Message.create({
          conversationId,
          sender: userId,
          receiver: receiverId,
          text: text.trim(),
          createdAt: new Date()
        });

        const populated = await newMessage.populate([
          { path: 'sender', select: 'name photoUrl' },
          { path: 'receiver', select: 'name photoUrl' }
        ]);

        // Deliver message in real-time to both receiver and sender rooms
        io.to(`user:${receiverId}`).emit('message:new', populated);
        io.to(`user:${userId}`).emit('message:new', populated);

        // If receiver is currently offline, dispatch an in-app notification
        const isReceiverOnline = onlineUsers.has(receiverId) && onlineUsers.get(receiverId).size > 0;
        if (!isReceiverOnline) {
          await createNotification({
            user: receiverId,
            sender: userId,
            type: 'NEW_MESSAGE',
            title: `New message from ${socket.user.name}`,
            body: text.trim().substring(0, 100),
            link: `/chat/${userId}`,
            metadata: { conversationId, senderId: userId }
          });
        }

        if (callback) callback({ success: true, message: populated });
      } catch (err) {
        console.error('[Socket] Error in message:send:', err.message);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Event: Typing Indicator
    socket.on('typing', ({ receiverId, isTyping }) => {
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('typing', {
          senderId: userId,
          isTyping: !!isTyping
        });
      }
    });

    // Event: Mark Messages as Read
    socket.on('message:read', async ({ senderId }) => {
      try {
        if (!senderId) return;
        const conversationId = Message.getConversationId(userId, senderId);

        await Message.updateMany(
          { conversationId, receiver: userId, readAt: null },
          { readAt: new Date() }
        );

        io.to(`user:${senderId}`).emit('message:read', {
          readerId: userId,
          conversationId
        });
      } catch (err) {
        console.error('[Socket] Error in message:read:', err.message);
      }
    });

    // Disconnect Handler
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.user.name} (${userId})`);
      if (onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('presence:online', { userId, isOnline: false });
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

const isUserOnline = (userId) => {
  return onlineUsers.has(userId?.toString()) && onlineUsers.get(userId.toString()).size > 0;
};

module.exports = {
  initSocket,
  getIO,
  isUserOnline
};

