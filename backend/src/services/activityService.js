const Activity = require('../models/Activity');

const logActivity = async (boardId, taskId, action, performedBy, metadata = {}) => {
  try {
    await Activity.create({
      boardId,
      taskId,
      action,
      performedBy,
      metadata
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

const getBoardActivity = async (boardId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const activities = await Activity.find({ boardId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('performedBy', 'name avatar')
    .populate('taskId', 'title');

  const total = await Activity.countDocuments({ boardId });

  return {
    activities,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  logActivity,
  getBoardActivity
};
