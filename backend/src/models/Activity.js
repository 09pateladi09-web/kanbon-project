const mongoose = require('mongoose');
const { ACTIVITY_ACTIONS } = require('../utils/constants');

const activitySchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      index: true,
      required: true
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    action: {
      type: String,
      enum: ACTIVITY_ACTIONS,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;
