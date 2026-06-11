const express = require('express');
const activityController = require('../controllers/activityController');
const { protect } = require('../middlewares/authMiddleware');
const { requireBoardMember } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);

router.get('/board/:boardId', requireBoardMember, activityController.getBoardActivity);

module.exports = router;
