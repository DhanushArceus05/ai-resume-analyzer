const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Signs a JWT for a given user id.
 * @param {string} userId - Mongo ObjectId of the authenticated user.
 * @returns {string} Signed JWT.
 */
const generateToken = (userId) => {
  if (!env.jwt.secret) {
    throw new Error('Cannot generate JWT: JWT_SECRET is not configured.');
  }

  return jwt.sign({ id: userId }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
};

/**
 * Verifies a JWT and returns its decoded payload.
 * Throws jsonwebtoken's native errors (TokenExpiredError, JsonWebTokenError)
 * so callers can distinguish an expired token from an invalid one.
 * @param {string} token
 * @returns {{ id: string, iat: number, exp: number }}
 */
const verifyToken = (token) => {
  return jwt.verify(token, env.jwt.secret);
};

module.exports = { generateToken, verifyToken };
