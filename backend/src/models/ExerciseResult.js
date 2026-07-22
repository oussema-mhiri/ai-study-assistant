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



  async getAdaptiveDifficulty(userId, matiereId) {
    const quizRes = await pool.query(
      `SELECT qr.est_correct, q.niveau, qr.response_time_ms, qu.type AS question_type
       FROM quiz_results qr
       JOIN questions qu ON qu.id = qr.question_id
       JOIN quizs q ON q.id = qr.quiz_id
       WHERE qr.user_id = $1 AND q.matiere_id = $2
       ORDER BY qr.answered_at DESC
       LIMIT 30`,
      [userId, matiereId]
    );

    const exerciseRes = await pool.query(
      `SELECT is_correct, difficulty, response_time_ms, exercise_type
       FROM exercise_results
       WHERE user_id = $1 AND matiere_id = $2
       ORDER BY answered_at DESC
       LIMIT 30`,
      [userId, matiereId]
    );

    const quizResults = quizRes.rows;
    const exerciseResults = exerciseRes.rows;

    const allResults = [
      ...quizResults.map(r => ({ is_correct: r.est_correct, source: 'quiz', response_time_ms: r.response_time_ms, type: r.question_type || 'qcm' })),
      ...exerciseResults.map(r => ({ is_correct: r.is_correct, source: 'exercise', response_time_ms: r.response_time_ms, type: r.exercise_type || 'ouverte' }))
    ];

    if (allResults.length === 0) {
      return { difficulty: 'Facile', score: 0, confidence: 'low', totalResults: 0, avgResponseTime: 0, weakThemes: [], repeatedErrors: false };
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

    // 3. Score basé sur la régularité (20%)
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

    // 4. Détecter les erreurs répétées par type (10%)
    // Compter les erreurs consécutives par type de question/exercice
    const errorStreaks = {};
    let maxErrorStreak = 0;
    let currentStreak = 0;
    let currentStreakType = null;

    // Parcourir les résultats du plus récent au plus ancien
    const sortedResults = [...allResults].sort((a, b) => {
      if (a.source !== b.source) return 0;
      return 0;
    });

    for (const r of allResults) {
      if (!r.is_correct) {
        if (currentStreakType === r.type) {
          currentStreak++;
        } else {
          currentStreak = 1;
          currentStreakType = r.type;
        }
        errorStreaks[r.type] = Math.max(errorStreaks[r.type] || 0, currentStreak);
        maxErrorStreak = Math.max(maxErrorStreak, currentStreak);
      } else {
        currentStreak = 0;
        currentStreakType = null;
      }
    }

    // Score de pénalité pour erreurs répétées (0-100, plus bas = plus d'erreurs répétées)
    let repeatedErrorScore = 100;
    if (maxErrorStreak >= 5) repeatedErrorScore = 10;
    else if (maxErrorStreak >= 4) repeatedErrorScore = 25;
    else if (maxErrorStreak >= 3) repeatedErrorScore = 40;
    else if (maxErrorStreak >= 2) repeatedErrorScore = 70;

    // Thèmes faibles (types avec le plus d'erreurs)
    const weakThemes = Object.entries(errorStreaks)
      .filter(([_, streak]) => streak >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    // Score final pondéré (50% réussite + 20% vitesse + 20% régularité + 10% erreurs répétées)
    const score = Math.round(successScore * 0.5 + speedScore * 0.2 + consistencyScore * 0.2 + repeatedErrorScore * 0.1);

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

    return {
      difficulty,
      score,
      confidence,
      totalResults: allResults.length,
      avgResponseTime,
      weakThemes,
      repeatedErrors: maxErrorStreak >= 3,
      maxErrorStreak,
    };
  },


};

module.exports = ExerciseResult;
