const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user is required'],
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: [
          'MATCH_REQUEST',
          'REQUEST_ACCEPTED',
          'REQUEST_DECLINED',
          'NEW_MESSAGE',
          'SESSION_PROPOSED',
          'SESSION_CONFIRMED',
          'SESSION_CANCELLED',
          'SESSION_REMINDER',
          'SESSION_COMPLETED',
          'NEW_REVIEW',
          'CREDIT_EARNED',
          'CREDIT_SPENT'
        ],
        message: 'Invalid notification type'
      },
      index: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    body: {
      type: String,
      required: [true, 'Notification body is required'],
      trim: true
    },
    link: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

// Compound index for querying user notifications
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

