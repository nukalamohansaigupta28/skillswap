const mongoose = require('mongoose');

const matchRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
      index: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required'],
      index: true
    },
    skillOffered: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      default: null // Nullable for credit-based one-way swap
    },
    skillRequested: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Requested skill is required']
    },
    matchType: {
      type: String,
      enum: {
        values: ['MUTUAL', 'ONE_WAY'],
        message: 'Match type must be MUTUAL or ONE_WAY'
      },
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
      index: true
    },
    message: {
      type: String,
      default: '',
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index to quickly check existing pending requests between two users
matchRequestSchema.index({ sender: 1, receiver: 1, status: 1 });
matchRequestSchema.index({ receiver: 1, status: 1 });

const MatchRequest = mongoose.model('MatchRequest', matchRequestSchema);

module.exports = MatchRequest;
