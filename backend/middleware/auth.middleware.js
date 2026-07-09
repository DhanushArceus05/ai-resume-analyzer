const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');

/**
 * Protects a route by requiring a valid, non-expired JWT in the
 * `Authorization: Bearer <token>` header. On success, attaches the
 * authenticated user document (without the password field) to `req.user`.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Not authorized, no token provided'));
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Session expired, please log in again'));
    }
    return next(new ApiError(401, 'Not authorized, invalid token'));
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new ApiError(401, 'Not authorized, user no longer exists'));
  }

  req.user = user;
  return next();
};

module.exports = { protect };
