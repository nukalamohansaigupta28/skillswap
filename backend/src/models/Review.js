const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session reference is required'],
      index: true
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer reference is required'],
      index: true
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewee reference is required'],
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating (1-5) is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars']
    },
    comment: {
      type: String,
      default: '',
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    }
  },
  {
    timestamps: true
  }
);

// Strictly one review per user per session
reviewSchema.index({ session: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, rating: -1 });

// Static method to recalculate reviewee's average rating and count
reviewSchema.statics.calculateAverageRating = async function (revieweeId) {
  const stats = await this.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(revieweeId) } },
    {
      $group: {
        _id: '$reviewee',
        avgRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 }
      }
    }
  ]);

  const User = mongoose.model('User');
  if (stats.length > 0) {
    const roundedAvg = Math.round(stats[0].avgRating * 10) / 10;
    await User.findByIdAndUpdate(revieweeId, {
      ratingAverage: roundedAvg,
      ratingCount: stats[0].ratingCount
    });
  } else {
    await User.findByIdAndUpdate(revieweeId, {
      ratingAverage: 0,
      ratingCount: 0
    });
  }
};

// Post hooks to auto-update ratingAverage on review save and delete
reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.reviewee);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.reviewee);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

