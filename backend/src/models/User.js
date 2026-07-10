// backend/src/models/User.js
const pool = require('../config/db');

const User = {
  // Créer un utilisateur
  create: async (fullName, email, passwordHash, university, faculty, studyLevel, major) => {
    const query = `
      INSERT INTO users (full_name, email, password_hash, university, faculty, study_level, major)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, full_name, email, university, faculty, study_level, major, created_at
    `;
    const values = [fullName, email, passwordHash, university, faculty, studyLevel, major];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Trouver un utilisateur par email
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  // Trouver un utilisateur par ID
  findById: async (id) => {
    const query = `
      SELECT id, full_name, email, university, faculty, study_level, major, created_at 
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = User;