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

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});