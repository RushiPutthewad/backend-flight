# Project Goal

Build a flight booking and task-management REST API using:

- Node.js
- Express.js
- MongoDB
- Redis
- JWT authentication
- External flight API or mock flight data
- Optional payment integration such as Stripe

The system should allow users to:

- Register and log in
- Search available flights
- Create flight bookings
- View, update, and cancel bookings
- Create personal booking tasks
- Filter tasks by status and category
- Cache frequently accessed flight searches and user data
- Track booking operations such as pending, confirmed, failed, or cancelled

---

# 1. High-Level Architecture

```text
Client
  |
  | HTTP / JSON
  v
Express.js API
  |
  |-- Authentication Middleware
  |-- Validation Middleware
  |-- Booking Controllers
  |-- Task Controllers
  |-- Flight Search Service
  |-- Payment Service
  |-- Redis Cache
  |-- MongoDB
  |-- External Flight Provider
```

## Request Flow

```text
Client Request
    |
    v
Express Router
    |
    v
JWT Authentication
    |
    v
Request Validation
    |
    v
Controller
    |
    v
Service Layer
    |
    |-- Redis
    |-- MongoDB
    |-- External Flight API
    |-- Payment Provider
    |
    v
Response
```

Use a service layer instead of putting business logic directly inside controllers. This will make the project easier to test and extend.

---

# 2. Main Modules

## Authentication

Responsibilities:

- Register a user
- Log in a user
- Generate access tokens
- Hash passwords
- Authenticate protected routes
- Authorize user-owned resources

Recommended implementation:

- `bcrypt` for password hashing
- JWT access token
- Optional refresh token
- JWT payload containing `userId` and optionally `role`

Example JWT payload:

```json
{
  "userId": "64f...",
  "role": "user"
}
```

## Users

Responsibilities:

- Store user profile
- Store password hash
- Store contact information
- Store optional roles

Possible roles:

- `user`
- `admin`
- `support`

## Flights

Responsibilities:

- Search flights
- Search by origin, destination, date, passengers, and cabin class
- Cache search results in Redis
- Return normalized flight data

For development, choose one of these approaches:

1. Start with local mock flight data.
2. Add a real flight provider after the booking workflow works.
3. Keep the external provider behind a service interface.

This prevents the entire project from depending on a third-party API during early development.

## Bookings

Responsibilities:

- Create a booking
- Store passenger information
- Store selected flight details
- Track booking status
- Cancel a booking
- Retrieve booking history

Booking statuses:

```text
pending
payment_pending
confirmed
failed
cancelled
expired
```

## Tasks

Responsibilities:

- Create personal booking tasks
- Retrieve all tasks for the authenticated user
- Filter by status and category
- Update task information
- Delete tasks

Task examples:

- Book flight to Paris
- Upload passport documents
- Confirm hotel reservation
- Pay for business trip

Task statuses:

```text
pending
in_progress
booked
completed
cancelled
```

## Payments

This can initially be mocked, but the production architecture should support:

- Payment intent creation
- Payment confirmation
- Payment failure handling
- Booking confirmation after successful payment
- Refund handling after cancellation

---

# 3. Suggested Project Structure

