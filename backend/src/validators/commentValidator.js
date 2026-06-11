const { z } = require('zod');

const createCommentSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1000, 'Message cannot exceed 1000 characters')
});

module.exports = {
  createCommentSchema
};
