const express = require('express');
const {
  register,
  login,
  googleAuth,
  requestResetCode,
  verifyResetCode,
  resetPassword,
  updateProfile,
  updatePreferences,
  updateNotifPreferences,
  changePassword
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/request-reset-code', requestResetCode);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

// Routes protégées
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error('Erreur /me:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.put('/profile', auth, updateProfile);
router.put('/preferences', auth, updatePreferences);
router.put('/notif-preferences', auth, updateNotifPreferences);
router.put('/password', auth, changePassword);

module.exports = router;