const ApiError = require('../utils/ApiError');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access forbidden: requires one of the following roles: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
};

module.exports = { authorizeRoles };

