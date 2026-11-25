const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    matchRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MatchRequest',
      required: [true, 'Match request reference is required'],
      index: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher reference is required'],
      index: true
    },
    learner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Learner reference is required'],
      index: true
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill reference is required']
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date and time is required'],
      index: true
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      default: 60,
      min: [15, 'Minimum session duration is 15 minutes'],
      max: [240, 'Maximum session duration is 240 minutes']
    },
    mode: {
      type: String,
      required: [true, 'Session mode (online or offline) is required'],
      enum: {
        values: ['online', 'offline'],
        message: 'Mode must be either online or offline'
      }
    },
    meetingLink: {
      type: String,
      default: ''
    },
    locationAddress: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: ['proposed', 'confirmed', 'rescheduled', 'cancelled', 'completed'],
        message: 'Invalid session status'
      },
      default: 'proposed',
      index: true
    },
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    completionConfirmation: {
      teacherConfirmed: { type: Boolean, default: false },
      learnerConfirmed: { type: Boolean, default: false },
      teacherConfirmedAt: { type: Date, default: null },
      learnerConfirmedAt: { type: Date, default: null }
    },
    creditsTransferred: {
      type: Boolean,
      default: false,
      index: true
    },
    reminderSent: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast lookup of upcoming and active sessions
sessionSchema.index({ teacher: 1, scheduledAt: 1 });
sessionSchema.index({ learner: 1, scheduledAt: 1 });
sessionSchema.index({ status: 1, scheduledAt: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;

