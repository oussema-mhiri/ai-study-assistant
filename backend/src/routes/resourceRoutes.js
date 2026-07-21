const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getRecommendations } = require('../controllers/resourceController');

router.get('/recommendations/:matiereId', auth, getRecommendations);

module.exports = router;
