// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 📝 INSCRIPTION
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, university, faculty, studyLevel, major } = req.body;

    // Vérifier si tous les champs obligatoires sont présents
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe sont requis.' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hacher le mot de passe (10 rounds de sel)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur dans la base
    const newUser = await User.create(
      fullName, email, hashedPassword, 
      university || null, faculty || null, studyLevel || null, major || null
    );

    // Générer le token JWT (valide 7 jours)
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

// 🔑 CONNEXION
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    // Trouver l'utilisateur
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // Générer le token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retirer le mot de passe de la réponse
    const { password_hash, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la connexion.' });
  }
};