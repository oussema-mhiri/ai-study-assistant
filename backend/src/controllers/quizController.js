const Document = require('../models/Document');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const { generateQuizFromText, generateTrueFalseFromText } = require('../services/geminiService');
const { extractTextFromFile } = require('../services/extractService');

exports.generateQuiz = async (req, res) => {
  try {
    const { documentId, numQuestions = 5, difficulty = 'Moyen' } = req.body;
    if (!documentId || !Number.isInteger(Number(documentId)) || Number(documentId) <= 0) {
      return res.status(400).json({ message: 'documentId requis et doit être un entier positif' });
    }

    const validDifficulties = ['Facile', 'Moyen', 'Difficile'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({ message: 'difficulty doit être Facile, Moyen ou Difficile' });
    }

    const qCount = parseInt(numQuestions);
    if (isNaN(qCount) || qCount < 1 || qCount > 50) {
      return res.status(400).json({ message: 'numQuestions doit être entre 1 et 50' });
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

    // 3. Générer les questions via Gemini
    const questionsData = await generateQuizFromText(text, numQuestions, difficulty);

    // 4. Créer le quiz en base
    const quiz = await Quiz.create(
      `Quiz - ${doc.nom_fichier}`,
      difficulty,
      doc.matiere_id,
      req.userId
    );

    // 5. Ajouter les questions
    const questionsToInsert = questionsData.map(q => ({
      contenu: q.question,
      type: q.type || 'qcm',
      bonneReponse: q.correctAnswer,
      options: q.options,
    }));

    await Question.createMultiple(questionsToInsert, quiz.id);

    // 6. Récupérer le quiz complet avec ses questions
    const fullQuiz = await Quiz.findByIdWithQuestions(quiz.id, req.userId);

    res.status(201).json(fullQuiz);
  } catch (error) {
    console.error('Erreur génération quiz:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de la génération du quiz' });
  }
};

exports.generateTrueFalse = async (req, res) => {
  try {
    const { documentId, numQuestions = 5, difficulty = 'Moyen' } = req.body;
    if (!documentId || !Number.isInteger(Number(documentId)) || Number(documentId) <= 0) {
      return res.status(400).json({ message: 'documentId requis et doit être un entier positif' });
    }

    const validDifficulties = ['Facile', 'Moyen', 'Difficile'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({ message: 'difficulty doit être Facile, Moyen ou Difficile' });
    }

    const qCount = parseInt(numQuestions);
    if (isNaN(qCount) || qCount < 1 || qCount > 50) {
      return res.status(400).json({ message: 'numQuestions doit être entre 1 et 50' });
    }

    const doc = await Document.findById(documentId, req.userId);
    if (!doc) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    const text = await extractTextFromFile(doc.url, doc.type);
    if (!text) {
      return res.status(400).json({ message: 'Impossible d\'extraire le texte du document' });
    }

    const questionsData = await generateTrueFalseFromText(text, numQuestions, difficulty);

    const quiz = await Quiz.create(
      `Vrai/Faux - ${doc.nom_fichier}`,
      difficulty,
      doc.matiere_id,
      req.userId
    );

    const questionsToInsert = questionsData.map(q => ({
      contenu: q.question,
      type: 'true_false',
      bonneReponse: q.correctAnswer,
      options: q.options,
    }));

    await Question.createMultiple(questionsToInsert, quiz.id);

    const fullQuiz = await Quiz.findByIdWithQuestions(quiz.id, req.userId);

    res.status(201).json(fullQuiz);
  } catch (error) {
    console.error('Erreur génération vrai/faux:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de la génération vrai/faux' });
  }
};