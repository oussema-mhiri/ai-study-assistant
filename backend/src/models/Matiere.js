const pool = require('../config/db');

const Matiere = {
  // Créer une matière
  create: async (nom, description, userId, dateExamen = null, couleur = '#3B82F6') => {
    const query = `
      INSERT INTO matieres (nom, description, user_id, date_examen, couleur)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nom, description, user_id, date_examen, couleur, created_at, updated_at
    `;
    const result = await pool.query(query, [nom, description, userId, dateExamen, couleur]);
    return result.rows[0];
  },

  // Récupérer toutes les matières d'un utilisateur avec le nombre de documents
  findAllByUser: async (userId) => {
    const query = `
      SELECT m.*, COUNT(d.id) AS documents_count
      FROM matieres m
      LEFT JOIN documents d ON d.matiere_id = m.id
      WHERE m.user_id = $1
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  },

  // Trouver une matière par ID
  findById: async (id, userId) => {
    const query = `
      SELECT m.*, COUNT(d.id) AS documents_count
      FROM matieres m
      LEFT JOIN documents d ON d.matiere_id = m.id
      WHERE m.id = $1 AND m.user_id = $2
      GROUP BY m.id
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  // Mettre à jour une matière
  update: async (id, userId, { nom, description, dateExamen, couleur }) => {
    const query = `
      UPDATE matieres
      SET nom = COALESCE($1, nom),
          description = COALESCE($2, description),
          date_examen = COALESCE($3, date_examen),
          couleur = COALESCE($4, couleur),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND user_id = $6
      RETURNING id, nom, description, user_id, date_examen, couleur, created_at, updated_at
    `;
    const result = await pool.query(query, [nom, description, dateExamen, couleur, id, userId]);
    return result.rows[0];
  },

  // Supprimer une matière
  delete: async (id, userId) => {
    const query = `
      DELETE FROM matieres
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },
};

module.exports = Matiere;