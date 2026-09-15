const { redisClient } = require('../config/redis');
const FlightProvider = require('../providers/flight.provider');
const ApiError = require('../utils/api-error');
const { normalizeSearchParams, generateFlightSearchKey } = require('../utils/cache-keys');
const logger = require('../config/logger');

/**
 * Flight Search Service
 * Implements caching logic with Redis
 * Request flow: Validate -> Normalize -> Generate Key -> Check Cache -> Hit/Miss Handling
 */
class FlightService {
  constructor() {
    this.provider = new FlightProvider();
    this.CACHE_TTL = 300; // 5 minutes in seconds
  }

  /**
   * Normalize search parameters
   * Uppercase airports, consistent sorting, lowercase cabin class
   * @param {Object} params - Raw search parameters
   * @returns {Object} Normalized parameters
   */
  normalizeParams(params) {
    return normalizeSearchParams(params);
  }

  /**
   * Generate Redis cache key
   * Format: flights:search:{hash}
   * @param {Object} params - Normalized search params
   * @returns {String} Cache key
   */
  generateCacheKey(params) {
    return generateFlightSearchKey(params);
  }

  /**
   * Search flights with caching
   * Flow: Normalize -> Generate Key -> Check Cache -> Provider (if miss) -> Cache -> Return
   * @param {Object} rawParams - Raw search parameters from request
   * @returns {Object} { data: flights, cached: boolean }
   */
  async searchFlights(rawParams) {
    // 1. Normalize search criteria
    const normalizedParams = this.normalizeParams(rawParams);

    // 2. Generate Redis key
    const cacheKey = this.generateCacheKey(normalizedParams);

    logger.info({ cacheKey, params: normalizedParams }, 'Flight search initiated');

    try {
      // 3. Check Redis cache
      const cached = await this._getFromCache(cacheKey);

      // 4. Cache HIT: Return cached results
      if (cached !== null) {
        logger.info('Flight search cache HIT');
        return {
          data: cached,
          cached: true
        };
      }

      // 5. Cache MISS: Call provider
      logger.info('Flight search cache MISS');

      const flights = await this.provider.searchFlights(normalizedParams);

      // 6. Normalize results (provider already does this, but double-check)
      const normalizedResults = this._normalizeResults(flights, normalizedParams.cabinClass);

      // 7. Save to Redis cache with TTL
      await this._setCache(cacheKey, normalizedResults);

      // 8. Return results
      return {
        data: normalizedResults,
        cached: false
      };
    } catch (error) {
      logger.error({ error: error.message, cacheKey }, 'Flight search error');
      throw error;
    }
  }

  /**
   * Get flight by ID
   * @param {String} flightId - Flight identifier
   * @returns {Object} Flight details
   */
  async getFlightById(flightId) {
    logger.info({ flightId }, 'Get flight by ID');

    try {
      const flight = await this.provider.getFlight(flightId);
      return flight;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw ApiError.notFound('Flight not found');
      }
      throw error;
    }
  }

  /**
   * Get from Redis cache
   * @private
   */
  async _getFromCache(cacheKey) {
    try {
      // Check if Redis is connected
      if (!redisClient.isOpen) {
        logger.warn('Redis not connected, skipping cache check');
        return null;
      }

      const cached = await redisClient.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      logger.warn({ error: error.message }, 'Redis get failed, continuing without cache');
      return null;
    }
  }

  /**
   * Set to Redis cache with TTL
   * @private
   */
  async _setCache(cacheKey, data) {
    try {
      if (!redisClient.isOpen) {
        logger.warn('Redis not connected, skipping cache set');
        return;
      }

      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(data));
      logger.info({ cacheKey, ttl: this.CACHE_TTL }, 'Cached flight results');
    } catch (error) {
      logger.warn({ error: error.message }, 'Redis set failed, continuing without caching');
    }
  }

  /**
   * Normalize results to ensure consistent format
   * @private
   */
  _normalizeResults(flights, cabinClass) {
    return flights.map(flight => ({
      id: flight.id,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      origin: flight.origin,
      destination: flight.destination,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: flight.duration,
      cabinClass: cabinClass,
      price: flight.price,
      seats: flight.seats,
      amenities: flight.amenities
    }));
  }

  /**
   * Invalidate search cache
   * @param {Object} searchParams - Search params to invalidate
   */
  async invalidateSearchCache(searchParams) {
    const cacheKey = this.generateCacheKey(searchParams);
    try {
      if (redisClient.isOpen) {
        await redisClient.del(cacheKey);
        logger.info({ cacheKey }, 'Cache invalidated');
      }
    } catch (error) {
      logger.warn({ error: error.message }, 'Cache invalidation failed');
    }
  }

  /**
   * Clear all flight search caches
   */
  async clearAllSearchCaches() {
    try {
      if (redisClient.isOpen) {
        const keys = await redisClient.keys('flights:search:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
          logger.info({ count: keys.length }, 'Cleared all flight search caches');
        }
      }
    } catch (error) {
      logger.warn({ error: error.message }, 'Failed to clear caches');
    }
  }
}

module.exports = new FlightService();
