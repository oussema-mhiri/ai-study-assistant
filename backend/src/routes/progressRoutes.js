const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProgress, saveQuizResult, getAdaptiveDifficulty } = require('../controllers/progressController');

router.get('/:matiereId', auth, getProgress);
router.get('/adaptive-difficulty/:matiereId', auth, getAdaptiveDifficulty);
router.post('/quiz-result', auth, saveQuizResult);

module.exports = router;
