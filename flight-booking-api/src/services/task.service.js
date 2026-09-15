const Task = require('../models/task.model');
const ApiError = require('../utils/api-error');
const { getPaginationParams } = require('../utils/pagination');

class TaskService {
  async createTask(userId, taskData) {
    const task = await Task.create({
      user: userId,
      ...taskData
    });

    return task;
  }

  async getTasks(userId, filters) {
    const { skip, limit, page } = getPaginationParams(filters);

    const query = { user: userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('booking', 'bookingReference status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(query)
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getTaskById(userId, taskId) {
    const task = await Task.findOne({ _id: taskId, user: userId })
      .populate('booking', 'bookingReference status flightDetails');

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    return task;
  }

  async updateTask(userId, taskId, updates) {
    const task = await Task.findOne({ _id: taskId, user: userId });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    Object.assign(task, updates);
    await task.save();

    return task;
  }

  async deleteTask(userId, taskId) {
    const task = await Task.findOne({ _id: taskId, user: userId });

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    await task.deleteOne();

    return { message: 'Task deleted successfully' };
  }

  async getTaskStats(userId) {
    const stats = await Task.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
  }
}

module.exports = new TaskService();