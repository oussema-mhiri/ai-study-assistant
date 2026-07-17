// backend/src/config/initDb.js
const pool = require('./db');

const createTables = async () => {
  // ================================
  // 1. Table USERS
  // ================================
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

  // ================================
  // 2. Table MATIERES
  // ================================
  const createMatiereTable = `
    CREATE TABLE IF NOT EXISTS matieres (
      id SERIAL PRIMARY KEY,
      nom VARCHAR(255) NOT NULL,
      description TEXT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ================================
  // 3. Table DOCUMENTS
  // ================================
  const createDocumentTable = `
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      nom_fichier VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      url VARCHAR(500) NOT NULL,
      matiere_id INTEGER REFERENCES matieres(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ================================
  // 4. Table RESUMES
  // ================================
  const createResumeTable = `
    CREATE TABLE IF NOT EXISTS resumes (
      id SERIAL PRIMARY KEY,
      type VARCHAR(20) NOT NULL, -- 'court', 'detaillé'
      contenu TEXT NOT NULL,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ================================
  // 5. Table QUIZS
  // ================================
  const createQuizTable = `
    CREATE TABLE IF NOT EXISTS quizs (
      id SERIAL PRIMARY KEY,
      titre VARCHAR(255) NOT NULL,
      niveau VARCHAR(20),
      matiere_id INTEGER REFERENCES matieres(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ================================
  // 6. Table QUESTIONS
  // ================================
  const createQuestionTable = `
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      contenu TEXT NOT NULL,
      type VARCHAR(20) NOT NULL,
      bonne_reponse TEXT,
      options JSONB,
      quiz_id INTEGER REFERENCES quizs(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ================================
  // 7. Migration (pour les bases existantes)
  // ================================
  const migrateExistingTable = `
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
  `;

  try {
    await pool.query(createUsersTable);
    console.log('✅ Table "users" créée ou déjà existante');

    await pool.query(createMatiereTable);
    console.log('✅ Table "matieres" créée ou déjà existante');

    await pool.query(createDocumentTable);
    console.log('✅ Table "documents" créée ou déjà existante');

    await pool.query(createResumeTable);
    console.log('✅ Table "resumes" créée ou déjà existante');

    await pool.query(createQuizTable);
    console.log('✅ Table "quizs" créée ou déjà existante');

    await pool.query(createQuestionTable);
    console.log('✅ Table "questions" créée ou déjà existante');

    await pool.query(migrateExistingTable);
    console.log('✅ Colonnes Google OAuth et reset password vérifiées/ajoutées');

  } catch (err) {
    console.error('❌ Erreur création/migration tables :', err);
  }
};

createTables();