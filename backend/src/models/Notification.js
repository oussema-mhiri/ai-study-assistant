const pool = require('../config/db');

const Notification = {
  // Créer une notification in-app
  create: async (userId, titre, message, type = 'rappel') => {
    const query = `
      INSERT INTO notifications (user_id, titre, message, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, titre, message, type]);
    return result.rows[0];
  },

  // Récupérer les notifications d'un utilisateur (non lues en premier)
  findByUser: async (userId, limit = 30) => {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY lue ASC, created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  },

  // Compter les notifications non lues
  countUnread: async (userId) => {
    const query = `SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND lue = false`;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  },

  // Marquer une notification comme lue
  markAsRead: async (id, userId) => {
    const query = `
      UPDATE notifications SET lue = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead: async (userId) => {
    const query = `UPDATE notifications SET lue = true WHERE user_id = $1`;
    await pool.query(query, [userId]);
  },
};

module.exports = Notification;
