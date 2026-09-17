const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const env = require('../config/env');
const ApiError = require('../utils/api-error');

class AuthService {
  generateAccessToken(userId) {
    return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN
    });
  }

  generateRefreshToken(userId) {
    return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN
    });
  }

  async register({ email, password, firstName, lastName, phone }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('Email already registered');
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone
    });

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account is inactive');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  }

  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);

      const user = await User.findById(decoded.userId);

      if (!user || user.refreshToken !== refreshToken) {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      const newAccessToken = this.generateAccessToken(user._id);
      const newRefreshToken = this.generateRefreshToken(user._id);

      // Update refresh token
      user.refreshToken = newRefreshToken;
      await user.save();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Invalid refresh token');
      }
      throw error;
    }
  }

  async logout(userId) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  async deleteAccount(userId, password) {
    const User = require('../models/user.model');
    const Task = require('../models/task.model');
    const Booking = require('../models/booking.model');
    const { redisClient } = require('../config/redis');
    const logger = require('../config/logger');

    // 1. Verify password (security confirmation)
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid password. Account deletion cancelled.');
    }

    // 2. Delete all user data
    await User.deleteOne({ _id: userId });
    await Task.deleteMany({ user: userId });
    await Booking.deleteMany({ user: userId });

    // 3. Clear Redis cache entries for this user
    try {
      if (redisClient.isOpen) {
        const keys = await redisClient.keys(`*${userId}*`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      }
    } catch (error) {
      // Log but don't fail deletion if Redis cleanup fails
      logger.warn({ error: error.message }, 'Redis cleanup failed during account deletion');
    }

    // 4. Log deletion (no personal data in log)
    logger.info({ userId, timestamp: new Date() }, 'User account deleted');
  }
}

module.exports = new AuthService();