const pool = require('../config/db');

const Conversation = {
  create: async (userId, matiereId, titre, documentId = null) => {
    const query = `
      INSERT INTO conversations (user_id, matiere_id, titre, document_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, matiere_id, document_id, titre, created_at, updated_at
    `;
    const result = await pool.query(query, [userId, matiereId, titre, documentId]);
    return result.rows[0];
  },

  findByUserAndSubject: async (userId, matiereId) => {
    const query = `
      SELECT c.*, d.nom_fichier AS document_nom
      FROM conversations c
      LEFT JOIN documents d ON d.id = c.document_id
      WHERE c.user_id = $1 AND c.matiere_id = $2
      ORDER BY c.updated_at DESC
    `;
    const result = await pool.query(query, [userId, matiereId]);
    return result.rows;
  },

  findById: async (id, userId) => {
    const query = `
      SELECT c.*, d.nom_fichier AS document_nom
      FROM conversations c
      LEFT JOIN documents d ON d.id = c.document_id
      WHERE c.id = $1 AND c.user_id = $2
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  delete: async (id, userId) => {
    const query = `
      DELETE FROM conversations
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },


};

module.exports = Conversation;
