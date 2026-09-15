const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createBookingSchema, updateBookingSchema, cancelBookingSchema, getBookingsSchema, getBookingSchema } = require('../validators/booking.validator');

const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

// Create booking
router.post('/', validate(createBookingSchema), bookingController.createBooking);

// Get booking stats (must be before :bookingId route)
router.get('/stats', bookingController.getBookingStats);

// List user's bookings
router.get('/', validate(getBookingsSchema), bookingController.getBookings);

// Get single booking
router.get('/:bookingId', validate(getBookingSchema), bookingController.getBookingById);

// Update booking (state transitions)
router.patch('/:bookingId', validate(updateBookingSchema), bookingController.updateBooking);

// Cancel booking
router.post('/:bookingId/cancel', validate(cancelBookingSchema), bookingController.cancelBooking);

module.exports = router;
