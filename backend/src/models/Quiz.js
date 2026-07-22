const pool = require('../config/db');

const Quiz = {
  create: async (titre, niveau, matiereId, userId) => {
    const query = `
      INSERT INTO quizs (titre, niveau, matiere_id, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, titre, niveau, matiere_id, user_id, created_at
    `;
    const result = await pool.query(query, [titre, niveau, matiereId, userId]);
    return result.rows[0];
  },

  findBySubject: async (matiereId, userId) => {
    const query = `
      SELECT q.*, COUNT(qu.id) AS questions_count
      FROM quizs q
      LEFT JOIN questions qu ON qu.quiz_id = q.id
      WHERE q.matiere_id = $1 AND q.user_id = $2
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `;
    const result = await pool.query(query, [matiereId, userId]);
    return result.rows;
  },

  findByIdWithQuestions: async (id, userId) => {
    const query = `
      SELECT q.*, json_agg(qu.*) AS questions
      FROM quizs q
      LEFT JOIN questions qu ON qu.quiz_id = q.id
      WHERE q.id = $1 AND q.user_id = $2
      GROUP BY q.id
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  findById: async (id, userId) => {
    const query = `
      SELECT * FROM quizs
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  delete: async (id, userId) => {
    const query = `
      DELETE FROM quizs
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },


};

module.exports = Quiz;