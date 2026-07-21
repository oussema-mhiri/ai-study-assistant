const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

// Import des modules internes
const pool = require('./config/db');
require('./config/initDb');

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rate limiting global : 500 requêtes / 15 min
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { message: 'Trop de requêtes, réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Rate limiting auth : 50 requêtes / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: 'Trop de tentatives, réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes publiques
app.get('/api/test', (req, res) => {
  res.json({ message: 'API fonctionne ! 🚀' });
});

// Routes d'authentification
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authLimiter, authRoutes);

// Route protégée (exemple)
const auth = require('./middleware/auth');
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'Accès autorisé !', userId: req.userId });
});
// Routes
const subjectRoutes = require('./routes/subjectRoutes');
const documentRoutes = require('./routes/documentRoutes');
const quizRoutes = require('./routes/quizRoutes');

app.use('/api/subjects', subjectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/quizzes', quizRoutes);
const { testGemini } = require('./services/geminiService');

app.get('/api/test-gemini', async (req, res) => {
  try {
    const response = await testGemini();
    res.json({ message: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
const { generateSummary } = require('./services/geminiService');

app.post('/api/test-summary', async (req, res) => {
  try {
    const text = req.body.text || "L'intelligence artificielle est un domaine de l'informatique qui vise à créer des machines capables de simuler l'intelligence humaine. Elle inclut des sous-domaines comme l'apprentissage automatique, le traitement du langage naturel et la vision par ordinateur.";
    const summary = await generateSummary(text, 'court');
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Routes IA
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);
const exerciseRoutes = require('./routes/exerciseRoutes');
app.use('/api/exercises', exerciseRoutes);
const chatbotRoutes = require('./routes/chatbotRoutes');
app.use('/api/chatbot', chatbotRoutes);
const progressRoutes = require('./routes/progressRoutes');
app.use('/api/progress', progressRoutes);
const planningRoutes = require('./routes/planningRoutes');
app.use('/api/planning', planningRoutes);
const flashcardRoutes = require('./routes/flashcardRoutes');
app.use('/api/flashcards', flashcardRoutes);
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);
const resourceRoutes = require('./routes/resourceRoutes');
app.use('/api/resources', resourceRoutes);
// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
  // Démarrer le service de rappels automatiques (cron)
  const { startCronService } = require('./services/cronService');
  startCronService();
});
