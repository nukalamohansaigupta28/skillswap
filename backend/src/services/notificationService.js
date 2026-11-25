const Notification = require('../models/Notification');

let ioInstance = null;

const setNotificationIO = (io) => {
  ioInstance = io;
};

/**
 * Creates a persistent notification in MongoDB and emits real-time event via Socket.io
 */
const createNotification = async ({
  user,
  sender = null,
  type,
  title,
  body,
  link = '',
  metadata = {}
}) => {
  try {
    const notification = await Notification.create({
      user,
      sender,
      type,
      title,
      body,
      link,
      metadata,
      read: false
    });

    const populated = await notification.populate('sender', 'name photoUrl');

    // Real-time push via Socket.io to target user's personal room
    if (ioInstance) {
      ioInstance.to(`user:${user.toString()}`).emit('notification:new', populated);
    }

    return populated;
  } catch (err) {
    console.error('[NotificationService] Error creating notification:', err.message);
    return null;
  }
};

module.exports = {
  createNotification,
  setNotificationIO
};

