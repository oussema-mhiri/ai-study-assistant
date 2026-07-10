// backend/src/config/initDb.js
const pool = require('./db');

const createTables = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      university VARCHAR(255),
      faculty VARCHAR(255),
      study_level VARCHAR(50),
      major VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(query);
    console.log('✅ Table "users" créée ou déjà existante');
  } catch (err) {
    console.error('❌ Erreur création table users', err);
  }
};

createTables();