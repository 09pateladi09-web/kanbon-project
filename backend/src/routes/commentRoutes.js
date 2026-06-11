const express = require('express');
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { createCommentSchema } = require('../validators/commentValidator');

const router = express.Router();

router.use(protect);

router.get('/task/:taskId', commentController.getComments);
router.post('/task/:taskId', validate(createCommentSchema), commentController.addComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