```text
flight-booking-api/
├── src/
│   ├── app.js
│   ├── server.js
│   │
│   ├── config/
│   │   ├── env.js
│   │   ├── database.js
│   │   └── redis.js
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validation.js
│   │   │
│   │   ├── users/
│   │   │   ├── user.model.js
│   │   │   ├── user.controller.js
│   │   │   ├── user.routes.js
│   │   │   └── user.service.js
│   │   │
│   │   ├── flights/
│   │   │   ├── flight.controller.js
│   │   │   ├── flight.routes.js
│   │   │   ├── flight.service.js
│   │   │   ├── flight.provider.js
│   │   │   └── flight.validation.js
│   │   │
│   │   ├── bookings/
│   │   │   ├── booking.model.js
│   │   │   ├── booking.controller.js
│   │   │   ├── booking.routes.js
│   │   │   ├── booking.service.js
│   │   │   └── booking.validation.js
│   │   │
│   │   ├── tasks/
│   │   │   ├── task.model.js
│   │   │   ├── task.controller.js
│   │   │   ├── task.routes.js
│   │   │   ├── task.service.js
│   │   │   └── task.validation.js
│   │   │
│   │   └── payments/
│   │       ├── payment.controller.js
│   │       ├── payment.routes.js
│   │       └── payment.service.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── rate-limit.middleware.js
│   │   ├── validate.middleware.js
│   │   └── not-found.middleware.js
│   │
│   ├── utils/
│   │   ├── async-handler.js
│   │   ├── api-error.js
│   │   ├── jwt.js
│   │   ├── pagination.js
│   │   └── cache-keys.js
│   │
│   └── jobs/
│       └── booking-expiration.job.js
│
├── tests/
│   ├── auth.test.js
│   ├── flights.test.js
│   ├── bookings.test.js
│   └── tasks.test.js
│
├── .env.example
├── package.json
└── README.md
```

---

# 4. MongoDB Data Models

## User

```js
{
  _id: ObjectId,
  name: String,
  email: String,
  passwordHash: String,
  phone: String,
  role: String,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

```text
email: unique
```

## Task

```js
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  description: String,
  category: String,
  status: String,
  dueDate: Date,
  bookingId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

Suggested indexes:

```text
{ userId: 1, createdAt: -1 }
{ userId: 1, status: 1 }
{ userId: 1, category: 1 }
```

## Booking

