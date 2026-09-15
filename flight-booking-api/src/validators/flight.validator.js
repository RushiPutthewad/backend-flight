const { z } = require('zod');

/**
 * Flight Search Validation Schema
 * Validates query parameters for flight search
 */
const searchFlightsSchema = z.object({
  // Required fields
  origin: z
    .string()
    .min(3, 'Origin must be a 3-letter airport code')
    .max(3, 'Origin must be a 3-letter airport code')
    .toUpperCase()
    .transform(s => s.toUpperCase()),

  destination: z
    .string()
    .min(3, 'Destination must be a 3-letter airport code')
    .max(3, 'Destination must be a 3-letter airport code')
    .transform(s => s.toUpperCase()),

  departureDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, 'Invalid date'),

  // Optional fields
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
    .optional(),

  passengers: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().min(1).max(9)),

  cabinClass: z
    .enum(['economy', 'business', 'first'])
    .optional()
    .default('economy')
    .transform(s => s.toLowerCase()),

  // Pagination
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().min(1)),

  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
});

/**
 * Get Flight by ID Schema
 * Validates flightId parameter
 */
const getFlightSchema = z.object({
  flightId: z.string().min(1, 'Flight ID is required')
});

module.exports = {
  searchFlightsSchema,
  getFlightSchema
};
