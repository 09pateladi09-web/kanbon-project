const express = require('express');
const taskController = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const { requireBoardMember } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validationMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { createTaskSchema, updateTaskSchema, bulkUpdatePositionsSchema } = require('../validators/taskValidator');

const router = express.Router();

router.use(protect);

// Board-scoped tasks (nested ideally, but defined here with boardId in body or query for simplicity or handled as separate routes)
router.get('/board/:boardId', requireBoardMember, taskController.getTasks);
router.post('/board/:boardId', requireBoardMember, validate(createTaskSchema), taskController.createTask);

// Task operations
router.patch('/bulk-positions', validate(bulkUpdatePositionsSchema), taskController.bulkUpdatePositions); // requireBoardMember checked in service/controller via task data if needed, or send boardId in body

router.patch('/:id', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:id/attachments', upload.single('file'), taskController.addAttachment);

module.exports = router;
