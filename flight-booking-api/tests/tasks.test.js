const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Task = require('../src/models/task.model');
const User = require('../src/models/user.model');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');

describe('Task CRUD Operations', () => {
  let authToken;
  let userId;
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flight_booking_test');

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: 'user'
    });

    userId = testUser._id;

    // Generate auth token
    authToken = jwt.sign(
      { userId: userId.toString() },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up
    await Task.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear tasks before each test
    await Task.deleteMany({});
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Book Flight to Paris',
        description: 'Book a flight for business trip',
        category: 'travel',
        priority: 'high',
        dueDate: '2026-10-15T00:00:00.000Z'
      };

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(taskData.title);
      expect(res.body.data.category).toBe(taskData.category);
      expect(res.body.data.status).toBe('todo');
    });

    it('should fail without authentication', async () => {
      const taskData = {
        title: 'Test Task',
        category: 'travel'
      };

      await request(app)
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(401);
    });

    it('should fail with invalid data', async () => {
      const taskData = {
        title: '',
        category: 'invalid-category'
      };

      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(422);
    });
  });

  describe('GET /api/v1/tasks', () => {
    beforeEach(async () => {
      // Create test tasks
      await Task.create([
        {
          user: userId,
          title: 'Task 1',
          category: 'travel',
          status: 'todo'
        },
        {
          user: userId,
          title: 'Task 2',
          category: 'business',
          status: 'in_progress'
        },
        {
          user: userId,
          title: 'Task 3',
          category: 'travel',
          status: 'completed'
        }
      ]);
    });

    it('should get all tasks for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination.total).toBe(3);
    });

    it('should filter tasks by status', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?status=todo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('todo');
    });

    it('should filter tasks by category', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?category=travel')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every(task => task.category === 'travel')).toBe(true);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/v1/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.pages).toBe(2);
    });
  });

  describe('GET /api/v1/tasks/:taskId', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        user: userId,
        title: 'Test Task',
        category: 'travel',
        status: 'todo'
      });
      taskId = task._id;
    });

    it('should get task by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(taskId.toString());
      expect(res.body.data.title).toBe('Test Task');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/v1/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should not access another user\'s task', async () => {
      // Create another user
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        role: 'user'
      });

      // Create task for other user
      const otherTask = await Task.create({
        user: otherUser._id,
        title: 'Other User Task',
        category: 'personal',
        status: 'todo'
      });

      // Try to access with first user's token
      await request(app)
        .get(`/api/v1/tasks/${otherTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      await User.findByIdAndDelete(otherUser._id);
    });
  });

  describe('PATCH /api/v1/tasks/:taskId', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        user: userId,
        title: 'Original Title',
        category: 'travel',
        status: 'todo'
      });
      taskId = task._id;
    });

    it('should update task', async () => {
      const updates = {
        title: 'Updated Title',
        status: 'in_progress'
      };

      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.status).toBe('in_progress');
    });

    it('should auto-set completedAt when status changes to completed', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.completedAt).toBeTruthy();
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .patch(`/api/v1/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/tasks/:taskId', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({
        user: userId,
        title: 'Task to Delete',
        category: 'travel',
        status: 'todo'
      });
      taskId = task._id;
    });

    it('should delete task', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Task deleted successfully');

      // Verify task is deleted
      const task = await Task.findById(taskId);
      expect(task).toBeNull();
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .delete(`/api/v1/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/tasks/stats', () => {
    beforeEach(async () => {
      await Task.create([
        { user: userId, title: 'Task 1', category: 'travel', status: 'todo' },
        { user: userId, title: 'Task 2', category: 'business', status: 'todo' },
        { user: userId, title: 'Task 3', category: 'travel', status: 'in_progress' },
        { user: userId, title: 'Task 4', category: 'personal', status: 'completed' },
        { user: userId, title: 'Task 5', category: 'travel', status: 'completed' }
      ]);
    });

    it('should get task statistics', async () => {
      const res = await request(app)
        .get('/api/v1/tasks/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.todo).toBe(2);
      expect(res.body.data.in_progress).toBe(1);
      expect(res.body.data.completed).toBe(2);
    });
  });
});
