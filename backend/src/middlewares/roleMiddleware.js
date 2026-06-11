const ApiError = require('../utils/ApiError');
const Board = require('../models/Board');
const asyncHandler = require('../utils/asyncHandler');
const { ERROR_CODES } = require('../utils/constants');

const requireBoardMember = asyncHandler(async (req, res, next) => {
  const boardId = req.params.boardId || req.body.boardId || req.query.boardId;

  if (!boardId) {
    return next(new ApiError(400, 'Board ID is required'));
  }

  const board = await Board.findById(boardId);

  if (!board) {
    return next(new ApiError(404, 'Board not found', [], true, ERROR_CODES.NOT_FOUND));
  }

  const isMember = board.members.includes(req.user._id) || board.createdBy.toString() === req.user._id.toString();

  if (!isMember) {
    return next(new ApiError(403, 'You are not a member of this board', [], true, ERROR_CODES.UNAUTHORIZED));
  }

  // Attach board to request to save future DB hits
  req.board = board;
  next();
});

const requireBoardOwner = asyncHandler(async (req, res, next) => {
  const boardId = req.params.boardId || req.body.boardId || req.query.boardId;

  if (!boardId) {
    return next(new ApiError(400, 'Board ID is required'));
  }

  const board = await Board.findById(boardId);

  if (!board) {
    return next(new ApiError(404, 'Board not found', [], true, ERROR_CODES.NOT_FOUND));
  }

  const isOwner = board.createdBy.toString() === req.user._id.toString();

  if (!isOwner) {
    return next(new ApiError(403, 'You must be the board owner to perform this action', [], true, ERROR_CODES.UNAUTHORIZED));
  }

  req.board = board;
  next();
});

module.exports = {
  requireBoardMember,
  requireBoardOwner
};
