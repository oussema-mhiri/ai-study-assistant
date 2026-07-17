const express = require('express');
const { generateQuiz } = require('../controllers/quizController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/generate', auth, generateQuiz);

module.exports = router;