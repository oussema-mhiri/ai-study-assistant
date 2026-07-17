const express = require('express');
const { generateExercises, checkExercises } = require('../controllers/exerciseController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/generate', auth, generateExercises);
router.post('/check', auth, checkExercises);

module.exports = router;
