// backend/src/config/initDb.js
const pool = require('./db');

const createTables = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      google_id VARCHAR(255) UNIQUE,
      university VARCHAR(255),
      faculty VARCHAR(255),
      study_level VARCHAR(50),
      major VARCHAR(255),
      reset_token VARCHAR(255),
      reset_token_expires TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Migrations pour les bases déjà existantes
  const migrateExistingTable = `
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
  `;

  try {
    await pool.query(createUsersTable);
    console.log('✅ Table "users" créée ou déjà existante');

    await pool.query(migrateExistingTable);
    console.log('✅ Colonnes Google OAuth et reset password vérifiées/ajoutées');
  } catch (err) {
    console.error('❌ Erreur création/migration table users', err);
  }
};

createTables();