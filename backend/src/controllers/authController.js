const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendResetCodeEmail } = require('../services/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =============================================
// 1. INSCRIPTION
// =============================================
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, university, faculty, studyLevel, major } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont requis.' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create(
      fullName, email, hashedPassword,
      university || null, faculty || null, studyLevel || null, major || null
    );

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription.' });
  }
};

// =============================================
// 2. CONNEXION
// =============================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format d\'email invalide.' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        message: 'Ce compte a été créé avec Google. Connectez-vous avec le bouton "Continuer avec Google".',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la connexion.' });
  }
};

// =============================================
// 3. AUTHENTIFICATION GOOGLE
// =============================================
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Token Google manquant.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findByGoogleId(googleId);

    if (!user) {
      const existingByEmail = await User.findByEmail(email);
      if (existingByEmail) {
        user = await User.linkGoogleId(existingByEmail.id, googleId);
      }
    }

    if (!user) {
      user = await User.createFromGoogle(name, email, googleId);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Authentification Google invalide.' });
  }
};

// =============================================
// 4. DEMANDE DE CODE (Étape 1)
// =============================================
exports.requestResetCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis.' });

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Aucun compte trouvé avec cet email.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await User.setResetCode(user.id, code, expiresAt);

    try {
      await sendResetCodeEmail(user.email, code);
    } catch (emailError) {
      console.error('Erreur envoi email reset:', emailError.message);
    }

    res.json({ message: 'Un code de réinitialisation a été envoyé à votre email.' });
  } catch (error) {
    console.error('Erreur requestResetCode:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du code.' });
  }
};

// =============================================
// 5. VÉRIFICATION DU CODE (Étape 2)
// =============================================
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email et code requis.' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    if (user.reset_token !== code) {
      return res.status(400).json({ message: 'Code invalide.' });
    }
    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({ message: 'Code expiré. Refaites une demande.' });
    }

    const tempToken = jwt.sign(
      { id: user.id, purpose: 'reset-password' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({ tempToken, message: 'Code vérifié. Vous pouvez maintenant changer votre mot de passe.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la vérification du code.' });
  }
};

// =============================================
// 6. RÉINITIALISATION DU MOT DE PASSE (Étape 3)
// =============================================
exports.resetPassword = async (req, res) => {
  try {
    const { tempToken, newPassword } = req.body;
    if (!tempToken || !newPassword) {
      return res.status(400).json({ message: 'Token et mot de passe requis.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Token expiré ou invalide. Refaites la demande.' });
    }

    if (decoded.purpose !== 'reset-password') {
      return res.status(401).json({ message: 'Token invalide pour cette action.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updatePasswordAndClearToken(decoded.id, hashedPassword);

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la réinitialisation.' });
  }
};

// =============================================
// 7. MISE À JOUR DU PROFIL
// =============================================
exports.updateProfile = async (req, res) => {
  try {
    const { university, faculty, studyLevel, major } = req.body;

    const updated = await User.updateProfile(
      req.userId,
      university || null,
      faculty || null,
      studyLevel || null,
      major || null
    );

    if (!updated) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Erreur updateProfile:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.' });
  }
};

// =============================================
// 8. MISE À JOUR DES PRÉFÉRENCES IA
// =============================================
exports.updatePreferences = async (req, res) => {
  try {
    const { iaLevel, responseMode } = req.body;

    const validLevels = ['Simple', 'Moyen', 'Avancé'];
    const validModes = ['Court', 'Détaillé', 'Personnalisé'];

    if (iaLevel && !validLevels.includes(iaLevel)) {
      return res.status(400).json({ message: 'Niveau IA invalide.' });
    }
    if (responseMode && !validModes.includes(responseMode)) {
      return res.status(400).json({ message: 'Mode de réponse invalide.' });
    }

    const updated = await User.updatePreferences(
      req.userId,
      iaLevel || 'Moyen',
      responseMode || 'Détaillé'
    );

    if (!updated) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Erreur updatePreferences:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des préférences.' });
  }
};

// =============================================
// 9. MISE À JOUR DES PRÉFÉRENCES DE NOTIFICATION
// =============================================
exports.updateNotifPreferences = async (req, res) => {
  try {
    const { notifPush, notifEmail, notifHour } = req.body;

    const updated = await User.updateNotifPreferences(req.userId, {
      notifPush: typeof notifPush === 'boolean' ? notifPush : undefined,
      notifEmail: typeof notifEmail === 'boolean' ? notifEmail : undefined,
      notifHour: notifHour || undefined,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Erreur updateNotifPreferences:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des préférences de notification.' });
  }
};

// =============================================
// 10. CHANGEMENT DE MOT DE PASSE
// =============================================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit être différent de l\'actuel.' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    const fullUser = await User.findByEmail(user.email);
    if (!fullUser || !fullUser.password_hash) {
      return res.status(400).json({ message: 'Impossible de vérifier le mot de passe actuel.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, fullUser.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Le mot de passe actuel est incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updatePasswordAndClearToken(req.userId, hashedPassword);

    res.json({ message: 'Mot de passe changé avec succès.' });
  } catch (error) {
    console.error('Erreur changePassword:', error);
    res.status(500).json({ message: 'Erreur lors du changement de mot de passe.' });
  }
};