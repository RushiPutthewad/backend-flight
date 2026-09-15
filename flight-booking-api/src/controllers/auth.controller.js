const authService = require('../services/auth.service');
const asyncHandler = require('../utils/async-handler');

class AuthController {
  /**
   * @route   POST /api/v1/auth/register
   * @desc    Register a new user
   * @access  Public
   */
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.validatedData);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  });

  /**
   * @route   POST /api/v1/auth/login
   * @desc    Login user
   * @access  Public
   */
  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.validatedData);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  });

  /**
   * @route   POST /api/v1/auth/refresh
   * @desc    Refresh access token
   * @access  Public
   */
  refresh = asyncHandler(async (req, res) => {
    const result = await authService.refreshAccessToken(req.validatedData.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  });

  /**
   * @route   POST /api/v1/auth/logout
   * @desc    Logout user
   * @access  Private
   */
  logout = asyncHandler(async (req, res) => {
    await authService.logout(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  /**
   * @route   GET /api/v1/auth/me
   * @desc    Get current user
   * @access  Private
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user._id);

    res.status(200).json({
      success: true,
      data: user
    });
  });
}

module.exports = new AuthController();