```js
{
  _id: ObjectId,
  userId: ObjectId,
  bookingReference: String,
  flight: {
    providerFlightId: String,
    airline: String,
    flightNumber: String,
    origin: String,
    destination: String,
    departureTime: Date,
    arrivalTime: Date,
    cabinClass: String
  },
  passengers: [
    {
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      passportNumber: String
    }
  ],
  price: {
    amount: Number,
    currency: String
  },
  status: String,
  paymentStatus: String,
  cancellationReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

Suggested indexes:

```text
{ userId: 1, createdAt: -1 }
{ userId: 1, status: 1 }
{ bookingReference: 1 }
```

Do not store sensitive payment card details in MongoDB. Store only payment provider IDs and payment status.

## Flight Search Cache Object

This does not necessarily need a MongoDB collection. Store it in Redis:

```json
{
  "search": {
    "origin": "JFK",
    "destination": "CDG",
    "departureDate": "2026-10-12",
    "returnDate": null,
    "passengers": 1,
    "cabinClass": "economy"
  },
  "results": []
}
```

---

# 5. REST API Design

Use a versioned API prefix:

```text
/api/v1
```

## Authentication Routes

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Register Request

```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "password": "strong-password",
  "phone": "+15555555555"
}
```

### Login Response

```json
{
  "user": {
    "id": "64f...",
    "name": "John Smith",
    "email": "john@example.com"
  },
  "accessToken": "jwt-token"
}
```

## Flight Routes

```http
GET /api/v1/flights/search
GET /api/v1/flights/:flightId
```

Example search request:

```http
GET /api/v1/flights/search?origin=JFK&destination=CDG&departureDate=2026-10-12&passengers=1&cabinClass=economy
```

Example response:

```json
{
  "data": [
    {
      "id": "flight-123",
      "airline": "Example Air",
      "flightNumber": "EA101",
      "origin": "JFK",
      "destination": "CDG",
      "departureTime": "2026-10-12T18:00:00.000Z",
      "arrivalTime": "2026-10-13T07:30:00.000Z",
      "price": {
        "amount": 850,
        "currency": "USD"
      }
    }
  ],
  "cached": true
}
```

## Booking Routes

```http
POST   /api/v1/bookings
GET    /api/v1/bookings
GET    /api/v1/bookings/:bookingId
PATCH  /api/v1/bookings/:bookingId
POST   /api/v1/bookings/:bookingId/cancel
```

### Create Booking Request

```json
{
  "flightId": "flight-123",
  "passengers": [
    {
      "firstName": "John",
      "lastName": "Smith",
      "dateOfBirth": "1990-05-10",
      "passportNumber": "P1234567"
    }
  ],
  "contactEmail": "john@example.com"
}
```

### Create Booking Response

```json
{
  "data": {
    "id": "booking-123",
    "bookingReference": "BK-8F72K1",
    "status": "payment_pending",
    "paymentStatus": "pending",
    "price": {
      "amount": 850,
      "currency": "USD"
    }
  }
}
```

## Task Routes

```http
POST   /api/v1/tasks
GET    /api/v1/tasks
GET    /api/v1/tasks/:taskId
PATCH  /api/v1/tasks/:taskId
DELETE /api/v1/tasks/:taskId
```

### Create Task

```json
{
  "title": "Book Flight to Paris",
  "description": "Book a flight from New York to Paris for the October business trip.",
  "category": "travel",
  "status": "pending",
  "dueDate": "2026-09-30T00:00:00.000Z"
}
```

### Filter Tasks

```http
GET /api/v1/tasks?status=pending
GET /api/v1/tasks?category=travel
GET /api/v1/tasks?status=booked&category=business
GET /api/v1/tasks?page=1&limit=20
```

### Update Task

```json
{
  "title": "Book Updated Flight to Paris",
  "status": "booked",
  "description": "Travel dates changed to October 15."
}
```

---

# 6. End-to-End Booking Workflow

## Workflow A: User Registration

```text
1. User submits name, email, and password.
2. Validate request body.
3. Check whether email already exists.
4. Hash password with bcrypt.
5. Create user in MongoDB.
6. Generate JWT.
7. Return user and token.
```

## Workflow B: User Login

```text
1. User submits email and password.
2. Find user by email.
3. Compare password with passwordHash.
4. Generate access token.
5. Optionally generate refresh token.
6. Return authentication response.
```

## Workflow C: Flight Search

```text
1. User sends origin, destination, date, and passenger count.
2. Validate search parameters.
3. Generate a deterministic Redis cache key.
4. Check Redis.
5. If cached:
   - Return cached results.
6. If not cached:
   - Query external provider or mock provider.
   - Normalize the provider response.
   - Store results in Redis with expiration.
   - Return results.
```

Example Redis key:

```text
flights:search:JFK:CDG:2026-10-12:1:economy
```

Example TTL:

```text
300 seconds
```

Flight prices and availability become stale quickly, so flight search cache entries should have a relatively short TTL.

## Workflow D: Create Booking

```text
1. Authenticate the user.
2. Validate flight and passenger information.
3. Retrieve the selected flight.
4. Recheck price and availability with the provider.
5. Create a booking with status payment_pending.
6. Create a payment intent.
7. Return payment information to the client.
```

Important: Do not trust the price sent by the client. Always retrieve the current price from your server-side provider or database.

## Workflow E: Confirm Payment

```text
1. Payment provider processes the payment.
2. Provider sends a webhook to your API.
3. Verify webhook signature.
4. Find the associated booking.
5. Mark payment as paid.
6. Mark booking as confirmed.
7. Generate ticket or provider confirmation code.
8. Update related task status if one exists.
```

Example state transition:

```text
pending
  -> payment_pending
  -> confirmed
```

Failure transition:

```text
payment_pending
  -> failed
