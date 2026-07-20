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
      SELECT id, full_name, email, university, faculty, study_level, major, ia_level, response_mode, created_at 
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Trouver un utilisateur par google_id
  findByGoogleId: async (googleId) => {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const result = await pool.query(query, [googleId]);
    return result.rows[0];
  },

  // Créer un utilisateur venant de Google (pas de mot de passe)
  createFromGoogle: async (fullName, email, googleId) => {
    const query = `
      INSERT INTO users (full_name, email, google_id)
      VALUES ($1, $2, $3)
      RETURNING id, full_name, email, university, faculty, study_level, major, created_at
    `;
    const result = await pool.query(query, [fullName, email, googleId]);
    return result.rows[0];
  },

  // Lier un google_id à un compte existant (même email, créé via mot de passe avant)
  linkGoogleId: async (userId, googleId) => {
    const query = `
      UPDATE users SET google_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, full_name, email, university, faculty, study_level, major, created_at
    `;
    const result = await pool.query(query, [googleId, userId]);
    return result.rows[0];
  },

  // Enregistrer un token de réinitialisation de mot de passe (hashé) + sa date d'expiration
  setResetToken: async (userId, hashedToken, expiresAt) => {
    const query = `
      UPDATE users SET reset_token = $1, reset_token_expires = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
    await pool.query(query, [hashedToken, expiresAt, userId]);
  },

  // Trouver un utilisateur par son token de reset (hashé), uniquement s'il n'est pas expiré
  findByValidResetToken: async (hashedToken) => {
    const query = `
      SELECT * FROM users
      WHERE reset_token = $1 AND reset_token_expires > NOW()
    `;
    const result = await pool.query(query, [hashedToken]);
    return result.rows[0];
  },

  // Mettre à jour le mot de passe et effacer le token de reset
  updatePasswordAndClearToken: async (userId, newPasswordHash) => {
    const query = `
      UPDATE users
      SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await pool.query(query, [newPasswordHash, userId]);
  },

  // =================================================
  // 🆕 NOUVELLES FONCTIONS POUR LE CODE OTP (6 chiffres)
  // =================================================

  // Enregistrer un code de réinitialisation (stocké en clair car c'est un code court)
  setResetCode: async (userId, plainCode, expiresAt) => {
    const query = `
      UPDATE users SET reset_token = $1, reset_token_expires = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
    await pool.query(query, [plainCode, expiresAt, userId]);
  },

  // Trouver un utilisateur par code VALIDE (non expiré)
  findByValidResetCode: async (plainCode) => {
    const query = `
      SELECT * FROM users
      WHERE reset_token = $1 AND reset_token_expires > NOW()
    `;
    const result = await pool.query(query, [plainCode]);
    return result.rows[0];
  },

  // Effacer le code après réinitialisation
  clearResetCode: async (userId) => {
    const query = `
      UPDATE users SET reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(query, [userId]);
  },

  // Mettre à jour le profil (université, faculté, niveau, filière)
  updateProfile: async (userId, university, faculty, studyLevel, major) => {
    const query = `
      UPDATE users SET university = $1, faculty = $2, study_level = $3, major = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, full_name, email, university, faculty, study_level, major, ia_level, response_mode, created_at
    `;
    const result = await pool.query(query, [university, faculty, studyLevel, major, userId]);
    return result.rows[0];
  },

  // Mettre à jour les préférences IA
  updatePreferences: async (userId, iaLevel, responseMode) => {
    const query = `
      UPDATE users SET ia_level = $1, response_mode = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, full_name, email, university, faculty, study_level, major, ia_level, response_mode, created_at
    `;
    const result = await pool.query(query, [iaLevel, responseMode, userId]);
    return result.rows[0];
  },
};

module.exports = User;