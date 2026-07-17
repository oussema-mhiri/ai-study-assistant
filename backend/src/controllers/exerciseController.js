const Document = require('../models/Document');
const { extractTextFromFile } = require('../services/extractService');
const { generateExercisesFromText, checkExerciseAnswers } = require('../services/geminiService');

exports.generateExercises = async (req, res) => {
  try {
    const { documentId, numExercises = 3, difficulty = 'Moyen' } = req.body;
    if (!documentId) {
      return res.status(400).json({ message: 'documentId requis' });
    }

    // 1. Récupérer le document
    const doc = await Document.findById(documentId, req.userId);
    if (!doc) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    // 2. Extraire le texte
    const text = await extractTextFromFile(doc.url, doc.type);
    if (!text) {
      return res.status(400).json({ message: 'Impossible d\'extraire le texte du document' });
    }

    // 3. Générer les exercices via Gemini
    const exercises = await generateExercisesFromText(text, numExercises, difficulty);

    res.status(201).json({ exercises });
  } catch (error) {
    console.error('Erreur génération exercices:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de la génération des exercices' });
  }
};

exports.checkExercises = async (req, res) => {
  try {
    const { exercises, userAnswers } = req.body;
    if (!exercises || !userAnswers) {
      return res.status(400).json({ message: 'exercises et userAnswers requis' });
    }
    if (exercises.length !== userAnswers.length) {
      return res.status(400).json({ message: 'Le nombre d\'exercices et de réponses ne correspond pas' });
    }

    const results = await checkExerciseAnswers(exercises, userAnswers);
    res.json({ results });
  } catch (error) {
    console.error('Erreur correction exercices:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de la correction des exercices' });
  }
};