const taskService = require('../services/task.service');
const asyncHandler = require('../utils/async-handler');

class TaskController {
  /**
   * @route   POST /api/v1/tasks
   * @desc    Create a new task
   * @access  Private
   */
  createTask = asyncHandler(async (req, res) => {
    const task = await taskService.createTask(req.user._id, req.validatedData);

    res.status(201).json({
      success: true,
      data: task
    });
  });

  /**
   * @route   GET /api/v1/tasks
   * @desc    Get all tasks for authenticated user with filters
   * @access  Private
   */
  getTasks = asyncHandler(async (req, res) => {
    const result = await taskService.getTasks(req.user._id, req.validatedData);

    res.status(200).json({
      success: true,
      data: result.tasks,
      pagination: result.pagination
    });
  });

  /**
   * @route   GET /api/v1/tasks/:taskId
   * @desc    Get single task by ID
   * @access  Private
   */
  getTaskById = asyncHandler(async (req, res) => {
    const task = await taskService.getTaskById(req.user._id, req.validatedData.taskId);

    res.status(200).json({
      success: true,
      data: task
    });
  });

  /**
   * @route   PATCH /api/v1/tasks/:taskId
   * @desc    Update task
   * @access  Private
   */
  updateTask = asyncHandler(async (req, res) => {
    const { taskId, ...updates } = req.validatedData;
    const task = await taskService.updateTask(req.user._id, taskId, updates);

    res.status(200).json({
      success: true,
      data: task
    });
  });

  /**
   * @route   DELETE /api/v1/tasks/:taskId
   * @desc    Delete task
   * @access  Private
   */
  deleteTask = asyncHandler(async (req, res) => {
    await taskService.deleteTask(req.user._id, req.validatedData.taskId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  });

  /**
   * @route   GET /api/v1/tasks/stats
   * @desc    Get task statistics for user
   * @access  Private
   */
  getTaskStats = asyncHandler(async (req, res) => {
    const stats = await taskService.getTaskStats(req.user._id);

    res.status(200).json({
      success: true,
      data: stats
    });
  });
}

module.exports = new TaskController();
