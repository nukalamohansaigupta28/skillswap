const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true
    },
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
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
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

// Compound indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, readAt: 1 });

// Helper function to build deterministic conversation ID between two user IDs
messageSchema.statics.getConversationId = function (userA, userB) {
  const idA = userA.toString();
  const idB = userB.toString();
  return idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;

