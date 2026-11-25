const express = require('express');
const router = express.Router();

const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get user notifications
router.get('/', getNotifications);

// Mark all notifications as read
router.patch('/read-all', markAllNotificationsAsRead);

// Mark single notification as read
router.patch('/:id/read', markNotificationAsRead);

module.exports = router;

