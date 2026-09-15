# Flight Search Module - Phase 4 Implementation

## Overview

This implementation provides a flight search system with Redis caching according to Phase 4 specifications from `flight_plan.md`.

## Architecture

```
Client Request
    |
    v
Flight Routes (validation)
    |
    v
Flight Controller (HTTP handling)
    |
    v
Flight Service (business logic + caching)
    |
    +-- Redis Cache (5-min TTL)
    |
    +-- Flight Provider (mock API)
```

## Components

### 1. **Flight Provider** (`src/providers/flight.provider.js`)
Mock flight API provider that simulates external flight data sources.

**Methods:**
- `searchFlights(criteria)` - Search flights by route and date
- `getFlight(flightId)` - Get single flight details
- `bookFlight(flightData)` - Book a flight (mock)
- `cancelFlight(providerBookingId)` - Cancel booking (mock)

**Features:**
- Simulates API latency (100-500ms)
- Returns normalized flight data
- Includes 5 mock flights (JFK-CDG, JFK-LHR, LAX-NRT, SFO-LHR, ORD-CDG)

### 2. **Flight Service** (`src/services/flight.service.js`)
Business logic layer with Redis caching implementation.

**Request Flow:**
1. Normalize search parameters (uppercase airports, lowercase cabin class)
2. Generate Redis cache key
3. Check Redis cache
4. **Cache HIT**: Return cached results with `cached: true`
5. **Cache MISS**: Call provider, normalize results, cache for 300s, return with `cached: false`

**Cache Configuration:**
- **Key Format**: `flights:search:{origin}:{destination}:{date}:{passengers}:{cabinClass}:{hash}`
- **TTL**: 300 seconds (5 minutes)
- **Normalization**: Uppercase airports, lowercase cabin class, consistent parameter order

### 3. **Cache Keys Utility** (`src/utils/cache-keys.js`)
Centralized cache key generation with normalization.

**Functions:**
- `normalizeSearchParams(params)` - Normalize for consistency
- `generateFlightSearchKey(params)` - Generate cache keys
- `generateFlightDetailKey(flightId)` - Flight detail cache keys
- `generateBookingKey(bookingId)` - Booking cache keys
- `generateSessionKey(userId, tokenId)` - Session cache keys
- `generateRateLimitKey(type, identifier)` - Rate limit keys

### 4. **Flight Controller** (`src/controllers/flight.controller.js`)
HTTP request handlers.

**Endpoints:**
- `searchFlights` - GET /api/v1/flights/search
- `getFlightById` - GET /api/v1/flights/:flightId
- `clearCache` - DELETE /api/v1/flights/cache

### 5. **Flight Routes** (`src/routes/flight.routes.js`)
Express routes with validation middleware.

### 6. **Flight Validators** (`src/validators/flight.validator.js`)
Zod validation schemas for request parameters.

**Validation Rules:**
- `origin`: 3-letter airport code (auto-uppercase)
- `destination`: 3-letter airport code (auto-uppercase)
- `departureDate`: YYYY-MM-DD format
- `returnDate`: YYYY-MM-DD format (optional)
- `passengers`: 1-9 (default: 1)
- `cabinClass`: economy|business|first (default: economy)

### 7. **Redis Configuration** (`src/config/redis.js`)
Redis client with connection management and graceful degradation.

**Features:**
- Auto-reconnect with exponential backoff
- Connection status logging
- Graceful degradation (app works without Redis)

## API Endpoints

### Search Flights
```http
GET /api/v1/flights/search?origin=JFK&destination=CDG&departureDate=2026-10-12&passengers=1&cabinClass=economy
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "flight-jfk-cdg-001",
      "airline": "Example Air",
      "flightNumber": "EA101",
      "origin": "JFK",
      "destination": "CDG",
      "departureTime": "2026-10-12T18:00:00.000Z",
      "arrivalTime": "2026-10-13T07:30:00.000Z",
      "duration": 450,
      "cabinClass": "economy",
      "price": {
        "amount": 850,
        "currency": "USD"
      },
      "seats": {
        "available": 150,
        "total": 300
      },
      "amenities": {
        "wifi": true,
        "entertainment": true,
        "power": true,
        "meals": true
      }
    }
  ],
  "cached": false,
  "count": 1
}
```

