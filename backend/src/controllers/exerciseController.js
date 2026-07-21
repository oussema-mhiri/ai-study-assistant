const Document = require('../models/Document');
const ExerciseResult = require('../models/ExerciseResult');
const { extractTextFromFile } = require('../services/extractService');
const { generateExercisesFromText, checkExerciseAnswers } = require('../services/geminiService');

exports.generateExercises = async (req, res) => {
  try {
    const { documentId, numExercises = 3, difficulty = 'Moyen' } = req.body;
    if (!documentId || !Number.isInteger(Number(documentId)) || Number(documentId) <= 0) {
      return res.status(400).json({ message: 'documentId requis et doit être un entier positif' });
    }

    const validDifficulties = ['Facile', 'Moyen', 'Difficile'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({ message: 'difficulty doit être Facile, Moyen ou Difficile' });
    }

    const exCount = parseInt(numExercises);
    if (isNaN(exCount) || exCount < 1 || exCount > 20) {
      return res.status(400).json({ message: 'numExercises doit être entre 1 et 20' });
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
    const { exercises, userAnswers, matiereId, difficulty, responseTimes } = req.body;
    if (!exercises || !userAnswers) {
      return res.status(400).json({ message: 'exercises et userAnswers requis' });
    }
    if (exercises.length !== userAnswers.length) {
      return res.status(400).json({ message: 'Le nombre d\'exercices et de réponses ne correspond pas' });
    }

    const results = await checkExerciseAnswers(exercises, userAnswers);

    // Persister les résultats si matiereId est fourni
    if (matiereId) {
      try {
        const resultsToSave = exercises.map((ex, i) => ({
          type: ex.type || 'ouverte',
          question: ex.question,
          userAnswer: userAnswers[i],
          correctAnswer: ex.correctAnswer,
          isCorrect: results[i]?.isCorrect || false,
          responseTimeMs: responseTimes?.[i] || null,
        }));
        await ExerciseResult.saveMultiple(req.userId, matiereId, resultsToSave, difficulty);
      } catch (saveErr) {
        console.error('Erreur sauvegarde résultats exercices:', saveErr);
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Erreur correction exercices:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de la correction des exercices' });
  }
};