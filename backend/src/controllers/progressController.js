const pool = require('../config/db');
const QuizResult = require('../models/QuizResult');
const ExerciseResult = require('../models/ExerciseResult');
const Matiere = require('../models/Matiere');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =========================================================
// GET /progress/:matiereId — Dashboard de progression complet
// =========================================================
const getProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const { matiereId } = req.params;

    // 1. Matière
    const matiere = await Matiere.findById(matiereId, userId);
    if (!matiere) return res.status(404).json({ error: 'Matière introuvable' });

    // 2. Documents
    const docsRes = await pool.query(
      'SELECT id, nom_fichier, type, uploaded_at FROM documents WHERE matiere_id = $1 AND user_id = $2 ORDER BY uploaded_at DESC',
      [matiereId, userId]
    );
    const documents = docsRes.rows;

    // 3. Quiz & questions
    const quizRes = await pool.query(
      `SELECT q.id, q.titre, q.niveau, q.created_at,
              COUNT(qu.id) AS total_questions
       FROM quizs q
       LEFT JOIN questions qu ON qu.quiz_id = q.id
       WHERE q.matiere_id = $1 AND q.user_id = $2
       GROUP BY q.id ORDER BY q.created_at DESC`,
      [matiereId, userId]
    );
    const quizs = quizRes.rows;
    const totalQuestions = quizs.reduce((s, q) => s + parseInt(q.total_questions || 0), 0);

    // 4. Résultats QCM
    const quizStats = await QuizResult.getStatsBySubject(userId, matiereId);

    // 5. Sessions chatbot
    const chatRes = await pool.query(
      `SELECT COUNT(c.id) AS total_conversations,
              COALESCE(SUM(msg_count.cnt), 0) AS total_messages
       FROM conversations c
       LEFT JOIN (
         SELECT conversation_id, COUNT(*) AS cnt FROM messages GROUP BY conversation_id
       ) msg_count ON msg_count.conversation_id = c.id
       WHERE c.matiere_id = $1 AND c.user_id = $2`,
      [matiereId, userId]
    );
    const chatStats = chatRes.rows[0];

    // 6. Exercices
    const exerciseRes = await pool.query(
      `SELECT COUNT(*) AS total_exercises,
              COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0) AS correctes,
              COALESCE(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END), 0) AS avg_score,
              COALESCE(AVG(response_time_ms), 0) AS avg_response_time
       FROM exercise_results
       WHERE user_id = $1 AND matiere_id = $2`,
      [userId, matiereId]
    );
    const exerciseStats = exerciseRes.rows[0];

    // 7. Flashcards
    const flashRes = await pool.query(
      `SELECT COUNT(DISTINCT f.id) AS total_flashcards,
              COUNT(fr.id) AS total_reviews,
              COALESCE(AVG(fr.quality), 0) AS avg_efficacite
       FROM flashcards f
       LEFT JOIN flashcard_reviews fr ON fr.flashcard_id = f.id
       WHERE f.user_id = $1 AND f.matiere_id = $2`,
      [userId, matiereId]
    );
    const flashStats = flashRes.rows[0];

    // 8. Calcul du score de maîtrise (pondéré — cahier des charges)
    const docsScore = Math.min(documents.length * 10, 30); // max 30 pts
    const quizScore = Math.min(parseFloat(quizStats?.taux_reussite || 0) * 0.5, 50); // max 50 pts
    const chatScore = Math.min(parseInt(chatStats.total_conversations) * 5, 20); // max 20 pts
    const scoreMaitrise = Math.round(Math.min(docsScore + quizScore + chatScore, 100));

    // 9. Score history (20 derniers quiz avec leur taux de réussite)
    const historyRes = await pool.query(
      `SELECT q.id AS quiz_id, q.created_at,
              ROUND(100.0 * SUM(CASE WHEN qr.est_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(qr.id), 0), 1) AS taux_reussite
       FROM quiz_results qr
       JOIN quizs q ON q.id = qr.quiz_id
       WHERE qr.user_id = $1 AND q.matiere_id = $2
       GROUP BY q.id, q.created_at
       ORDER BY q.created_at DESC LIMIT 20`,
      [userId, matiereId]
    );
    const scoreHistory = historyRes.rows.reverse().map(r => ({
      score: parseFloat(r.taux_reussite || 0),
      date: r.created_at,
    }));

    // 10. Estimation du temps restant
    const docsNonCouverts = Math.max(0, documents.length - quizs.length);
    const questionsRestantes = Math.max(0, totalQuestions - parseInt(quizStats?.total_reponses || 0));
    const tempsEstimeMin = (docsNonCouverts * 30) + (questionsRestantes * 2) + (100 - Math.min(scoreMaitrise, 100)) * 1.5;

    // 11. Analyse IA (Gemini)
    let iaAnalyse = null;
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
      const prompt = `
        Tu es un assistant pédagogique. Donne une analyse concise (3-4 phrases max) de la progression d'un étudiant pour la matière "${matiere.nom}" :
        - Documents importés : ${documents.length}
        - Quiz générés : ${quizs.length}, Total questions : ${totalQuestions}
        - Réponses données : ${quizStats?.total_reponses || 0}, Taux de réussite : ${quizStats?.taux_reussite || 0}%
        - Exercices résolus : ${exerciseStats.total_exercises}, Taux : ${parseInt(exerciseStats.total_exercises) > 0 ? Math.round(parseInt(exerciseStats.correctes) / parseInt(exerciseStats.total_exercises) * 100) : 0}%
        - Flashcards révisées : ${flashStats.total_reviews}, Efficacité moy. : ${Math.round(parseFloat(flashStats.avg_efficacite) * 100)}%
        - Sessions chatbot : ${chatStats.total_conversations}, Messages échangés : ${chatStats.total_messages}
        - Score de maîtrise estimé : ${scoreMaitrise}/100
        - Date d'examen : ${matiere.date_examen ? new Date(matiere.date_examen).toLocaleDateString('fr-FR') : 'Non définie'}
        Réponds en français, sois encourageant et propose 1 conseil concret.
      `;
      const result = await model.generateContent(prompt);
      iaAnalyse = result.response.text();
    } catch (e) {
      iaAnalyse = `Progression actuelle : ${scoreMaitrise}%. Continuez à pratiquer les exercices pour améliorer votre score !`;
    }

    res.json({
      matiere,
      documents: { total: documents.length, liste: documents },
      quizs: { total: quizs.length, total_questions: totalQuestions, liste: quizs },
      quiz_results: {
        total_reponses: parseInt(quizStats?.total_reponses || 0),
        correctes: parseInt(quizStats?.correctes || 0),
        taux_reussite: parseFloat(quizStats?.taux_reussite || 0),
      },
      exercises: {
        total: parseInt(exerciseStats.total_exercises),
        correctes: parseInt(exerciseStats.correctes),
        avg_score: parseFloat(exerciseStats.avg_score),
        avg_response_time: Math.round(parseFloat(exerciseStats.avg_response_time)),
      },
      flashcards: {
        total: parseInt(flashStats.total_flashcards),
        reviews: parseInt(flashStats.total_reviews),
        avg_efficacite: Math.round((parseFloat(flashStats.avg_efficacite) / 5) * 100),
      },
      chatbot: {
        conversations: parseInt(chatStats.total_conversations),
        messages: parseInt(chatStats.total_messages),
      },
      score_maitrise_pct: scoreMaitrise,
      score_history: scoreHistory,
      temps_estime_restant_minutes: Math.round(tempsEstimeMin),
      ia_analyse: iaAnalyse,
    });
  } catch (err) {
    console.error('Erreur getProgress:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// =========================================================
// POST /progress/quiz-result — Enregistrer les résultats d'un quiz
// =========================================================
const saveQuizResult = async (req, res) => {
  try {
    const userId = req.userId;
    const { quizId, answers } = req.body;
    // answers = [{ questionId, reponseDonnee, estCorrect }]
    if (!quizId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'quizId et answers requis' });
    }
    const results = await QuizResult.saveMultiple(userId, quizId, answers);
    const correct = results.filter(r => r.est_correct).length;
    const tauxReussite = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;
    res.json({ saved: results.length, correct, tauxReussite });
  } catch (err) {
    console.error('Erreur saveQuizResult:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// =========================================================
// GET /progress/adaptive-difficulty/:matiereId — Difficulté adaptative
// =========================================================
const getAdaptiveDifficulty = async (req, res) => {
  try {
    const userId = req.userId;
    const { matiereId } = req.params;

    const matiere = await Matiere.findById(matiereId, userId);
    if (!matiere) return res.status(404).json({ error: 'Matière introuvable' });

    const result = await ExerciseResult.getAdaptiveDifficulty(userId, matiereId);
    res.json(result);
  } catch (err) {
    console.error('Erreur getAdaptiveDifficulty:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getProgress, saveQuizResult, getAdaptiveDifficulty };
