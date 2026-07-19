const express = require('express');
const {
  getConversations,
  createConversation,
  getMessages,
  deleteConversation,
  chatStream,
  getSmartSuggestions
} = require('../controllers/chatbotController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/subjects/:matiereId/conversations', auth, getConversations);
router.post('/conversations', auth, createConversation);
router.get('/conversations/:id/messages', auth, getMessages);
router.delete('/conversations/:id', auth, deleteConversation);
router.post('/conversations/:id/chat', auth, chatStream);
router.get('/subjects/:matiereId/suggestions', auth, getSmartSuggestions);

module.exports = router;
