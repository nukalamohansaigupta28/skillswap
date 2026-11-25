const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Skill name must be at least 2 characters long'],
      maxlength: [100, 'Skill name cannot exceed 100 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Music',
          'Cooking',
          'Coding',
          'Languages',
          'Sports',
          'Art',
          'Academics',
          'Other'
        ],
        message: '{VALUE} is not a valid skill category'
      },
      index: true
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'pending',
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Create text index for search
skillSchema.index({ name: 'text', description: 'text' });

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;
