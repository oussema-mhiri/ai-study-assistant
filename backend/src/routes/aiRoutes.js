const express = require('express');
const { analyzeDocument } = require('../controllers/aiController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/analyze', auth, analyzeDocument);

module.exports = router;