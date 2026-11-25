const express = require('express');
const router = express.Router();

const {
  getConversations,
  getMessagesForUser,
  sendMessageFallback,
  markMessagesAsRead
} = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get user conversation threads
router.get('/', getConversations);

// Get message history with a user
router.get('/:targetUserId/messages', getMessagesForUser);

// REST fallback for sending chat message
router.post('/:targetUserId/messages', sendMessageFallback);

// Mark conversation messages as read
router.patch('/:targetUserId/read', markMessagesAsRead);

module.exports = router;

