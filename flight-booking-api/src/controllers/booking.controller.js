const bookingService = require('../services/booking.service');
const asyncHandler = require('../utils/async-handler');

class BookingController {
  /**
   * @route   POST /api/v1/bookings
   * @desc    Create a new booking
   * @access  Private
   */
  createBooking = asyncHandler(async (req, res) => {
    const booking = await bookingService.createBooking(req.user._id, req.validatedData);

    res.status(201).json({
      success: true,
      data: booking
    });
  });

  /**
   * @route   GET /api/v1/bookings
   * @desc    Get all bookings for authenticated user with filters
   * @access  Private
   */
  getBookings = asyncHandler(async (req, res) => {
    const result = await bookingService.getBookings(req.user._id, req.validatedData);

    res.status(200).json({
      success: true,
      data: result.bookings,
      pagination: result.pagination
    });
  });

  /**
   * @route   GET /api/v1/bookings/:bookingId
   * @desc    Get single booking by ID
   * @access  Private
   */
  getBookingById = asyncHandler(async (req, res) => {
    const booking = await bookingService.getBookingById(req.user._id, req.validatedData.bookingId);

    res.status(200).json({
      success: true,
      data: booking
    });
  });

  /**
   * @route   PATCH /api/v1/bookings/:bookingId
   * @desc    Update booking status
   * @access  Private
   */
  updateBooking = asyncHandler(async (req, res) => {
    const { bookingId, status } = req.validatedData;
    const booking = await bookingService.updateBookingStatus(req.user._id, bookingId, status);

    res.status(200).json({
      success: true,
      data: booking
    });
  });

  /**
   * @route   POST /api/v1/bookings/:bookingId/cancel
   * @desc    Cancel booking
   * @access  Private
   */
  cancelBooking = asyncHandler(async (req, res) => {
    const { bookingId, reason } = req.validatedData;
    const booking = await bookingService.cancelBooking(req.user._id, bookingId, reason);

    res.status(200).json({
      success: true,
      data: booking,
      message: 'Booking cancelled successfully'
    });
  });

  /**
   * @route   GET /api/v1/bookings/stats
   * @desc    Get booking statistics for user
   * @access  Private
   */
  getBookingStats = asyncHandler(async (req, res) => {
    const stats = await bookingService.getBookingStats(req.user._id);

    res.status(200).json({
      success: true,
      data: stats
    });
  });
}

module.exports = new BookingController();
