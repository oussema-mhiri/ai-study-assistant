const pool = require('../config/db');

const ExerciseResult = {
  async save(userId, matiereId, exerciseType, question, userAnswer, correctAnswer, isCorrect, difficulty, responseTimeMs) {
    const res = await pool.query(
      `INSERT INTO exercise_results (user_id, matiere_id, exercise_type, question, user_answer, correct_answer, is_correct, difficulty, response_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [userId, matiereId, exerciseType, question, userAnswer, correctAnswer, isCorrect, difficulty, responseTimeMs || null]
    );
    return res.rows[0];
  },

  async saveMultiple(userId, matiereId, results, difficulty) {
    const saved = [];
    for (const r of results) {
      const row = await this.save(
        userId, matiereId, r.type, r.question,
        r.userAnswer, r.correctAnswer, r.isCorrect, difficulty, r.responseTimeMs
      );
      saved.push(row);
    }
    return saved;
  },

  async getRecentResults(userId, matiereId, limit = 20) {
    const res = await pool.query(
      `SELECT * FROM exercise_results
       WHERE user_id = $1 AND matiere_id = $2
       ORDER BY answered_at DESC
       LIMIT $3`,
      [userId, matiereId, limit]
    );
    return res.rows;
  },

  async getAdaptiveDifficulty(userId, matiereId) {
    const quizRes = await pool.query(
      `SELECT qr.est_correct, q.niveau, qr.response_time_ms
       FROM quiz_results qr
       JOIN questions qu ON qu.id = qr.question_id
       JOIN quizs q ON q.id = qr.quiz_id
       WHERE qr.user_id = $1 AND q.matiere_id = $2
       ORDER BY qr.answered_at DESC
       LIMIT 30`,
      [userId, matiereId]
    );

    const exerciseRes = await pool.query(
      `SELECT is_correct, difficulty, response_time_ms
       FROM exercise_results
       WHERE user_id = $1 AND matiere_id = $2
       ORDER BY answered_at DESC
       LIMIT 30`,
      [userId, matiereId]
    );

    const quizResults = quizRes.rows;
    const exerciseResults = exerciseRes.rows;

    const allResults = [
      ...quizResults.map(r => ({ is_correct: r.est_correct, source: 'quiz', response_time_ms: r.response_time_ms })),
      ...exerciseResults.map(r => ({ is_correct: r.is_correct, source: 'exercise', response_time_ms: r.response_time_ms }))
    ];

    if (allResults.length === 0) {
      return { difficulty: 'Facile', score: 0, confidence: 'low', totalResults: 0, avgResponseTime: 0, weakThemes: [] };
    }

    // 1. Score basé sur la réussite (50%)
    let quizRate = 0, exerciseRate = 0;
    if (quizResults.length > 0) quizRate = quizResults.filter(r => r.est_correct).length / quizResults.length;
    if (exerciseResults.length > 0) exerciseRate = exerciseResults.filter(r => r.is_correct).length / exerciseResults.length;

    let successScore;
    if (quizResults.length > 0 && exerciseResults.length > 0) {
      successScore = (quizRate * 0.6 + exerciseRate * 0.4) * 100;
    } else if (quizResults.length > 0) {
      successScore = quizRate * 100;
    } else {
      successScore = exerciseRate * 100;
    }

    // 2. Score basé sur le temps de réponse (20%)
    const times = allResults.filter(r => r.response_time_ms && r.response_time_ms > 0).map(r => r.response_time_ms);
    let speedScore = 50;
    if (times.length > 0) {
      const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
      if (avgMs < 8000) speedScore = 100;
      else if (avgMs < 15000) speedScore = 80;
      else if (avgMs < 25000) speedScore = 60;
      else if (avgMs < 40000) speedScore = 40;
      else speedScore = 20;
    }

    // 3. Score basé sur la régularité (30%)
    const quizChunks = [];
    for (let i = 0; i < allResults.length; i += 5) {
      const chunk = allResults.slice(i, i + 5);
      const chunkRate = chunk.filter(r => r.is_correct).length / chunk.length;
      quizChunks.push(chunkRate);
    }
    let consistencyScore = 50;
    if (quizChunks.length > 1) {
      const mean = quizChunks.reduce((a, b) => a + b, 0) / quizChunks.length;
      const variance = quizChunks.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / quizChunks.length;
      const stddev = Math.sqrt(variance);
      consistencyScore = Math.max(0, Math.min(100, 100 - stddev * 200));
    } else {
      consistencyScore = quizChunks[0] * 100;
    }

    // Score final pondéré
    const score = Math.round(successScore * 0.5 + speedScore * 0.2 + consistencyScore * 0.3);

    // Déterminer la difficulté
    let difficulty;
    if (score >= 75) difficulty = 'Difficile';
    else if (score >= 45) difficulty = 'Moyen';
    else difficulty = 'Facile';

    // Confiance
    let confidence = 'low';
    if (allResults.length >= 15) confidence = 'high';
    else if (allResults.length >= 8) confidence = 'medium';

    // Temps moyen
    const avgResponseTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

    return { difficulty, score, confidence, totalResults: allResults.length, avgResponseTime };
  },

  async getHistory(userId, matiereId) {
    const res = await pool.query(
      `SELECT
         exercise_type,
         is_correct,
         difficulty,
         answered_at::date as date,
         COUNT(*) as count,
         SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count
       FROM exercise_results
       WHERE user_id = $1 AND matiere_id = $2
       GROUP BY exercise_type, is_correct, difficulty, answered_at::date
       ORDER BY date DESC
       LIMIT 30`,
      [userId, matiereId]
    );
    return res.rows;
  }
};

module.exports = ExerciseResult;
