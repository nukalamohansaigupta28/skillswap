const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
      index: true
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reported user reference is required'],
      index: true
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      enum: {
        values: [
          'INAPPROPRIATE_BEHAVIOR',
          'NO_SHOW',
          'HARASSMENT',
          'SPAM',
          'FRAUD',
          'OTHER'
        ],
        message: 'Invalid report reason'
      },
      index: true
    },
    details: {
      type: String,
      required: [true, 'Report details are required'],
      trim: true,
      maxlength: [2000, 'Details cannot exceed 2000 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'investigating', 'resolved', 'dismissed'],
        message: 'Invalid report status'
      },
      default: 'open',
      index: true
    },
    resolutionNotes: {
      type: String,
      default: '',
      maxlength: [1000, 'Resolution notes cannot exceed 1000 characters']
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;

