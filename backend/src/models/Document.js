const pool = require('../config/db');

const Document = {
  // Créer un document
  create: async (nomFichier, type, url, matiereId, userId) => {
    const query = `
      INSERT INTO documents (nom_fichier, type, url, matiere_id, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nom_fichier, type, url, matiere_id, user_id, uploaded_at
    `;
    const result = await pool.query(query, [nomFichier, type, url, matiereId, userId]);
    return result.rows[0];
  },

  // Récupérer tous les documents d'une matière
  findAllBySubject: async (matiereId, userId) => {
    const query = `
      SELECT d.*,
             EXISTS (SELECT 1 FROM resumes r WHERE r.document_id = d.id) AS has_resume
      FROM documents d
      WHERE d.matiere_id = $1 AND d.user_id = $2
      ORDER BY d.uploaded_at DESC
    `;
    const result = await pool.query(query, [matiereId, userId]);
    return result.rows;
  },

  // Trouver un document par ID
  findById: async (id, userId) => {
    const query = `
      SELECT * FROM documents
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  // Supprimer un document
  delete: async (id, userId) => {
    const query = `
      DELETE FROM documents
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  // Récupérer les documents d'un utilisateur (pour dashboard)
  findAllByUser: async (userId) => {
    const query = `
      SELECT d.*, m.nom AS matiere_nom
      FROM documents d
      JOIN matieres m ON m.id = d.matiere_id
      WHERE d.user_id = $1
      ORDER BY d.uploaded_at DESC
      LIMIT 10
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  },
};

module.exports = Document;