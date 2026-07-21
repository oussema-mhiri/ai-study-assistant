const SessionPlanning = require('../models/SessionPlanning');
const Notification = require('../models/Notification');
const Matiere = require('../models/Matiere');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// GET /planning/sessions?month=7&year=2026
const getSessions = async (req, res) => {
  try {
    const userId = req.userId;
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const sessions = await SessionPlanning.findByUserAndMonth(userId, month, year);
    res.json(sessions);
  } catch (err) {
    console.error('Erreur getSessions:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /planning/sessions
const createSession = async (req, res) => {
  try {
    const userId = req.userId;
    const { matiereId, dateSession, type, titre, dureeMinutes, heureDebut } = req.body;
    if (!matiereId || !dateSession) {
      return res.status(400).json({ error: 'matiereId et dateSession requis' });
    }
    const session = await SessionPlanning.create(userId, matiereId, dateSession, type, titre, dureeMinutes, heureDebut);

    // Notif in-app
    const matiere = await Matiere.findById(matiereId, userId);
    await Notification.create(
      userId,
      '📅 Session planifiée',
      `Session "${titre || type}" pour ${matiere?.nom} le ${new Date(dateSession).toLocaleDateString('fr-FR')} ajoutée à votre planning.`,
      'planning'
    );

    res.status(201).json(session);
  } catch (err) {
    console.error('Erreur createSession:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PATCH /planning/sessions/:id
const updateSession = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const session = await SessionPlanning.update(id, userId, req.body);
    if (!session) return res.status(404).json({ error: 'Session introuvable' });
    res.json(session);
  } catch (err) {
    console.error('Erreur updateSession:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /planning/sessions/:id
const deleteSession = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const deleted = await SessionPlanning.delete(id, userId);
    if (!deleted) return res.status(404).json({ error: 'Session introuvable' });
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur deleteSession:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /planning/generate — Génération IA du planning avec auto-save
const generateAIPlanning = async (req, res) => {
  try {
    const userId = req.userId;
    const { matiereId, dateExamen, disponibilitesMinutesParJour, scoreActuel } = req.body;

    if (!matiereId || !dateExamen) {
      return res.status(400).json({ error: 'matiereId et dateExamen requis' });
    }

    const matiere = await Matiere.findById(matiereId, userId);
    if (!matiere) return res.status(404).json({ error: 'Matière introuvable' });

    const today = new Date();
    const exam = new Date(dateExamen);
    const daysRemaining = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
    const disponibilitesH = Math.round((disponibilitesMinutesParJour || 60) / 60 * 10) / 10;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    const prompt = `
      Tu es un expert en pédagogie. Génère un planning de révision structuré pour un étudiant.
      
      Matière : ${matiere.nom}
      Date de l'examen : ${new Date(dateExamen).toLocaleDateString('fr-FR')}
      Jours restants : ${daysRemaining}
      Disponibilité quotidienne : ${disponibilitesH}h/jour
      Score de maîtrise actuel : ${scoreActuel || 0}%
      
      Génère un planning optimisé sous forme JSON UNIQUEMENT (sans markdown, sans texte avant ou après), structure :
      {
        "sessions": [
          {
            "date": "YYYY-MM-DD",
            "type": "qcm" | "lecture" | "chatbot" | "revision",
            "titre": "...",
            "duree_minutes": 60
          }
        ],
        "conseil": "Un conseil global pour cet étudiant"
      }
      
      Répartis les sessions sur les ${Math.min(daysRemaining - 1, 14)} prochains jours.
      Alterne entre QCM, lecture et discussion chatbot pour maintenir l'engagement.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Impossible de générer le planning IA' });
    }
    const planning = JSON.parse(jsonMatch[0]);

    // Auto-save les sessions
    const savedSessions = [];
    for (const s of (planning.sessions || [])) {
      try {
        const session = await SessionPlanning.create(
          userId, matiereId, s.date, s.type, s.titre, s.duree_minutes, null
        );
        savedSessions.push(session);
      } catch (e) {
        console.error('Erreur sauvegarde session IA:', e);
      }
    }

    // Une seule notification globale
    if (savedSessions.length > 0) {
      await Notification.create(
        userId,
        '📅 Planning IA généré',
        `${savedSessions.length} sessions de révision pour "${matiere.nom}" ont été ajoutées à votre planning.`,
        'planning'
      );
    }

    res.json({ planning: { ...planning, sessions: savedSessions }, matiereNom: matiere.nom });
  } catch (err) {
    console.error('Erreur generateAIPlanning:', err);
    res.status(500).json({ error: 'Erreur lors de la génération du planning' });
  }
};

// GET /planning/notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const notifications = await Notification.findByUser(userId, 30);
    const unread = await Notification.countUnread(userId);
    res.json({ notifications, unread });
  } catch (err) {
    console.error('Erreur getNotifications:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PATCH /planning/notifications/:id/read
const markNotifRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    if (id === 'all') {
      await Notification.markAllAsRead(userId);
      return res.json({ success: true });
    }
    const notif = await Notification.markAsRead(id, userId);
    res.json(notif);
  } catch (err) {
    console.error('Erreur markNotifRead:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  generateAIPlanning,
  getNotifications,
  markNotifRead,
};
