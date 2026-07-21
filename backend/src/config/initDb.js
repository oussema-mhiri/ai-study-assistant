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
  // 6b. Table QUIZ_RESULTS
  // ================================
  const createQuizResultsTable = `
    CREATE TABLE IF NOT EXISTS quiz_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      quiz_id INTEGER REFERENCES quizs(id) ON DELETE CASCADE,
      question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
      reponse_donnee TEXT,
      est_correct BOOLEAN NOT NULL DEFAULT false,
      answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ================================
  // 6c. Table SESSIONS_PLANNING
  // ================================
  const createSessionsPlanningTable = `
    CREATE TABLE IF NOT EXISTS sessions_planning (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      matiere_id INTEGER REFERENCES matieres(id) ON DELETE CASCADE,
      date_session DATE NOT NULL,
      heure_debut TIME,
      duree_minutes INTEGER DEFAULT 60,
      type VARCHAR(20) DEFAULT 'revision',
      titre VARCHAR(255),
      statut VARCHAR(20) DEFAULT 'planifie',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ================================
  // 6d. Table NOTIFICATIONS
  // ================================
  const createNotificationsTable = `
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      titre VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(30) DEFAULT 'rappel',
      lue BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ================================
  // 6e. Table CONVERSATIONS
  // ================================
  const createConversationsTable = `
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      matiere_id INTEGER REFERENCES matieres(id) ON DELETE CASCADE,
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      titre VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ================================
  // 6f. Table EXERCISE_RESULTS
  // ================================
  const createExerciseResultsTable = `
    CREATE TABLE IF NOT EXISTS exercise_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      matiere_id INTEGER REFERENCES matieres(id) ON DELETE CASCADE,
      exercise_type VARCHAR(20) NOT NULL,
      question TEXT NOT NULL,
      user_answer TEXT,
      correct_answer TEXT,
      is_correct BOOLEAN NOT NULL DEFAULT false,
      difficulty VARCHAR(20),
      answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ================================
  // 6g. Table FLASHCARDS
  // ================================
  const createFlashcardsTable = `
    CREATE TABLE IF NOT EXISTS flashcards (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      matiere_id INTEGER REFERENCES matieres(id) ON DELETE CASCADE,
      document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
      recto TEXT NOT NULL,
      verso TEXT NOT NULL,
      categorie VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // ================================
  // 6h. Table FLASHCARD_REVIEWS
  // ================================
  const createFlashcardReviewsTable = `
    CREATE TABLE IF NOT EXISTS flashcard_reviews (
      id SERIAL PRIMARY KEY,
      flashcard_id INTEGER REFERENCES flashcards(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      ease_factor DECIMAL(3,2) DEFAULT 2.50,
      interval_days INTEGER DEFAULT 0,
      repetitions INTEGER DEFAULT 0,
      next_review DATE NOT NULL DEFAULT CURRENT_DATE,
      last_review DATE,
      quality INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(flashcard_id, user_id)
    );
  `;

  // ================================
  // 6c. Table MESSAGES
  // ================================
  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
      sender VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
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
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ia_level VARCHAR(20) DEFAULT 'Moyen';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS response_mode VARCHAR(20) DEFAULT 'Détaillé';
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE;
    ALTER TABLE matieres ADD COLUMN IF NOT EXISTS date_examen DATE;
    ALTER TABLE matieres ADD COLUMN IF NOT EXISTS couleur VARCHAR(20) DEFAULT '#3B82F6';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_push BOOLEAN DEFAULT true;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_email BOOLEAN DEFAULT true;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_hour TIME DEFAULT '18:00';
    ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
    ALTER TABLE exercise_results ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
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

    await pool.query(createConversationsTable);
    console.log('✅ Table "conversations" créée ou déjà existante');

    await pool.query(createMessagesTable);
    console.log('✅ Table "messages" créée ou déjà existante');

    await pool.query(createExerciseResultsTable);
    console.log('✅ Table "exercise_results" créée ou déjà existante');

    await pool.query(createFlashcardsTable);
    console.log('✅ Table "flashcards" créée ou déjà existante');

    await pool.query(createFlashcardReviewsTable);
    console.log('✅ Table "flashcard_reviews" créée ou déjà existante');

    await pool.query(createQuizResultsTable);
    console.log('✅ Table "quiz_results" créée ou déjà existante');

    await pool.query(createSessionsPlanningTable);
    console.log('✅ Table "sessions_planning" créée ou déjà existante');

    await pool.query(createNotificationsTable);
    console.log('✅ Table "notifications" créée ou déjà existante');

    await pool.query(migrateExistingTable);
    console.log('✅ Colonnes Google OAuth et reset password vérifiées/ajoutées');

  } catch (err) {
    console.error('❌ Erreur création/migration tables :', err);
  }
};

createTables();