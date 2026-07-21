const express = require('express');
const { generateQuiz, generateTrueFalse } = require('../controllers/quizController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/generate', auth, generateQuiz);
router.post('/generate-true-false', auth, generateTrueFalse);

module.exports = router;