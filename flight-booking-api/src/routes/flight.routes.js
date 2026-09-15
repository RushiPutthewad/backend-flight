const express = require('express');
const { searchFlights, getFlightById, clearCache } = require('../controllers/flight.controller');
const validate = require('../middlewares/validate');
const { searchFlightsSchema, getFlightSchema } = require('../validators/flight.validator');

const router = express.Router();

/**
 * GET /api/v1/flights/search
 * Search flights with caching
 * Query: origin, destination, departureDate, returnDate?, passengers?, cabinClass?
 */
router.get('/search', validate(searchFlightsSchema), searchFlights);

/**
 * DELETE /api/v1/flights/cache
 * Clear all flight search caches
 * Note: This should be before /:flightId to avoid route conflict
 */
router.delete('/cache', clearCache);

/**
 * GET /api/v1/flights/:flightId
 * Get single flight by ID
 */
router.get('/:flightId', validate(getFlightSchema), getFlightById);

module.exports = router;
