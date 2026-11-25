const mongoose = require('mongoose');

const userSkillSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill is required'],
      index: true
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: ['TEACH', 'LEARN'],
        message: 'Type must be either TEACH or LEARN'
      },
      index: true
    },
    proficiency: {
      type: String,
      enum: {
        values: ['Beginner', 'Intermediate', 'Expert'],
        message: 'Proficiency must be Beginner, Intermediate, or Expert'
      },
      default: 'Intermediate'
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring a user cannot add the same skill under the same type twice
userSkillSchema.index({ user: 1, skill: 1, type: 1 }, { unique: true });

// Index for high-performance matching queries (e.g. find all users who TEACH skill X)
userSkillSchema.index({ type: 1, skill: 1 });

const UserSkill = mongoose.model('UserSkill', userSkillSchema);

module.exports = UserSkill;
