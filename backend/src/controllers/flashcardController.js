const Document = require('../models/Document');
const Flashcard = require('../models/Flashcard');
const FlashcardReview = require('../models/FlashcardReview');
const { extractTextFromFile } = require('../services/extractService');
const { generateFlashcardsFromText } = require('../services/geminiService');
const { getInitialReview } = require('../services/spacedRepetition');

// POST /flashcards/generate — Générer des flashcards à partir d'un document
exports.generateFlashcards = async (req, res) => {
  try {
    const { documentId, numCards = 10 } = req.body;
    if (!documentId || !Number.isInteger(Number(documentId)) || Number(documentId) <= 0) {
      return res.status(400).json({ message: 'documentId requis et doit être un entier positif' });
    }

    const count = parseInt(numCards);
    if (isNaN(count) || count < 1 || count > 50) {
      return res.status(400).json({ message: 'numCards doit être entre 1 et 50' });
    }

    const doc = await Document.findById(documentId, req.userId);
    if (!doc) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    const text = await extractTextFromFile(doc.url, doc.type);
    if (!text) {
      return res.status(400).json({ message: 'Impossible d\'extraire le texte du document' });
    }

    const cardsData = await generateFlashcardsFromText(text, count);
    const cards = await Flashcard.createMultiple(req.userId, doc.matiere_id, documentId, cardsData);

    res.status(201).json({ cards, count: cards.length });
  } catch (error) {
    console.error('Erreur génération flashcards:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de la génération des flashcards' });
  }
};

// GET /flashcards/subject/:matiereId — Lister les flashcards d'une matière
exports.getFlashcards = async (req, res) => {
  try {
    const { matiereId } = req.params;
    const cards = await Flashcard.findBySubject(req.userId, matiereId);
    res.json(cards);
  } catch (error) {
    console.error('Erreur récupération flashcards:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /flashcards/subject/:matiereId/due — Cartes à réviser aujourd'hui
exports.getDueCards = async (req, res) => {
  try {
    const { matiereId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const cards = await Flashcard.findDueCards(req.userId, matiereId, limit);
    res.json(cards);
  } catch (error) {
    console.error('Erreur récupération cartes dues:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// POST /flashcards/:id/review — Enregistrer la réponse d'une flashcard
exports.reviewCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { quality } = req.body;

    if (quality === undefined || quality < 0 || quality > 5) {
      return res.status(400).json({ message: 'quality requis (0-5)' });
    }

    const card = await Flashcard.findById(req.userId, id);
    if (!card) {
      return res.status(404).json({ message: 'Flashcard non trouvée' });
    }

    // Récupérer l'état actuel de la carte
    const currentReview = await FlashcardReview.findByCard(req.userId, id) || {
      ease_factor: 2.50,
      interval_days: 0,
      repetitions: 0,
    };

    // Calculer la prochaine révision avec SM-2
    const reviewData = getInitialReview(quality);
    // Utiliser l'état actuel au lieu de l'état initial
    const { calculateNextReview } = require('../services/spacedRepetition');
    const nextReview = calculateNextReview({
      ease_factor: parseFloat(currentReview.ease_factor) || 2.50,
      interval_days: parseInt(currentReview.interval_days) || 0,
      repetitions: parseInt(currentReview.repetitions) || 0,
    }, quality);

    // Sauvegarder
    const result = await FlashcardReview.upsert(req.userId, id, quality, nextReview);

    res.json({
      review: result,
      nextReview: {
        ease_factor: nextReview.ease_factor,
        interval_days: nextReview.interval_days,
        repetitions: nextReview.repetitions,
        next_review: nextReview.next_review,
      }
    });
  } catch (error) {
    console.error('Erreur review flashcard:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /flashcards/subject/:matiereId/stats — Statistiques
exports.getStats = async (req, res) => {
  try {
    const { matiereId } = req.params;
    const stats = await Flashcard.getStats(req.userId, matiereId);
    res.json(stats);
  } catch (error) {
    console.error('Erreur stats flashcards:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE /flashcards/:id — Supprimer une carte
exports.deleteCard = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Flashcard.delete(req.userId, id);
    if (!deleted) {
      return res.status(404).json({ message: 'Flashcard non trouvée' });
    }
    res.json({ message: 'Flashcard supprimée', id: deleted.id });
  } catch (error) {
    console.error('Erreur suppression flashcard:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
