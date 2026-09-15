const { z } = require('zod');

const passengerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  passportNumber: z.string().max(50).optional(),
  passportExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  nationality: z.string().max(50).optional()
});

const createBookingSchema = z.object({
  flightId: z.string().optional(), // For real flights from DB
  flightDetails: z.object({
    flightNumber: z.string().min(1),
    airline: z.string().min(1),
    origin: z.string().min(1),
    destination: z.string().min(1),
    departureTime: z.string(),
    arrivalTime: z.string(),
    price: z.number().positive(),
    currency: z.string().default('USD')
  }).optional(), // For mock/external flights
  passengers: z.array(passengerSchema).min(1, 'At least one passenger is required'),
  specialRequests: z.string().max(500).optional()
}).refine(data => data.flightId || data.flightDetails, {
  message: 'Either flightId or flightDetails must be provided'
});

const updateBookingSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(['pending', 'payment_pending', 'confirmed', 'failed', 'cancelled', 'expired']).optional(),
  specialRequests: z.string().max(500).optional()
});

const cancelBookingSchema = z.object({
  bookingId: z.string().min(1),
  reason: z.string().max(500).optional()
});

const getBookingsSchema = z.object({
  status: z.enum(['pending', 'payment_pending', 'confirmed', 'failed', 'cancelled', 'expired']).optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional()
});

const getBookingSchema = z.object({
  bookingId: z.string().min(1)
});

module.exports = {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  getBookingsSchema,
  getBookingSchema
};