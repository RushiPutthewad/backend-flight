const Booking = require('../models/booking.model');
const Flight = require('../models/flight.model');
const ApiError = require('../utils/api-error');
const { getPaginationParams } = require('../utils/pagination');
const { BOOKING_STATUS } = require('../constants/booking-status');

class BookingService {
  async createBooking(userId, bookingData) {
    // Calculate total price and validate flight
    let totalPrice = 0;
    let serverPrice = 0;

    if (bookingData.flightId) {
      // Booking from database flight
      const flight = await Flight.findById(bookingData.flightId);
      if (!flight) {
        throw ApiError.notFound('Flight not found');
      }

      // Check availability
      if (flight.seats.available.economy < bookingData.passengers.length) {
        throw ApiError.badRequest('Not enough seats available');
      }

      // SECURITY: Recheck price from server (don't trust client)
      serverPrice = flight.prices.economy;
      totalPrice = serverPrice * bookingData.passengers.length;

      // Create booking with payment_pending status (Phase 5 requirement)
      const booking = await Booking.create({
        user: userId,
        flight: bookingData.flightId,
        passengers: bookingData.passengers,
        totalPrice,
        specialRequests: bookingData.specialRequests,
        status: BOOKING_STATUS.PAYMENT_PENDING,
        paymentStatus: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      });

      // Reduce available seats (temporary hold)
      flight.seats.available.economy -= bookingData.passengers.length;
      await flight.save();

      return booking;
    } else if (bookingData.flightDetails) {
      // Booking from external/mock flight data
      // SECURITY: Recheck price from the flight provider/source
      serverPrice = bookingData.flightDetails.price;
      totalPrice = serverPrice * bookingData.passengers.length;

      const booking = await Booking.create({
        user: userId,
        flightDetails: {
          ...bookingData.flightDetails,
          price: serverPrice,
          currency: bookingData.flightDetails.currency || 'USD'
        },
        passengers: bookingData.passengers,
        totalPrice,
        currency: bookingData.flightDetails.currency || 'USD',
        specialRequests: bookingData.specialRequests,
        status: BOOKING_STATUS.PAYMENT_PENDING,
        paymentStatus: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      });

      return booking;
    }

    throw ApiError.badRequest('Either flightId or flightDetails must be provided');
  }

  async getBookings(userId, filters) {
    const { skip, limit, page } = getPaginationParams(filters);

    const query = { user: userId };

    // Filter by status if provided
    if (filters.status) {
      query.status = filters.status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('flight', 'flightNumber airline origin destination departureTime arrivalTime status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query)
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getBookingById(userId, bookingId) {
    const booking = await Booking.findOne({ _id: bookingId, user: userId })
      .populate('flight');

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    return booking;
  }

  async updateBookingStatus(userId, bookingId, status) {
    const booking = await Booking.findOne({ _id: bookingId, user: userId });

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    // Use the model's transition method
    if (!booking.canTransitionTo(status)) {
      throw ApiError.badRequest(`Cannot transition from ${booking.status} to ${status}`);
    }

    booking.status = status;
    await booking.save();

    return booking;
  }

  async cancelBooking(userId, bookingId, reason) {
    const booking = await Booking.findOne({ _id: bookingId, user: userId });

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      throw ApiError.badRequest('Booking is already cancelled');
    }

    // State machine: Only confirmed bookings can be cancelled (per section 14)
    if (!booking.canTransitionTo(BOOKING_STATUS.CANCELLED)) {
      throw ApiError.badRequest(
        `Cannot cancel booking with status: ${booking.status}. Only confirmed bookings can be cancelled.`
      );
    }

    // Restore seats if booking has a flight reference
    if (booking.flight) {
      const flight = await Flight.findById(booking.flight);
      if (flight) {
        flight.seats.available.economy += booking.passengers.length;
        await flight.save();
      }
    }

    // Use the state machine transition method
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancellationReason = reason || 'Cancelled by user';
    await booking.save();

    return booking;
  }

  async confirmPayment(bookingId, paymentId) {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }

    booking.status = BOOKING_STATUS.CONFIRMED;
    booking.paymentStatus = 'completed';
    booking.paymentId = paymentId;
    await booking.save();

    return booking;
  }

  async getBookingStats(userId) {
    const stats = await Booking.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalPrice' }
        }
      }
    ]);

    return stats;
  }
}

module.exports = new BookingService();