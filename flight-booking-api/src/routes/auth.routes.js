const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  deleteAccountSchema
} = require('../validators/auth.validator');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validate(registerSchema),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  validate(loginSchema),
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refresh
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (clears refresh token)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

/**
 * @route   POST /api/v1/auth/delete-account
 * @desc    Delete user account and all associated data (GDPR compliance)
 * @access  Private
 */
router.post(
  '/delete-account',
  authenticate,
  validate(deleteAccountSchema),
  authController.deleteAccount
);

module.exports = router;