```

## Workflow F: Cancel Booking

```text
1. Authenticate the user.
2. Retrieve booking by ID and user ID.
3. Check whether cancellation is allowed.
4. Request cancellation from the external provider.
5. Update booking status to cancelled.
6. Request refund if applicable.
7. Update related task status.
8. Clear related cache entries if needed.
```

## Workflow G: Task Management

```text
1. User creates a task.
2. API attaches authenticated userId.
3. Task is stored in MongoDB.
4. User retrieves only their own tasks.
5. User filters by status or category.
6. User updates the task.
7. User deletes the task.
```

Every task query must include the authenticated user's ID:

```js
{
  userId: req.user.userId,
  status: "pending"
}
```

Never retrieve a task using only its ID. Otherwise, one user could access another user's task.

---

# 7. Redis Usage Plan

Redis should be used for fast-changing or frequently requested data, not as the primary source of truth.

## Cache Flight Searches

```text
Key: flights:search:{hash}
Value: JSON flight results
TTL: 5 minutes
```

The search parameters should be normalized before generating the key.

For example, these should generate the same key:

```text
JFK + CDG
jfk + cdg
```

Normalize values to uppercase and sort optional parameters consistently.

## Cache User Session Data

If using refresh tokens or session tracking:

```text
Key: session:{userId}:{tokenId}
Value: session metadata
TTL: 7 days
```

## Cache Booking Lookup

Optional:

```text
Key: booking:{bookingId}
Value: serialized booking
TTL: 60 seconds
```

When a booking is updated or cancelled:

```text
DEL booking:{bookingId}
```

## Rate Limiting

Redis can support rate limiting for:

- Login attempts
- Flight search requests
- Booking creation
- Password reset requests

Example key:

```text
rate-limit:login:{ip}
```

## Cache Invalidation Rules

| Operation | Redis Action |
|---|---|
| Flight search | Read/write search cache |
| Booking creation | No long-term flight cache update unless availability changes |
| Booking update | Delete booking cache |
| Booking cancellation | Delete booking cache |
| Task creation | Optional task cache invalidation |
| Task update | Delete task cache |
| User logout | Delete refresh session |

---

# 8. Authentication and Security

## JWT Recommendations

For a basic project:

```text
Access token expiration: 15 minutes
```

For a stronger implementation:

```text
Access token: 15 minutes
Refresh token: 7-30 days
```

Store refresh tokens securely. Prefer an HTTP-only cookie for browser clients.

## Required Security Measures

- Hash passwords with bcrypt or Argon2
- Never return password hashes
- Use `helmet`
- Use CORS configuration
- Use request rate limiting
- Validate all request bodies
- Sanitize MongoDB input
- Do not expose stack traces in production
- Verify payment webhooks
- Do not store raw card details
- Use HTTPS in production
- Restrict users to their own bookings and tasks
- Use short-lived access tokens
- Rotate refresh tokens where practical

## Ownership Checks

Booking lookup:

```js
const booking = await Booking.findOne({
  _id: bookingId,
  userId: req.user.userId
});
```

Task lookup:

```js
const task = await Task.findOne({
  _id: taskId,
  userId: req.user.userId
});
```

This is safer than retrieving first and checking ownership afterward.

---

# 9. Error Response Format

Use a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking was not found."
  }
}
```

