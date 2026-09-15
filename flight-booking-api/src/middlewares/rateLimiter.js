const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests, please try again later'
  }
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts, please try again in 15 minutes'
  }
});

// Search endpoints limiter
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many search requests, please slow down'
  }
});

module.exports = { apiLimiter, authLimiter, searchLimiter };