const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Import des modules internes
const pool = require('./config/db');
require('./config/initDb');

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes publiques
app.get('/api/test', (req, res) => {
  res.json({ message: 'API fonctionne ! 🚀' });
});

// Routes d'authentification
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

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
// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
