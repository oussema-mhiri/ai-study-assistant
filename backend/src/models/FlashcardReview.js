const pool = require('../config/db');

const FlashcardReview = {
  async upsert(userId, flashcardId, quality, reviewData) {
    const { ease_factor, interval_days, repetitions, next_review } = reviewData;
    const res = await pool.query(
      `INSERT INTO flashcard_reviews (user_id, flashcard_id, ease_factor, interval_days, repetitions, next_review, last_review, quality)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7)
       ON CONFLICT (flashcard_id, user_id)
       DO UPDATE SET
         ease_factor = $3,
         interval_days = $4,
         repetitions = $5,
         next_review = $6,
         last_review = CURRENT_DATE,
         quality = $7
       RETURNING *`,
      [userId, flashcardId, ease_factor, interval_days, repetitions, next_review, quality]
    );
    return res.rows[0];
  },

  async findByCard(userId, flashcardId) {
    const res = await pool.query(
      `SELECT * FROM flashcard_reviews
       WHERE user_id = $1 AND flashcard_id = $2`,
      [userId, flashcardId]
    );
    return res.rows[0];
  },


};

module.exports = FlashcardReview;