Example validation error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      {
        "field": "departureDate",
        "message": "Departure date is required."
      }
    ]
  }
}
```

Recommended HTTP statuses:

| Status | Usage |
|---|---|
| `200` | Successful read or update |
| `201` | Successful creation |
| `204` | Successful deletion |
| `400` | Invalid request |
| `401` | Missing or invalid authentication |
| `403` | Authenticated but not authorized |
| `404` | Resource not found |
| `409` | Conflict |
| `422` | Business validation failure |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |

---

# 10. Development Phases

## Phase 1: Project Setup

Tasks:

- Initialize Node.js project
- Install Express
- Configure environment variables
- Add MongoDB connection
- Add Redis connection
- Add ESLint and Prettier
- Add centralized error handling
- Add health-check endpoint

Initial endpoint:

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

## Phase 2: Authentication

Implement:

- User model
- Registration
- Login
- JWT middleware
- Current-user endpoint
- Password hashing
- Authentication tests

Do not start bookings until protected routes work correctly.

## Phase 3: Task CRUD

Implement:

- Task model
- Create task
- List tasks
- Get task by ID
- Update task
- Delete task
- Status filtering
- Category filtering
- Pagination
- Ownership checks

This is a good module to complete before adding the more complex flight workflow.

## Phase 4: Flight Search

Implement:

- Mock flight provider
- Flight search validation
- Search service
- Redis caching
- Cache hit and miss behavior
- Flight normalization

Example provider interface:

```js
class FlightProvider {
  async searchFlights(criteria) {}
  async getFlight(flightId) {}
  async bookFlight(flightData) {}
  async cancelFlight(providerBookingId) {}
}
```

Later, replace the mock implementation with a real provider without changing the controller or route layer.

## Phase 5: Booking Management

Implement:

- Booking model
- Create booking
- Retrieve bookings
- Retrieve one booking
- Cancel booking
- Booking status transitions
- Booking reference generation
- Rechecking price and availability

## Phase 6: Payment Integration

Implement:

- Payment intent creation
- Payment status tracking
- Webhook endpoint
- Webhook signature validation
- Booking confirmation after payment
- Failed payment handling
- Refund handling

The webhook should be treated as the trusted source for final payment status.

## Phase 7: Background Jobs

Add background processing for:

- Expiring unpaid bookings
- Sending confirmation emails
- Sending cancellation emails
- Cleaning old Redis data
- Checking pending provider bookings

A booking that remains `payment_pending` for too long should become `expired`.

## Phase 8: Testing

Add:

- Unit tests for services
- Integration tests for routes
- Authentication tests
- Ownership tests
- Redis cache tests
- Booking state transition tests
- Payment webhook tests
- Error handling tests

Important test cases:

```text
Unauthenticated users cannot access private routes.
Users cannot access another user's tasks.
Users cannot access another user's bookings.
Invalid flight dates are rejected.
A cancelled booking cannot be cancelled again.
A confirmed booking cannot be marked pending.
Payment failure does not confirm a booking.
Redis cache hits avoid provider calls.
```

## Phase 9: Deployment

Production components:

```text
Node.js API
MongoDB
Redis
Reverse proxy or load balancer
Environment secrets
Logging
Monitoring
```

Use separate environments:

```text
development
test
staging
production
```

---

# 11. Environment Variables

```env
NODE_ENV=development
PORT=3000

MONGODB_URI=mongodb://localhost:27017/flight_booking

REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=replace-with-long-secret
JWT_ACCESS_EXPIRES_IN=15m

JWT_REFRESH_SECRET=replace-with-another-long-secret
JWT_REFRESH_EXPIRES_IN=7d

FLIGHT_PROVIDER_URL=
FLIGHT_PROVIDER_API_KEY=

PAYMENT_PROVIDER_SECRET=
PAYMENT_WEBHOOK_SECRET=

CLIENT_URL=http://localhost:5173
```

Never commit the actual `.env` file.

---

# 12. Recommended NPM Packages

```bash
npm install express mongoose redis jsonwebtoken bcryptjs
npm install zod helmet cors express-rate-limit dotenv
npm install uuid pino pino-http
npm install stripe
```

Development dependencies:

```bash
npm install -D nodemon eslint prettier jest supertest
```

You can use another validation library, but use one consistently throughout the project.

---

# 13. Example Service Separation

## Controller

The controller should handle HTTP concerns:

```js
async function createTask(req, res) {
  const task = await taskService.createTask({
    userId: req.user.userId,
    ...req.body
  });

  res.status(201).json({
    success: true,
    data: task
  });
}
```

## Service

The service should handle business logic:

```js
async function createTask(input) {
  return Task.create({
    userId: input.userId,
    title: input.title,
    description: input.description,
    category: input.category,
    status: input.status || "pending",
    dueDate: input.dueDate
  });
}
```

## Repository or Model Layer

For a small project, Mongoose models can be used directly in services. For a larger project, add repositories to isolate database access.

---

# 14. Booking State Machine

Define valid transitions explicitly.

```text
pending -> payment_pending
payment_pending -> confirmed
payment_pending -> failed
payment_pending -> expired
confirmed -> cancelled
failed -> payment_pending
```

Invalid examples:

```text
cancelled -> confirmed
expired -> confirmed
cancelled -> pending
```

Implement state transitions in the service layer, not directly in the controller.

Example:

```js
const allowedTransitions = {
  pending: ["payment_pending"],
  payment_pending: ["confirmed", "failed", "expired"],
  confirmed: ["cancelled"],
  failed: ["payment_pending"],
  expired: [],
  cancelled: []
};
```

This prevents accidental or unauthorized status changes.

---

# 15. API Request Lifecycle Example

## Search Flight

```text
GET /api/v1/flights/search
        |
        v
