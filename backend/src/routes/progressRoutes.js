const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProgress, saveQuizResult } = require('../controllers/progressController');

router.get('/:matiereId', auth, getProgress);
router.post('/quiz-result', auth, saveQuizResult);

module.exports = router;
