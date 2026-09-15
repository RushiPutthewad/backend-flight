/**
 * Flight Search Module Tests
 * Tests for Phase 4: Flight Search with Redis Caching
 */

const request = require('supertest');
const app = require('../src/app');
const { redisClient, connectRedis } = require('../src/config/redis');

describe('Flight Search Module - Phase 4', () => {
  beforeAll(async () => {
    // Connect to Redis for testing
    await connectRedis();
  });

  afterAll(async () => {
    // Clear test cache and disconnect
    if (redisClient.isOpen) {
      await redisClient.flushDb();
      await redisClient.quit();
    }
  });

  beforeEach(async () => {
    // Clear cache before each test
    if (redisClient.isOpen) {
      await redisClient.flushDb();
    }
  });

  describe('GET /api/v1/flights/search', () => {
    it('should return flights for valid search parameters', async () => {
      const response = await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'JFK',
          destination: 'CDG',
          departureDate: '2026-10-12',
          passengers: 1,
          cabinClass: 'economy'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.cached).toBe(false); // First request should be uncached
    });

    it('should return cached results on second identical search', async () => {
      const searchParams = {
        origin: 'JFK',
        destination: 'LHR',
        departureDate: '2026-10-12',
        passengers: 1,
        cabinClass: 'economy'
      };

      // First request - cache miss
      const response1 = await request(app)
        .get('/api/v1/flights/search')
        .query(searchParams);

      expect(response1.body.cached).toBe(false);

      // Second request - cache hit
      const response2 = await request(app)
        .get('/api/v1/flights/search')
        .query(searchParams);

      expect(response2.status).toBe(200);
      expect(response2.body.cached).toBe(true);
      expect(response2.body.data).toEqual(response1.body.data);
    });

    it('should normalize airport codes to uppercase', async () => {
      const response1 = await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'jfk', // lowercase
          destination: 'cdg',
          departureDate: '2026-10-12',
          passengers: 1,
          cabinClass: 'economy'
        });

      const response2 = await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'JFK', // uppercase
          destination: 'CDG',
          departureDate: '2026-10-12',
          passengers: 1,
          cabinClass: 'economy'
        });

      // Should get cache hit because normalized params are the same
      expect(response1.body.success).toBe(true);
      expect(response2.body.cached).toBe(true);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'JFK'
          // Missing required fields
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should validate airport code length', async () => {
      const response = await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'JFKX', // Too long
          destination: 'CDG',
          departureDate: '2026-10-12'
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should validate date format', async () => {
      const response = await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'JFK',
          destination: 'CDG',
          departureDate: '10-12-2026' // Wrong format
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should validate passenger count', async () => {
      const response = await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'JFK',
          destination: 'CDG',
          departureDate: '2026-10-12',
          passengers: 15 // Too many
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should validate cabin class', async () => {
      const response = await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'JFK',
          destination: 'CDG',
          departureDate: '2026-10-12',
          cabinClass: 'premium' // Invalid
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should use default values for optional parameters', async () => {
      const response = await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'JFK',
          destination: 'CDG',
          departureDate: '2026-10-12'
          // passengers and cabinClass omitted
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/flights/:flightId', () => {
    it('should return flight details for valid flight ID', async () => {
      const response = await request(app)
        .get('/api/v1/flights/flight-jfk-cdg-001');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('flightNumber');
      expect(response.body.data).toHaveProperty('airline');
    });

    it('should return 404 for non-existent flight', async () => {
      const response = await request(app)
        .get('/api/v1/flights/non-existent-flight');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/flights/cache', () => {
    it('should clear all flight search caches', async () => {
      // Create a cached search
      await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'JFK',
          destination: 'CDG',
          departureDate: '2026-10-12'
        });

      // Clear cache
      const clearResponse = await request(app)
        .delete('/api/v1/flights/cache');

      expect(clearResponse.status).toBe(200);
      expect(clearResponse.body.success).toBe(true);

      // Next search should be cache miss
      const searchResponse = await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'JFK',
          destination: 'CDG',
          departureDate: '2026-10-12'
        });

      expect(searchResponse.body.cached).toBe(false);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys for same parameters', async () => {
      const params1 = {
        origin: 'jfk',
        destination: 'cdg',
        departureDate: '2026-10-12',
        passengers: 1,
        cabinClass: 'economy'
      };

      const params2 = {
        origin: 'JFK',
        destination: 'CDG',
        departureDate: '2026-10-12',
        passengers: '1',
        cabinClass: 'ECONOMY'
      };

      await request(app).get('/api/v1/flights/search').query(params1);
      const response = await request(app).get('/api/v1/flights/search').query(params2);

      // Should hit cache despite different casing/types
      expect(response.body.cached).toBe(true);
    });
  });

  describe('Response Format', () => {
    it('should include cached flag in response', async () => {
      const response = await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'JFK',
          destination: 'CDG',
          departureDate: '2026-10-12'
        });

      expect(response.body).toHaveProperty('cached');
      expect(typeof response.body.cached).toBe('boolean');
    });

    it('should include count in response', async () => {
      const response = await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'JFK',
          destination: 'CDG',
          departureDate: '2026-10-12'
        });

      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
    });

    it('should return properly formatted flight data', async () => {
      const response = await request(app)
        .get('/api/v1/flights/search')
        .query({
          origin: 'JFK',
          destination: 'CDG',
          departureDate: '2026-10-12'
        });

      if (response.body.data.length > 0) {
        const flight = response.body.data[0];
        expect(flight).toHaveProperty('id');
        expect(flight).toHaveProperty('airline');
        expect(flight).toHaveProperty('flightNumber');
        expect(flight).toHaveProperty('origin');
        expect(flight).toHaveProperty('destination');
        expect(flight).toHaveProperty('departureTime');
        expect(flight).toHaveProperty('arrivalTime');
        expect(flight).toHaveProperty('price');
        expect(flight.price).toHaveProperty('amount');
        expect(flight.price).toHaveProperty('currency');
      }
    });
  });
});
