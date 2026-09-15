const asyncHandler = require('../utils/async-handler');
const flightService = require('../services/flight.service');

/**
 * Flight Controller
 * Handles HTTP concerns for flight endpoints
 */

/**
 * Search flights
 * GET /api/v1/flights/search
 * Query params: origin, destination, departureDate, passengers, cabinClass
 */
const searchFlights = asyncHandler(async (req, res) => {
  const searchParams = req.validatedData;

  const result = await flightService.searchFlights(searchParams);

  res.status(200).json({
    success: true,
    data: result.data,
    cached: result.cached,
    count: result.data.length
  });
});

/**
 * Get flight by ID
 * GET /api/v1/flights/:flightId
 */
const getFlightById = asyncHandler(async (req, res) => {
  const { flightId } = req.validatedData;

  const flight = await flightService.getFlightById(flightId);

  res.status(200).json({
    success: true,
    data: flight
  });
});

/**
 * Clear flight search cache (admin/debug endpoint)
 * DELETE /api/v1/flights/cache
 */
const clearCache = asyncHandler(async (req, res) => {
  await flightService.clearAllSearchCaches();

  res.status(200).json({
    success: true,
    message: 'Flight search cache cleared'
  });
});

module.exports = {
  searchFlights,
  getFlightById,
  clearCache
};
