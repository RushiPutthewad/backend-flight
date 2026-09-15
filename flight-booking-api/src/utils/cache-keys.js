const crypto = require('crypto');

/**
 * Cache Key Utilities
 * Centralized cache key generation and normalization
 */

/**
 * Normalize search parameters for consistent cache keys
 * @param {Object} params - Search parameters
 * @returns {Object} Normalized parameters
 */
function normalizeSearchParams(params) {
  return {
    origin: (params.origin || '').toUpperCase().trim(),
    destination: (params.destination || '').toUpperCase().trim(),
    departureDate: params.departureDate,
    passengers: params.passengers || 1,
    cabinClass: (params.cabinClass || 'economy').toLowerCase(),
    returnDate: params.returnDate || null
  };
}

/**
 * Generate cache key for flight search
 * Format: flights:search:{hash}
 * @param {Object} searchParams - Search parameters
 * @returns {String} Cache key
 */
function generateFlightSearchKey(searchParams) {
  const normalized = normalizeSearchParams(searchParams);

  // Create deterministic key from sorted parameters
  const keyParts = [
    normalized.origin,
    normalized.destination,
    normalized.departureDate,
    normalized.passengers,
    normalized.cabinClass
  ];

  if (normalized.returnDate) {
    keyParts.push(normalized.returnDate);
  }

  // Generate hash for cleaner keys (optional, can use direct concatenation)
  const dataString = keyParts.join(':');
  const hash = crypto.createHash('md5').update(dataString).digest('hex').substring(0, 8);

  return `flights:search:${dataString}:${hash}`;
}

/**
 * Generate cache key for single flight
 * Format: flights:detail:{flightId}
 * @param {String} flightId - Flight identifier
 * @returns {String} Cache key
 */
function generateFlightDetailKey(flightId) {
  return `flights:detail:${flightId}`;
}

/**
 * Generate cache key for booking
 * Format: booking:{bookingId}
 * @param {String} bookingId - Booking identifier
 * @returns {String} Cache key
 */
function generateBookingKey(bookingId) {
  return `booking:${bookingId}`;
}

/**
 * Generate cache key for user session
 * Format: session:{userId}:{tokenId}
 * @param {String} userId - User identifier
 * @param {String} tokenId - Token identifier
 * @returns {String} Cache key
 */
function generateSessionKey(userId, tokenId) {
  return `session:${userId}:${tokenId}`;
}

/**
 * Generate cache key for rate limiting
 * Format: rate-limit:{type}:{identifier}
 * @param {String} type - Rate limit type (login, search, booking)
 * @param {String} identifier - IP address or user ID
 * @returns {String} Cache key
 */
function generateRateLimitKey(type, identifier) {
  return `rate-limit:${type}:${identifier}`;
}

/**
 * Parse flight search key to extract parameters
 * @param {String} cacheKey - Cache key
 * @returns {Object|null} Extracted parameters or null
 */
function parseFlightSearchKey(cacheKey) {
  if (!cacheKey.startsWith('flights:search:')) {
    return null;
  }

  const parts = cacheKey.replace('flights:search:', '').split(':');

  if (parts.length < 5) {
    return null;
  }

  return {
    origin: parts[0],
    destination: parts[1],
    departureDate: parts[2],
    passengers: parseInt(parts[3], 10),
    cabinClass: parts[4],
    returnDate: parts[5] !== 'null' && parts[5] !== undefined ? parts[5] : null
  };
}

module.exports = {
  normalizeSearchParams,
  generateFlightSearchKey,
  generateFlightDetailKey,
  generateBookingKey,
  generateSessionKey,
  generateRateLimitKey,
  parseFlightSearchKey
};
