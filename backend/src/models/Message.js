const pool = require('../config/db');

const Message = {
  create: async (conversationId, sender, content) => {
    const query = `
      INSERT INTO messages (conversation_id, sender, content)
      VALUES ($1, $2, $3)
      RETURNING id, conversation_id, sender, content, created_at
    `;
    const result = await pool.query(query, [conversationId, sender, content]);
    return result.rows[0];
  },

  findByConversationId: async (conversationId) => {
    const query = `
      SELECT * FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [conversationId]);
    return result.rows;
  }
};

module.exports = Message;
