const pool = require('../config/db');

const QuizResult = {
  // Enregistrer une réponse à une question
  save: async (userId, quizId, questionId, reponseDonnee, estCorrect) => {
    const query = `
      INSERT INTO quiz_results (user_id, quiz_id, question_id, reponse_donnee, est_correct)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, quizId, questionId, reponseDonnee, estCorrect]);
    return result.rows[0];
  },

  // Enregistrer plusieurs réponses en une fois
  saveMultiple: async (userId, quizId, answers) => {
    if (!answers || answers.length === 0) return [];
    const results = [];
    for (const ans of answers) {
      const res = await pool.query(
        `INSERT INTO quiz_results (user_id, quiz_id, question_id, reponse_donnee, est_correct, response_time_ms)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, quizId, ans.questionId, ans.reponseDonnee, ans.estCorrect, ans.responseTimeMs || null]
      );
      results.push(res.rows[0]);
    }
    return results;
  },

  // Stats globales pour une matière (taux de réussite, total réponses)
  getStatsBySubject: async (userId, matiereId) => {
    const query = `
      SELECT
        COUNT(qr.id) AS total_reponses,
        SUM(CASE WHEN qr.est_correct THEN 1 ELSE 0 END) AS correctes,
        ROUND(
          100.0 * SUM(CASE WHEN qr.est_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(qr.id), 0)
        , 1) AS taux_reussite
      FROM quiz_results qr
      JOIN quizs q ON q.id = qr.quiz_id
      WHERE qr.user_id = $1 AND q.matiere_id = $2
    `;
    const result = await pool.query(query, [userId, matiereId]);
    return result.rows[0];
  },

  // Stats pour un quiz spécifique
  getStatsByQuiz: async (userId, quizId) => {
    const query = `
      SELECT
        COUNT(qr.id) AS total_reponses,
        SUM(CASE WHEN qr.est_correct THEN 1 ELSE 0 END) AS correctes,
        ROUND(
          100.0 * SUM(CASE WHEN qr.est_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(qr.id), 0)
        , 1) AS taux_reussite
      FROM quiz_results qr
      WHERE qr.user_id = $1 AND qr.quiz_id = $2
    `;
    const result = await pool.query(query, [userId, quizId]);
    return result.rows[0];
  },
};

module.exports = QuizResult;
