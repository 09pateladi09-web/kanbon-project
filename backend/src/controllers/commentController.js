const commentService = require('../services/commentService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getIo } = require('../config/socket');

const getComments = asyncHandler(async (req, res) => {
  const comments = await commentService.getComments(req.params.taskId);
  res.status(200).json(new ApiResponse(200, comments, 'Comments fetched successfully'));
});

const addComment = asyncHandler(async (req, res) => {
  const comment = await commentService.addComment(req.params.taskId, req.body.message, req.user._id);
  const task = await require('../models/Task').findById(req.params.taskId);
  if (task) {
    getIo().to(task.boardId.toString()).emit('comment:added', comment);
  }
  res.status(201).json(new ApiResponse(201, comment, 'Comment added successfully'));
});

const deleteComment = asyncHandler(async (req, res) => {
  const comment = await require('../models/Comment').findById(req.params.id);
  const task = comment ? await require('../models/Task').findById(comment.taskId) : null;
  await commentService.deleteComment(req.params.id, req.user._id);
  
  if (task) {
    getIo().to(task.boardId.toString()).emit('comment:deleted', { commentId: req.params.id, taskId: task._id });
  }
  res.status(200).json(new ApiResponse(200, {}, 'Comment deleted successfully'));
});

module.exports = {
  getComments,
  addComment,
  deleteComment
};
