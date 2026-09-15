const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');
const { connectDB, disconnectDB } = require('../src/config/database');

describe('Authentication Module', () => {
  let testUser;
  let accessToken;
  let refreshToken;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(userData.email);
      expect(res.body.data.user.firstName).toBe(userData.firstName);
      expect(res.body.data.user.lastName).toBe(userData.lastName);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'TestPass123!',
        firstName: 'Jane',
        lastName: 'Doe'
      };

      // Register first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('CONFLICT');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'short',
        firstName: 'John',
        lastName: 'Doe'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Register a test user
      const userData = {
        email: 'login@example.com',
        password: 'TestPass123!',
        firstName: 'Login',
        lastName: 'User'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      testUser = res.body.data.user;
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'TestPass123!'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('login@example.com');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should reject login with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'TestPass123!'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    beforeEach(async () => {
      // Register and login a test user
      const userData = {
        email: 'me@example.com',
        password: 'TestPass123!',
        firstName: 'Me',
        lastName: 'User'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      testUser = res.body.data.user;
      accessToken = res.body.data.accessToken;
    });

    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('me@example.com');
      expect(res.body.data.firstName).toBe('Me');
      expect(res.body.data.password).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    beforeEach(async () => {
      // Register and login a test user
      const userData = {
        email: 'refresh@example.com',
        password: 'TestPass123!',
        firstName: 'Refresh',
        lastName: 'User'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      refreshToken = res.body.data.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.accessToken).not.toBe(refreshToken);
    });

    it('should reject refresh with invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    beforeEach(async () => {
      // Register and login a test user
      const userData = {
        email: 'logout@example.com',
        password: 'TestPass123!',
        firstName: 'Logout',
        lastName: 'User'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('should logout user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');

      // Try to use the refresh token after logout (should fail)
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(refreshRes.body.success).toBe(false);
    });

    it('should require authentication for logout', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving to database', async () => {
      const userData = {
        email: 'hash@example.com',
        password: 'PlainTextPassword123!',
        firstName: 'Hash',
        lastName: 'Test'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ email: userData.email }).select('+password');

      expect(user.password).toBeDefined();
      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(20); // bcrypt hash length
    });
  });
});
