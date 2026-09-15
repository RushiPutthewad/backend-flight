# Flight Booking API

A comprehensive flight booking and task management REST API built with Node.js, Express, MongoDB, and Redis.

## Features

- User authentication with JWT
- Flight search with Redis caching
- Booking management with status tracking
- Personal task management
- Payment integration ready (Stripe)
- Rate limiting and security best practices
- Centralized error handling

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Cache:** Redis
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod
- **Security:** Helmet, CORS, bcryptjs
- **Logging:** Pino
- **Testing:** Jest, Supertest

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Redis server
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
   - MongoDB connection string
   - Redis URL
   - JWT secrets
   - API keys (optional)

## Environment Variables

See `.env.example` for all required and optional environment variables:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection URL
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `FLIGHT_PROVIDER_URL` - External flight API URL (optional)
- `PAYMENT_PROVIDER_SECRET` - Payment provider credentials (optional)

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## API Endpoints

### Health Check
- `GET /health` - Check server, database, and Redis status

### Authentication (Phase 2)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### Flights (Phase 4)
- `GET /api/v1/flights/search` - Search flights
- `GET /api/v1/flights/:id` - Get flight details

### Bookings (Phase 5)
- `POST /api/v1/bookings` - Create booking
- `GET /api/v1/bookings` - List user bookings
- `GET /api/v1/bookings/:id` - Get booking details
- `POST /api/v1/bookings/:id/cancel` - Cancel booking

### Tasks (Phase 3)
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/tasks` - List user tasks
- `GET /api/v1/tasks/:id` - Get task details
- `PATCH /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task

## Project Structure

```
flight-booking-api/
├── src/
│   ├── app.js                 # Express app setup
│   ├── server.js              # Server entry point
│   ├── config/                # Configuration files
│   │   ├── database.js        # MongoDB connection
│   │   ├── redis.js           # Redis connection
│   │   ├── env.js             # Environment variables
│   │   └── logger.js          # Pino logger setup
│   ├── constants/             # Application constants
│   ├── controllers/           # Request handlers
│   ├── middlewares/           # Express middlewares
│   │   ├── auth.js            # Authentication middleware
│   │   ├── error-handler.js   # Global error handler
│   │   ├── not-found.js       # 404 handler
│   │   ├── rateLimiter.js     # Rate limiting
│   │   └── validate.js        # Request validation
│   ├── models/                # Mongoose models
│   ├── routes/                # Route definitions
│   ├── services/              # Business logic layer
│   ├── providers/             # External API integrations
│   ├── utils/                 # Utility functions
│   ├── validators/            # Zod validation schemas
│   └── jobs/                  # Background jobs (Phase 7)
├── tests/                     # Test files
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── .prettierrc                # Prettier configuration
├── eslint.config.js           # ESLint configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Development Phases

- ✅ **Phase 1:** Project Setup (Complete)
- 🔄 **Phase 2:** Authentication
- 🔄 **Phase 3:** Task CRUD
- 🔄 **Phase 4:** Flight Search
- 🔄 **Phase 5:** Booking Management
- 🔄 **Phase 6:** Payment Integration
- 🔄 **Phase 7:** Background Jobs
- 🔄 **Phase 8:** Testing
- 🔄 **Phase 9:** Deployment

## Security Features

- Helmet.js for secure HTTP headers
- CORS configuration
- Rate limiting
- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Zod
- MongoDB injection prevention
- Environment-based secrets

## Error Handling

The API uses a consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": []
  }
}
```

## Caching Strategy

Redis is used for:
- Flight search results (5 min TTL)
- Session data (optional)
- Rate limiting counters
- Booking lookups (1 min TTL)

## Contributing

1. Follow the existing code structure
2. Run tests before committing
3. Use ESLint and Prettier for code formatting
4. Write meaningful commit messages

## License

ISC

## Support

For issues and questions, please open a GitHub issue.
