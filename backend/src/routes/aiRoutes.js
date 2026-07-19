const express = require('express');
const { analyzeDocument, getAnalysis } = require('../controllers/aiController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/analyze', auth, analyzeDocument);
router.get('/analysis/:documentId', auth, getAnalysis);

module.exports = router;