const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new ApiError(400, message);
  }

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new ApiError(409, message);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((val) => ({
      field: val.path,
      message: val.message
    }));
    error = new ApiError(400, 'Invalid input data', errors);
  }

  // Handle JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Authentication token has expired');
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = ApiError.badRequest('File size exceeds the 5MB limit');
    } else {
      error = ApiError.badRequest(`File upload error: ${err.message}`);
    }
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || [];

  const response = {
    success: false,
    statusCode,
    message,
    ...(errors.length > 0 && { errors }),
    ...(env.NODE_ENV === 'development' && { stack: error.stack })
  };

  if (statusCode >= 500) {
    console.error(`[Error 500] ${req.method} ${req.originalUrl}:`, error);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;

