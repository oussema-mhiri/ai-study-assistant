const pool = require('../config/db');

const Flashcard = {
  async create(userId, matiereId, documentId, recto, verso, categorie) {
    const res = await pool.query(
      `INSERT INTO flashcards (user_id, matiere_id, document_id, recto, verso, categorie)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, matiereId, documentId || null, recto, verso, categorie || null]
    );
    return res.rows[0];
  },

  async createMultiple(userId, matiereId, documentId, cards) {
    const results = [];
    for (const card of cards) {
      const row = await this.create(userId, matiereId, documentId, card.recto, card.verso, card.categorie);
      results.push(row);
    }
    return results;
  },

  async findBySubject(userId, matiereId) {
    const res = await pool.query(
      `SELECT f.*,
              COALESCE(fr.ease_factor, 2.50) as ease_factor,
              COALESCE(fr.interval_days, 0) as interval_days,
              COALESCE(fr.repetitions, 0) as repetitions,
              fr.next_review,
              fr.last_review
       FROM flashcards f
       LEFT JOIN flashcard_reviews fr ON fr.flashcard_id = f.id AND fr.user_id = $1
       WHERE f.user_id = $1 AND f.matiere_id = $2
       ORDER BY f.created_at DESC`,
      [userId, matiereId]
    );
    return res.rows;
  },

  async findById(userId, cardId) {
    const res = await pool.query(
      `SELECT f.*,
              COALESCE(fr.ease_factor, 2.50) as ease_factor,
              COALESCE(fr.interval_days, 0) as interval_days,
              COALESCE(fr.repetitions, 0) as repetitions,
              fr.next_review,
              fr.last_review
       FROM flashcards f
       LEFT JOIN flashcard_reviews fr ON fr.flashcard_id = f.id AND fr.user_id = $1
       WHERE f.id = $2 AND f.user_id = $1`,
      [userId, cardId]
    );
    return res.rows[0];
  },

  async findDueCards(userId, matiereId, limit = 20) {
    const res = await pool.query(
      `SELECT f.*,
              COALESCE(fr.ease_factor, 2.50) as ease_factor,
              COALESCE(fr.interval_days, 0) as interval_days,
              COALESCE(fr.repetitions, 0) as repetitions,
              fr.next_review,
              fr.last_review
       FROM flashcards f
       LEFT JOIN flashcard_reviews fr ON fr.flashcard_id = f.id AND fr.user_id = $1
       WHERE f.user_id = $1 AND f.matiere_id = $2
         AND (fr.next_review IS NULL OR fr.next_review <= CURRENT_DATE)
       ORDER BY fr.next_review ASC NULLS FIRST
       LIMIT $3`,
      [userId, matiereId, limit]
    );
    return res.rows;
  },

  async getStats(userId, matiereId) {
    const res = await pool.query(
      `SELECT
         COUNT(*) as total,
         COUNT(CASE WHEN fr.next_review IS NULL OR fr.next_review <= CURRENT_DATE THEN 1 END) as due_today,
         COUNT(CASE WHEN fr.repetitions >= 3 AND fr.ease_factor >= 2.0 THEN 1 END) as mastered,
         ROUND(AVG(COALESCE(fr.ease_factor, 2.50)), 2) as avg_ease_factor
       FROM flashcards f
       LEFT JOIN flashcard_reviews fr ON fr.flashcard_id = f.id AND fr.user_id = $1
       WHERE f.user_id = $1 AND f.matiere_id = $2`,
      [userId, matiereId]
    );
    return res.rows[0];
  },

  async delete(userId, cardId) {
    const res = await pool.query(
      'DELETE FROM flashcards WHERE id = $1 AND user_id = $2 RETURNING id',
      [cardId, userId]
    );
    return res.rows[0];
  },

  async deleteBySubject(userId, matiereId) {
    const res = await pool.query(
      'DELETE FROM flashcards WHERE user_id = $1 AND matiere_id = $2 RETURNING id',
      [userId, matiereId]
    );
    return res.rowCount;
  }
};

module.exports = Flashcard;
