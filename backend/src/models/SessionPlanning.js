const pool = require('../config/db');

const SessionPlanning = {
  // Créer une session de révision
  create: async (userId, matiereId, dateSession, type, titre, dureeMinutes, heureDebut) => {
    const query = `
      INSERT INTO sessions_planning (user_id, matiere_id, date_session, type, titre, duree_minutes, heure_debut)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, matiereId, dateSession, type, titre, dureeMinutes || 60, heureDebut || null]);
    return result.rows[0];
  },

  // Sessions d'un utilisateur filtrées par mois/année (pour le calendrier)
  findByUserAndMonth: async (userId, month, year) => {
    const query = `
      SELECT sp.*, m.nom AS matiere_nom, m.couleur AS matiere_couleur
      FROM sessions_planning sp
      JOIN matieres m ON m.id = sp.matiere_id
      WHERE sp.user_id = $1
        AND EXTRACT(MONTH FROM sp.date_session) = $2
        AND EXTRACT(YEAR FROM sp.date_session) = $3
      ORDER BY sp.date_session ASC, sp.heure_debut ASC
    `;
    const result = await pool.query(query, [userId, month, year]);
    return result.rows;
  },

  // Sessions d'une matière
  findByMatiere: async (userId, matiereId) => {
    const query = `
      SELECT sp.*, m.nom AS matiere_nom, m.couleur AS matiere_couleur
      FROM sessions_planning sp
      JOIN matieres m ON m.id = sp.matiere_id
      WHERE sp.user_id = $1 AND sp.matiere_id = $2
      ORDER BY sp.date_session ASC
    `;
    const result = await pool.query(query, [userId, matiereId]);
    return result.rows;
  },

  // Mettre à jour le statut ou les détails d'une session
  update: async (id, userId, updates) => {
    const { statut, titre, dateSession, heureDebut, dureeMinutes, type } = updates;
    const query = `
      UPDATE sessions_planning
      SET statut = COALESCE($1, statut),
          titre = COALESCE($2, titre),
          date_session = COALESCE($3, date_session),
          heure_debut = COALESCE($4, heure_debut),
          duree_minutes = COALESCE($5, duree_minutes),
          type = COALESCE($6, type)
      WHERE id = $7 AND user_id = $8
      RETURNING *
    `;
    const result = await pool.query(query, [statut, titre, dateSession, heureDebut, dureeMinutes, type, id, userId]);
    return result.rows[0];
  },

  // Supprimer une session
  delete: async (id, userId) => {
    const query = `DELETE FROM sessions_planning WHERE id = $1 AND user_id = $2 RETURNING id`;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  // Sessions du lendemain pour le cron (rappels)
  findTomorrow: async () => {
    const query = `
      SELECT sp.*, u.email, u.full_name, m.nom AS matiere_nom
      FROM sessions_planning sp
      JOIN users u ON u.id = sp.user_id
      JOIN matieres m ON m.id = sp.matiere_id
      WHERE sp.date_session = CURRENT_DATE + INTERVAL '1 day'
        AND sp.statut = 'planifie'
    `;
    const result = await pool.query(query);
    return result.rows;
  },
};

module.exports = SessionPlanning;
