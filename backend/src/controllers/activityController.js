const activityService = require('../services/activityService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getBoardActivity = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await activityService.getBoardActivity(req.params.boardId, page, limit);
  res.status(200).json(new ApiResponse(200, result.activities, 'Activity fetched successfully', result.meta));
});

module.exports = {
  getBoardActivity
};
