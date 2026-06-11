const mongoose = require('mongoose');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const activityService = require('./activityService');

const getTasks = async (boardId, query) => {
  const filter = { boardId };
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.search) {
    filter.title = { $regex: query.search, $options: 'i' };
  }

  const tasks = await Task.find(filter).sort({ position: 1 }).populate('assignedTo', 'name avatar');
  return tasks;
};

const createTask = async (boardId, taskData, userId) => {
  // Simple append at the end logic for new task: finding max position in that status
  const maxPositionTask = await Task.findOne({ boardId, status: taskData.status || 'Todo' })
    .sort({ position: -1 })
    .select('position');

  const newPosition = maxPositionTask ? maxPositionTask.position + 65536 : 65536;

  const task = await Task.create({
    ...taskData,
    boardId,
    createdBy: userId,
    position: taskData.position || newPosition
  });

  await activityService.logActivity(boardId, task._id, 'TASK_CREATED', userId, { title: task.title });

  return await Task.findById(task._id).populate('assignedTo', 'name avatar');
};

const updateTask = async (taskId, updates, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Optimistic concurrency control check
  if (updates.version !== undefined && updates.version !== task.version) {
    throw new ApiError(409, 'Conflict: Task was updated by another user. Please refresh and try again.', [], true, 'CONFLICT');
  }

  const oldStatus = task.status;
  const newStatus = updates.status || task.status;

  Object.keys(updates).forEach((key) => {
    if (key !== 'version') {
      task[key] = updates[key];
    }
  });

  task.version += 1;
  await task.save();

  if (oldStatus !== newStatus) {
    await activityService.logActivity(task.boardId, task._id, 'TASK_MOVED', userId, { from: oldStatus, to: newStatus });
  } else {
    await activityService.logActivity(task.boardId, task._id, 'TASK_UPDATED', userId, { updates: Object.keys(updates) });
  }

  return await Task.findById(task._id).populate('assignedTo', 'name avatar');
};

const bulkUpdatePositions = async (boardId, tasksUpdates, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bulkOps = tasksUpdates.map((update) => ({
      updateOne: {
        filter: { _id: update.taskId, boardId, version: update.version },
        update: {
          $set: { status: update.status, position: update.position },
          $inc: { version: 1 }
        }
      }
    }));

    const result = await Task.bulkWrite(bulkOps, { session });

    if (result.modifiedCount !== tasksUpdates.length) {
      throw new ApiError(409, 'Conflict: Some tasks could not be updated due to version mismatch. Please refresh.', [], true, 'CONFLICT');
    }

    await session.commitTransaction();
    session.endSession();

    // Log a single generic bulk move activity to avoid spam
    await activityService.logActivity(boardId, null, 'TASK_MOVED', userId, { count: tasksUpdates.length });

    return true;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) return;

  const boardId = task.boardId;
  await Task.findByIdAndDelete(taskId);

  await activityService.logActivity(boardId, taskId, 'TASK_DELETED', userId, { title: task.title });
};

const addAttachment = async (taskId, file, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const attachment = {
    filename: file.originalname,
    url: `/uploads/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size
  };

  task.attachments.push(attachment);
  task.version += 1;
  await task.save();

  await activityService.logActivity(task.boardId, task._id, 'TASK_UPDATED', userId, { action: 'Attachment added' });

  return attachment;
};

// Periodic rebalance to avoid fractional indexing precision loss (optional manual trigger or CRON)
const rebalancePositions = async (boardId) => {
  // Logic to re-spread positions evenly across integer intervals
  const tasks = await Task.find({ boardId }).sort({ status: 1, position: 1 });
  let currentStatus = null;
  let counter = 1;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bulkOps = [];
    for (const task of tasks) {
      if (task.status !== currentStatus) {
        currentStatus = task.status;
        counter = 1;
      }
      const newPos = counter * 65536;
      bulkOps.push({
        updateOne: {
          filter: { _id: task._id },
          update: { $set: { position: newPos }, $inc: { version: 1 } }
        }
      });
      counter++;
    }

    if (bulkOps.length > 0) {
      await Task.bulkWrite(bulkOps, { session });
    }

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  bulkUpdatePositions,
  deleteTask,
  addAttachment,
  rebalancePositions
};
