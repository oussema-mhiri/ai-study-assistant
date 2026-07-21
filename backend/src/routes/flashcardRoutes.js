const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  generateFlashcards,
  getFlashcards,
  getDueCards,
  reviewCard,
  getStats,
  deleteCard,
} = require('../controllers/flashcardController');

router.post('/generate', auth, generateFlashcards);
router.get('/subject/:matiereId', auth, getFlashcards);
router.get('/subject/:matiereId/due', auth, getDueCards);
router.get('/subject/:matiereId/stats', auth, getStats);
router.post('/:id/review', auth, reviewCard);
router.delete('/:id', auth, deleteCard);

module.exports = router;
