const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, bio, city, location, availability } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const resolvedCity = (location && location.city) ? location.city : (city || '');
  if (!resolvedCity) {
    throw ApiError.badRequest('City is required in location.');
  }

  const passwordHash = await User.hashPassword(password);

  const newUser = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    bio: bio || '',
    location: {
      city: resolvedCity,
      country: (location && location.country) ? location.country : 'USA',
      coordinates: (location && location.coordinates) ? location.coordinates : { lat: 0, lng: 0 }
    },
    availability: Array.isArray(availability) ? availability : [],
    creditBalance: 2, // 2 starting credits as per specifications
    role: 'user',
    status: 'active'
  });

  const token = generateToken(newUser);

  res.status(201).json({
    success: true,
    message: 'User registered successfully. 2 starting credits awarded!',
    token,
    user: newUser.toJSON(),
    data: {
      token,
      user: newUser.toJSON()
    }
  });
});

// @desc    Log in an existing user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (user.status === 'suspended') {
    throw ApiError.forbidden('Your account is suspended. Please contact platform support.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  user.lastActiveAt = new Date();
  await user.save();

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    user: user.toJSON(),
    data: {
      token,
      user: user.toJSON()
    }
  });
});

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private (Authenticated)
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toJSON(),
    data: req.user.toJSON()
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (Requires valid token in header or body)
const refreshToken = asyncHandler(async (req, res) => {
  let token = req.body.token;
  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Token is required for refresh.');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.status === 'suspended') {
      throw ApiError.forbidden('User account is invalid or suspended.');
    }

    const newToken = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      token: newToken,
      user: user.toJSON(),
      data: {
        token: newToken,
        user: user.toJSON()
      }
    });
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired token.');
  }
});

module.exports = {
  register,
  login,
  getMe,
  refreshToken,
  generateToken
};
