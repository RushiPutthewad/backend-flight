const crypto = require('crypto');
const logger = require('../config/logger');

/**
 * Mock Flight Provider
 * Simulates external flight API responses
 * Replace with real provider later without changing the service layer
 */
class FlightProvider {
  constructor() {
    this.mockFlights = this._generateMockFlights();
  }

  /**
   * Search flights based on criteria
   * @param {Object} criteria - Search parameters
   * @returns {Promise<Array>} List of flights
   */
  async searchFlights(criteria) {
    const { origin, destination, departureDate, passengers = 1, cabinClass = 'economy' } = criteria;

    logger.info(`Provider: Searching flights ${origin} -> ${destination} on ${departureDate}`);

    // Simulate API latency
    await this._simulateDelay(100, 300);

    // Filter mock flights
    const results = this.mockFlights.filter(flight => {
      const matchesRoute =
        flight.origin.toUpperCase() === origin.toUpperCase() &&
        flight.destination.toUpperCase() === destination.toUpperCase();

      const matchesDate = this._matchesDate(flight.departureTime, departureDate);

      const hasCapacity = flight.seats.available[cabinClass] >= passengers;

      return matchesRoute && matchesDate && hasCapacity;
    });

    return results.map(flight => this._normalizeFlightData(flight, cabinClass));
  }

  /**
   * Get flight by ID
   * @param {String} flightId - Flight identifier
   * @returns {Promise<Object>} Flight details
   */
  async getFlight(flightId) {
    logger.info(`Provider: Fetching flight ${flightId}`);

    // Simulate API latency
    await this._simulateDelay(50, 150);

    const flight = this.mockFlights.find(f => f.id === flightId);

    if (!flight) {
      throw new Error('Flight not found in provider');
    }

    return this._normalizeFlightData(flight);
  }

  /**
   * Book a flight (mock implementation)
   * @param {Object} flightData - Booking details
   * @returns {Promise<Object>} Booking confirmation
   */
  async bookFlight(flightData) {
    logger.info(`Provider: Booking flight ${flightData.flightId}`);

    await this._simulateDelay(200, 500);

    const bookingReference = this._generateBookingReference();

    return {
      providerBookingId: `PRV-${bookingReference}`,
      status: 'confirmed',
      bookingReference,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cancel a flight booking (mock implementation)
   * @param {String} providerBookingId - Provider booking ID
   * @returns {Promise<Object>} Cancellation confirmation
   */
  async cancelFlight(providerBookingId) {
    logger.info(`Provider: Cancelling booking ${providerBookingId}`);

    await this._simulateDelay(100, 300);

    return {
      providerBookingId,
      status: 'cancelled',
      refundEligible: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Normalize flight data from provider format to application format
   * @private
   */
  _normalizeFlightData(flight, cabinClass = 'economy') {
    return {
      id: flight.id,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      origin: flight.origin,
      destination: flight.destination,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: flight.duration,
      cabinClass: cabinClass,
      price: {
        amount: flight.prices[cabinClass],
        currency: 'USD'
      },
      seats: {
        available: flight.seats.available[cabinClass],
        total: flight.seats.total
      },
      amenities: flight.amenities
    };
  }

  /**
   * Check if flight departure matches the search date
   * @private
   */
  _matchesDate(departureTime, searchDate) {
    const flightDate = new Date(departureTime).toISOString().split('T')[0];
    return flightDate === searchDate;
  }

  /**
   * Simulate network delay
   * @private
   */
  async _simulateDelay(min = 100, max = 500) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Generate mock booking reference
   * @private
   */
  _generateBookingReference() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Generate mock flight data
   * @private
   */
  _generateMockFlights() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return [
      {
        id: 'flight-jfk-cdg-001',
        flightNumber: 'EA101',
        airline: 'Example Air',
        origin: 'JFK',
        destination: 'CDG',
        departureTime: new Date('2026-10-12T18:00:00.000Z').toISOString(),
        arrivalTime: new Date('2026-10-13T07:30:00.000Z').toISOString(),
        duration: 450,
        prices: { economy: 850, business: 2500, first: 5000 },
        seats: {
          total: 300,
          available: { economy: 150, business: 30, first: 10 }
        },
        amenities: { wifi: true, entertainment: true, power: true, meals: true }
      },
      {
        id: 'flight-jfk-lhr-001',
        flightNumber: 'BA202',
        airline: 'British Airways',
        origin: 'JFK',
        destination: 'LHR',
        departureTime: new Date('2026-10-12T20:00:00.000Z').toISOString(),
        arrivalTime: new Date('2026-10-13T08:00:00.000Z').toISOString(),
        duration: 420,
        prices: { economy: 750, business: 2200, first: 4500 },
        seats: {
          total: 250,
          available: { economy: 100, business: 20, first: 5 }
        },
        amenities: { wifi: true, entertainment: true, power: true, meals: true }
      },
      {
        id: 'flight-lax-nrt-001',
        flightNumber: 'JL101',
        airline: 'Japan Airlines',
        origin: 'LAX',
        destination: 'NRT',
        departureTime: new Date('2026-10-12T13:00:00.000Z').toISOString(),
        arrivalTime: new Date('2026-10-13T17:30:00.000Z').toISOString(),
        duration: 690,
        prices: { economy: 950, business: 3200, first: 6500 },
        seats: {
          total: 350,
          available: { economy: 180, business: 40, first: 8 }
        },
        amenities: { wifi: true, entertainment: true, power: true, meals: true }
      },
      {
        id: 'flight-sfo-lhr-001',
        flightNumber: 'UA501',
        airline: 'United Airlines',
        origin: 'SFO',
        destination: 'LHR',
        departureTime: new Date('2026-10-12T15:30:00.000Z').toISOString(),
        arrivalTime: new Date('2026-10-13T09:45:00.000Z').toISOString(),
        duration: 615,
        prices: { economy: 880, business: 2800 },
        seats: {
          total: 280,
          available: { economy: 140, business: 25 }
        },
        amenities: { wifi: true, entertainment: true, power: true, meals: true }
      },
      {
        id: 'flight-ord-cdg-001',
        flightNumber: 'AA305',
        airline: 'American Airlines',
        origin: 'ORD',
        destination: 'CDG',
        departureTime: new Date('2026-10-12T19:00:00.000Z').toISOString(),
        arrivalTime: new Date('2026-10-13T09:30:00.000Z').toISOString(),
        duration: 510,
        prices: { economy: 820, business: 2400, first: 4800 },
        seats: {
          total: 320,
          available: { economy: 160, business: 35, first: 12 }
        },
        amenities: { wifi: true, entertainment: true, power: true, meals: true }
      }
    ];
  }
}

module.exports = FlightProvider;