### Get Flight by ID
```http
GET /api/v1/flights/flight-jfk-cdg-001
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "flight-jfk-cdg-001",
    "airline": "Example Air",
    "flightNumber": "EA101",
    ...
  }
}
```

### Clear Cache
```http
DELETE /api/v1/flights/cache
```

**Response:**
```json
{
  "success": true,
  "message": "Flight search cache cleared"
}
```

## Testing

### Manual Testing
```bash
# Start the server
npm run dev

# Search flights (cache miss)
curl "http://localhost:3000/api/v1/flights/search?origin=JFK&destination=CDG&departureDate=2026-10-12&passengers=1&cabinClass=economy"

# Same search (cache hit)
curl "http://localhost:3000/api/v1/flights/search?origin=JFK&destination=CDG&departureDate=2026-10-12&passengers=1&cabinClass=economy"

# Get specific flight
curl "http://localhost:3000/api/v1/flights/flight-jfk-cdg-001"

# Clear cache
curl -X DELETE "http://localhost:3000/api/v1/flights/cache"
```

### Automated Tests
```bash
npm test tests/flight.test.js
```

**Test Coverage:**
- ✓ Flight search with valid parameters
- ✓ Cache hit on repeated searches
- ✓ Parameter normalization (case-insensitive)
- ✓ Validation (required fields, formats, ranges)
- ✓ Default values for optional parameters
- ✓ Get flight by ID
- ✓ 404 for non-existent flights
- ✓ Cache clearing
- ✓ Response format verification

## Cache Behavior

### Normalization Examples
These searches generate the **same cache key**:
```
origin=JFK&destination=CDG  →  JFK:CDG
origin=jfk&destination=cdg  →  JFK:CDG
cabinClass=ECONOMY          →  economy
cabinClass=economy          →  economy
```

### Cache TTL
- **Duration**: 300 seconds (5 minutes)
- **Rationale**: Flight prices and availability change frequently
- **Invalidation**: Automatic expiration after TTL

### Graceful Degradation
If Redis is unavailable:
- Service continues to work
- Every request hits the provider (no caching)
- Logs warnings but doesn't fail requests

## File Structure

```
src/
├── providers/
│   └── flight.provider.js        # Mock flight API provider
├── services/
│   └── flight.service.js         # Flight service with caching
├── controllers/
│   └── flight.controller.js      # HTTP request handlers
├── routes/
│   └── flight.routes.js          # Express routes
├── validators/
│   └── flight.validator.js       # Zod validation schemas
├── utils/
│   └── cache-keys.js             # Cache key utilities
└── config/
    └── redis.js                  # Redis configuration

tests/
└── flight.test.js                # Comprehensive test suite
```

## Environment Variables

```env
REDIS_URL=redis://localhost:6379
```

## Phase 4 Requirements Checklist

- ✅ Mock flight provider class
- ✅ Flight search service with caching logic
- ✅ Redis connection and utilities
- ✅ Cache key format: `flights:search:{hash}`
- ✅ Cache TTL: 300 seconds (5 minutes)
- ✅ Parameter normalization (uppercase airports, consistent sorting)
- ✅ GET /api/v1/flights/search endpoint
- ✅ GET /api/v1/flights/:flightId endpoint
- ✅ Return "cached": true/false in response
- ✅ Request flow implementation (validate → normalize → cache check → provider → cache → return)

## Next Steps (Phase 5)

- Implement booking creation
- Add booking retrieval endpoints
- Implement booking cancellation
- Add booking status transitions
- Connect flights to bookings

## Notes

- The provider is intentionally kept as a separate class to allow easy replacement with real flight APIs
- Redis caching is optional - the system degrades gracefully if Redis is unavailable
- All parameters are normalized to ensure cache consistency
- The mock provider includes realistic latency simulation
