const Comment = require('../models/Comment');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const activityService = require('./activityService');

const getComments = async (taskId) => {
  return await Comment.find({ taskId }).populate('userId', 'name avatar').sort({ createdAt: 1 });
};

const addComment = async (taskId, message, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const comment = await Comment.create({
    taskId,
    userId,
    message
  });

  await activityService.logActivity(task.boardId, taskId, 'COMMENT_ADDED', userId, { commentId: comment._id });

  return await Comment.findById(comment._id).populate('userId', 'name avatar');
};

const deleteComment = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) return;

  if (comment.userId.toString() !== userId.toString()) {
    throw new ApiError(403, 'You can only delete your own comments');
  }

  const task = await Task.findById(comment.taskId);
  
  await Comment.findByIdAndDelete(commentId);

  if (task) {
    await activityService.logActivity(task.boardId, task._id, 'COMMENT_DELETED', userId, { commentId });
  }
};

module.exports = {
  getComments,
  addComment,
  deleteComment
};
