const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { generateToken } = require('../utils/jwt');
const { isValidEmail } = require('../utils/validators');

/**
 * POST /api/auth/register
 * Creates a new user account and returns it alongside a JWT.
 */
const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new ApiError(400, 'Name, email, and password are all required'));
  }

  if (!isValidEmail(email)) {
    return next(new ApiError(400, 'Please provide a valid email address'));
  }

  if (password.length < 8) {
    return next(new ApiError(400, 'Password must be at least 8 characters'));
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return next(new ApiError(409, 'An account with this email already exists'));
  }

  let user;
  try {
    user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(409, 'An account with this email already exists'));
    }
    return next(error);
  }

  const token = generateToken(user._id);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: { user, token },
  });
};

/**
 * POST /api/auth/login
 * Verifies credentials and returns the user alongside a JWT.
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError(400, 'Email and password are required'));
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  // Password has `select: false` on the schema, so it must be requested explicitly.
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  const token = generateToken(user._id);

  return sendSuccess(res, {
    message: 'Logged in successfully',
    data: { user, token },
  });
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
 * Requires the `protect` middleware to have already run.
 */
const getMe = async (req, res) => {
  return sendSuccess(res, {
    message: 'Current user retrieved',
    data: { user: req.user },
  });
};

module.exports = { register, login, getMe };