Validate query parameters
        |
        v
Normalize search criteria
        |
        v
Generate Redis key
        |
        v
Check Redis
        |
   +----+----+
   |         |
 Cache hit  Cache miss
   |         |
 Return     Call provider
             |
             v
       Normalize results
             |
             v
       Save Redis cache
             |
             v
          Return
```

## Create Booking

```text
POST /api/v1/bookings
        |
        v
Verify JWT
        |
        v
Validate passengers and flight ID
        |
        v
Retrieve current flight data
        |
        v
Recheck availability and price
        |
        v
Create booking in MongoDB
        |
        v
Create payment intent
        |
        v
Return payment details
        |
        v
Payment webhook
        |
        v
Confirm or fail booking
```

---

# 16. Minimum Viable Product

Build the first version with this scope:

```text
1. User registration and login
2. JWT-protected routes
3. Task CRUD
4. Mock flight search
5. Redis flight-search caching
6. Create booking
7. List user bookings
8. View a booking
9. Cancel a booking
10. Booking status tracking
```

Do not begin with live airline ticket issuance or complex payment flows. First prove that the core data model and workflow are correct.

---

# 17. Advanced Features

After the MVP works, add:

- Refresh-token rotation
- Email verification
- Password reset
- Admin dashboard
- Hotel bookings
- Multi-city flights
- Seat selection
- Baggage selection
- Currency conversion
- Coupon codes
- Refund calculation
- Booking history
- Notifications
- WebSocket booking status updates
- Background job processing
- Audit logs
- Provider failover
- Distributed locks for booking creation
- Idempotency keys for payment and booking requests

## Idempotency

Booking and payment requests should support an idempotency key:

```http
Idempotency-Key: 5f3f3e2a-...
```

This prevents duplicate bookings when a client retries the same request.

Store the key in Redis or MongoDB with the result of the first request.

---

# 18. Final Build Order

Use this order:

```text
1. Initialize project
2. Configure MongoDB
3. Configure Redis
4. Add Express middleware
5. Add error handling
6. Build User model
7. Build register and login
8. Add JWT middleware
9. Build Task CRUD
10. Add task filtering and pagination
11. Build mock flight provider
12. Add flight search endpoint
13. Add Redis flight caching
14. Build Booking model
15. Create booking endpoint
16. Add booking retrieval
17. Add booking cancellation
18. Add booking state transitions
19. Add payment mock
20. Add payment webhook flow
21. Add expiration job
22. Add tests
23. Add API documentation
24. Add Docker configuration
25. Deploy staging environment
26. Add production monitoring
```

The critical design principle is to keep the responsibilities separate:

```text
Routes      -> define endpoints
Controllers -> handle HTTP
Services    -> handle business rules
Models      -> handle MongoDB data
Redis       -> handle temporary fast-access data
Middleware  -> handle cross-cutting concerns
Jobs        -> handle delayed or recurring work
```

This structure gives you a complete backend project while leaving room to add hotels, real flight providers, payments, notifications, and administrative features later.