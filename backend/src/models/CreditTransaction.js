const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required']
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: ['BONUS', 'EARN', 'SPEND', 'REFUND', 'ADMIN_ADJUST'],
        message: 'Invalid transaction type'
      },
      index: true
    },
    balanceAfter: {
      type: Number,
      required: [true, 'Balance after transaction is required']
    },
    description: {
      type: String,
      required: [true, 'Description is required']
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

creditTransactionSchema.index({ user: 1, createdAt: -1 });

const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);

module.exports = CreditTransaction;

