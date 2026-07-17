const pool = require('../config/db');

const Question = {
  create: async (contenu, type, bonneReponse, options, quizId) => {
    const query = `
      INSERT INTO questions (contenu, type, bonne_reponse, options, quiz_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, contenu, type, bonne_reponse, options, quiz_id, created_at
    `;
    const result = await pool.query(query, [contenu, type, bonneReponse, JSON.stringify(options), quizId]);
    return result.rows[0];
  },

  createMultiple: async (questions, quizId) => {
    if (!questions || questions.length === 0) return [];

    const values = questions.map((q, index) => {
      const optionsJson = q.options ? JSON.stringify(q.options) : null;
      return `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`;
    }).join(', ');

    const flatParams = questions.flatMap(q => [
      q.contenu,
      q.type,
      q.bonneReponse,
      q.options ? JSON.stringify(q.options) : null,
      quizId
    ]);

    const query = `
      INSERT INTO questions (contenu, type, bonne_reponse, options, quiz_id)
      VALUES ${values}
      RETURNING id, contenu, type, bonne_reponse, options, quiz_id, created_at
    `;
    const result = await pool.query(query, flatParams);
    return result.rows;
  },

  findByQuizId: async (quizId) => {
    const query = `
      SELECT * FROM questions
      WHERE quiz_id = $1
      ORDER BY id ASC
    `;
    const result = await pool.query(query, [quizId]);
    return result.rows;
  },

  delete: async (id) => {
    const query = `
      DELETE FROM questions
      WHERE id = $1
      RETURNING id
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  deleteByQuizId: async (quizId) => {
    const query = `
      DELETE FROM questions
      WHERE quiz_id = $1
      RETURNING id
    `;
    const result = await pool.query(query, [quizId]);
    return result.rows;
  },

  update: async (id, { contenu, type, bonneReponse, options }) => {
    const query = `
      UPDATE questions
      SET contenu = COALESCE($1, contenu),
          type = COALESCE($2, type),
          bonne_reponse = COALESCE($3, bonne_reponse),
          options = COALESCE($4, options)
      WHERE id = $5
      RETURNING id, contenu, type, bonne_reponse, options, quiz_id, created_at
    `;
    const result = await pool.query(query, [contenu, type, bonneReponse, options ? JSON.stringify(options) : null, id]);
    return result.rows[0];
  },
};

module.exports = Question;