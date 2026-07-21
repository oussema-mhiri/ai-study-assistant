const pool = require('../config/db');

const getOverview = async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Compteurs globaux
    const countsRes = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM documents WHERE user_id = $1) AS total_documents,
        (SELECT COUNT(*) FROM matieres WHERE user_id = $1) AS total_matieres,
        (SELECT COUNT(*) FROM quizs WHERE user_id = $1) AS total_quizs,
        (SELECT COUNT(*) FROM flashcards WHERE user_id = $1) AS total_flashcards,
        (SELECT COALESCE(SUM(duree_minutes), 0) FROM sessions_planning WHERE user_id = $1 AND date_session = CURRENT_DATE) AS revision_time_today
    `, [userId]);
    const counts = countsRes.rows[0];

    // 2. Taux de réussite global quiz
    const quizGlobalRes = await pool.query(`
      SELECT
        COUNT(qr.id) AS total_reponses,
        SUM(CASE WHEN qr.est_correct THEN 1 ELSE 0 END) AS correctes,
        ROUND(100.0 * SUM(CASE WHEN qr.est_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(qr.id), 0), 1) AS taux_reussite
      FROM quiz_results qr
      JOIN quizs q ON q.id = qr.quiz_id
      WHERE qr.user_id = $1
    `, [userId]);
    const quizGlobal = quizGlobalRes.rows[0];

    // 3. Matières avec stats par matière
    const matieresRes = await pool.query(`
      SELECT
        m.id, m.nom, m.couleur, m.date_examen,
        (SELECT COUNT(*) FROM documents d WHERE d.matiere_id = m.id AND d.user_id = $1) AS documents_count,
        (SELECT COUNT(*) FROM quizs q WHERE q.matiere_id = m.id AND q.user_id = $1) AS quiz_count,
        (SELECT COUNT(*) FROM flashcards f WHERE f.matiere_id = m.id AND f.user_id = $1) AS flashcards_count,
        (
          SELECT ROUND(100.0 * SUM(CASE WHEN qr2.est_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(qr2.id), 0), 1)
          FROM quiz_results qr2
          JOIN quizs q2 ON q2.id = qr2.quiz_id
          WHERE q2.matiere_id = m.id AND qr2.user_id = $1
        ) AS quiz_success
      FROM matieres m
      WHERE m.user_id = $1
      ORDER BY m.created_at DESC
    `, [userId]);
    const matieres = matieresRes.rows;

    // 4. Sessions à venir (7 prochains jours)
    const sessionsRes = await pool.query(`
      SELECT sp.id, sp.titre, sp.date_session, sp.heure_debut, sp.duree_minutes, sp.type,
             m.nom AS matiere_nom, m.couleur AS matiere_couleur
      FROM sessions_planning sp
      JOIN matieres m ON m.id = sp.matiere_id
      WHERE sp.user_id = $1
        AND sp.date_session BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        AND sp.statut = 'planifie'
      ORDER BY sp.date_session ASC, sp.heure_debut ASC
      LIMIT 8
    `, [userId]);
    const upcomingSessions = sessionsRes.rows;

    // 5. Examens à venir
    const examsRes = await pool.query(`
      SELECT id, nom, date_examen, couleur,
        (date_examen::date - CURRENT_DATE::date) AS jours_restants
      FROM matieres
      WHERE user_id = $1
        AND date_examen IS NOT NULL
        AND date_examen >= CURRENT_DATE
      ORDER BY date_examen ASC
      LIMIT 5
    `, [userId]);
    const upcomingExams = examsRes.rows;

    // 6. 5 derniers quiz avec taux de réussite
    const recentQuizzesRes = await pool.query(`
      SELECT q.id, q.titre, q.niveau, q.created_at,
             m.nom AS matiere_nom, m.couleur AS matiere_couleur,
             (SELECT COUNT(*) FROM questions qu WHERE qu.quiz_id = q.id) AS total_questions,
             (
               SELECT ROUND(100.0 * SUM(CASE WHEN qr.est_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(qr.id), 0), 1)
               FROM quiz_results qr WHERE qr.quiz_id = q.id
             ) AS taux_reussite
      FROM quizs q
      JOIN matieres m ON m.id = q.matiere_id
      WHERE q.user_id = $1
      ORDER BY q.created_at DESC
      LIMIT 5
    `, [userId]);
    const recentQuizzes = recentQuizzesRes.rows;

    // 7. Historique scores quiz (14 derniers jours pour le graphique)
    const scoreHistoryRes = await pool.query(`
      SELECT
        qr.answered_at::date AS date,
        ROUND(100.0 * SUM(CASE WHEN qr.est_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(qr.id), 0), 1) AS taux_reussite,
        COUNT(qr.id) AS nb_reponses
      FROM quiz_results qr
      JOIN quizs q ON q.id = qr.quiz_id
      WHERE qr.user_id = $1
        AND qr.answered_at >= CURRENT_DATE - INTERVAL '14 days'
      GROUP BY qr.answered_at::date
      ORDER BY date ASC
    `, [userId]);
    const scoreHistory = scoreHistoryRes.rows;

    // 8. Notifications non lues
    const unreadRes = await pool.query(`
      SELECT COUNT(*) AS unread FROM notifications WHERE user_id = $1 AND lue = false
    `, [userId]);

    res.json({
      totalDocuments: parseInt(counts.total_documents),
      totalMatieres: parseInt(counts.total_matieres),
      totalQuizs: parseInt(counts.total_quizs),
      totalFlashcards: parseInt(counts.total_flashcards),
      revisionTimeToday: parseInt(counts.revision_time_today),
      overallQuizSuccess: parseFloat(quizGlobal.taux_reussite) || 0,
      totalQuizAnswers: parseInt(quizGlobal.total_reponses) || 0,
      matieres,
      upcomingSessions,
      upcomingExams,
      recentQuizzes,
      scoreHistory,
      unreadNotifications: parseInt(unreadRes.rows[0].unread),
    });
  } catch (err) {
    console.error('Erreur getDashboardOverview:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getOverview };
