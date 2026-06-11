const taskService = require('../services/taskService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getIo } = require('../config/socket');

const getTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTasks(req.params.boardId, req.query);
  res.status(200).json(new ApiResponse(200, tasks, 'Tasks fetched successfully'));
});

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.params.boardId, req.body, req.user._id);
  getIo().to(req.params.boardId).emit('task:created', task);
  res.status(201).json(new ApiResponse(201, task, 'Task created successfully'));
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.id, req.body, req.user._id);
  getIo().to(task.boardId.toString()).emit('task:updated', task);
  res.status(200).json(new ApiResponse(200, task, 'Task updated successfully'));
});

const bulkUpdatePositions = asyncHandler(async (req, res) => {
  await taskService.bulkUpdatePositions(req.body.boardId, req.body.tasks, req.user._id);
  getIo().to(req.body.boardId).emit('task:bulk-updated', req.body.tasks);
  res.status(200).json(new ApiResponse(200, {}, 'Tasks positions updated successfully'));
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await require('../models/Task').findById(req.params.id);
  await taskService.deleteTask(req.params.id, req.user._id);
  if (task) {
    getIo().to(task.boardId.toString()).emit('task:deleted', { taskId: req.params.id });
  }
  res.status(200).json(new ApiResponse(200, {}, 'Task deleted successfully'));
});

const addAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a file' });
  }
  const attachment = await taskService.addAttachment(req.params.id, req.file, req.user._id);
  res.status(200).json(new ApiResponse(200, attachment, 'Attachment added successfully'));
});

module.exports = {
  getTasks,
  createTask,
  updateTask,
  bulkUpdatePositions,
  deleteTask,
  addAttachment
};
