const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  generateAIPlanning,
  getNotifications,
  markNotifRead,
} = require('../controllers/planningController');

router.use(auth);

// Sessions de révision
router.get('/sessions', getSessions);
router.post('/sessions', createSession);
router.patch('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession);

// Génération IA
router.post('/generate', generateAIPlanning);

// Notifications in-app
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotifRead);

module.exports = router;
