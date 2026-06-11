const { z } = require('zod');
const { TASK_STATUS, TASK_PRIORITIES } = require('../utils/constants');

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.string().datetime().optional().or(z.date().optional()),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional().nullable(),
  status: z.enum(TASK_STATUS).optional(),
  position: z.number().positive('Position must be a positive number')
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.string().datetime().optional().or(z.date().optional()).nullable(),
  assignedTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional().nullable(),
  status: z.enum(TASK_STATUS).optional(),
  position: z.number().positive().optional(),
  version: z.number().int().min(0, 'Version is required for updates')
});

const bulkUpdatePositionsSchema = z.object({
  tasks: z.array(
    z.object({
      taskId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid task ID'),
      status: z.enum(TASK_STATUS),
      position: z.number().positive(),
      version: z.number().int().min(0)
    })
  ).min(1, 'At least one task must be provided')
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  bulkUpdatePositionsSchema
};
