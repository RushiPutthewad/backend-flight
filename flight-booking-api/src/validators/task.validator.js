const { z } = require('zod');
const { TASK_STATUS, TASK_CATEGORIES } = require('../constants/task-status');

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(Object.values(TASK_CATEGORIES)),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.\d{3}Z)?$/).optional(),
  bookingId: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const updateTaskSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.enum(Object.values(TASK_CATEGORIES)).optional(),
  status: z.enum(Object.values(TASK_STATUS)).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.\d{3}Z)?$/).optional(),
  tags: z.array(z.string()).optional()
});

const getTasksSchema = z.object({
  status: z.enum(Object.values(TASK_STATUS)).optional(),
  category: z.enum(Object.values(TASK_CATEGORIES)).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional()
});

const getTaskSchema = z.object({
  taskId: z.string().min(1)
});

const deleteTaskSchema = z.object({
  taskId: z.string().min(1)
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  getTasksSchema,
  getTaskSchema,
  deleteTaskSchema
};