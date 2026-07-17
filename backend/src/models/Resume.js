const pool = require('../config/db');

const Resume = {
  create: async (type, contenu, documentId) => {
    const query = `
      INSERT INTO resumes (type, contenu, document_id)
      VALUES ($1, $2, $3)
      RETURNING id, type, contenu, document_id, created_at
    `;
    const result = await pool.query(query, [type, contenu, documentId]);
    return result.rows[0];
  },

  findByDocumentId: async (documentId) => {
    const query = `
      SELECT * FROM resumes
      WHERE document_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [documentId]);
    return result.rows;
  },

  findByDocumentIdAndType: async (documentId, type) => {
    const query = `
      SELECT * FROM resumes
      WHERE document_id = $1 AND type = $2
    `;
    const result = await pool.query(query, [documentId, type]);
    return result.rows[0];
  },

  deleteByDocumentId: async (documentId) => {
    const query = `
      DELETE FROM resumes
      WHERE document_id = $1
      RETURNING id
    `;
    const result = await pool.query(query, [documentId]);
    return result.rows;
  },

  delete: async (id) => {
    const query = `
      DELETE FROM resumes
      WHERE id = $1
      RETURNING id
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },
};

module.exports = Resume;