const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const slotSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true }    // e.g. "11:00"
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    slots: [slotSchema]
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false
    },
    bio: {
      type: String,
      default: '',
      maxlength: [1000, 'Bio cannot exceed 1000 characters']
    },
    location: {
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
      },
      country: {
        type: String,
        default: 'USA'
      },
      coordinates: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 }
      }
    },
    availability: {
      type: [availabilitySchema],
      default: []
    },
    photoUrl: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active'
    },
    creditBalance: {
      type: Number,
      default: 2,
      min: [0, 'Credit balance cannot be negative']
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) {
    throw new Error('Password hash not loaded');
  }
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash passwords
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPassword, salt);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

