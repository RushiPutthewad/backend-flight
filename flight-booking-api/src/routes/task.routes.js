const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createTaskSchema,
  updateTaskSchema,
  getTasksSchema,
  getTaskSchema,
  deleteTaskSchema
} = require('../validators/task.validator');

// All task routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post(
  '/',
  validate(createTaskSchema),
  taskController.createTask
);

/**
 * @route   GET /api/v1/tasks
 * @desc    Get all tasks with optional filters (status, category, priority)
 * @access  Private
 */
router.get(
  '/',
  validate(getTasksSchema),
  taskController.getTasks
);

/**
 * @route   GET /api/v1/tasks/stats
 * @desc    Get task statistics
 * @access  Private
 */
router.get(
  '/stats',
  taskController.getTaskStats
);

/**
 * @route   GET /api/v1/tasks/:taskId
 * @desc    Get single task by ID
 * @access  Private
 */
router.get(
  '/:taskId',
  validate(getTaskSchema),
  taskController.getTaskById
);

/**
 * @route   PATCH /api/v1/tasks/:taskId
 * @desc    Update task
 * @access  Private
 */
router.patch(
  '/:taskId',
  validate(updateTaskSchema),
  taskController.updateTask
);

/**
 * @route   DELETE /api/v1/tasks/:taskId
 * @desc    Delete task
 * @access  Private
 */
router.delete(
  '/:taskId',
  validate(deleteTaskSchema),
  taskController.deleteTask
);

module.exports = router;
