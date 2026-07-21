const SessionPlanning = require('../models/SessionPlanning');
const Notification = require('../models/Notification');
const Matiere = require('../models/Matiere');
const User = require('../models/User');
const Document = require('../models/Document');
const Resume = require('../models/Resume');
const { sendEmail } = require('../services/emailService');
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
      'Session planifiée',
      `Session "${titre || type}" pour ${matiere?.nom} le ${new Date(dateSession).toLocaleDateString('fr-FR')} ajoutée à votre planning.`,
      'planning'
    );

    // Email de confirmation si activé
    const user = await User.findById(userId);
    if (user?.notif_email) {
      const dateStr = new Date(dateSession).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long'
      });
      sendEmail({
        to: user.email,
        subject: `Session planifiée — ${matiere?.nom}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Session planifiée</h1>
            </div>
            <p style="color: #374151; font-size: 16px;">Bonjour <strong>${user.full_name}</strong></p>
            <p style="color: #374151; font-size: 15px;">Une nouvelle session a été ajoutée à votre planning :</p>
            <div style="background: #F3F4F6; border-left: 4px solid #3B82F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #1F2937;"><strong>Matière :</strong> ${matiere?.nom}</p>
              <p style="margin: 8px 0 0; color: #1F2937;"><strong>Session :</strong> ${titre || type}</p>
              <p style="margin: 8px 0 0; color: #1F2937;"><strong>Date :</strong> ${dateStr}${heureDebut ? ` à ${heureDebut}` : ''}</p>
              <p style="margin: 8px 0 0; color: #1F2937;"><strong>Durée :</strong> ${dureeMinutes} minutes</p>
            </div>
            <p style="color: #6B7280; font-size: 14px;">Bonne révision !</p>
            <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px; text-align: center;">AI Study Assistant</p>
          </div>
        `
      }).catch(err => console.error('Erreur email session:', err.message));
    }

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
    const { matiereId, dateExamen, disponibilitesMinutesParJour, scoreActuel,
            revisionTypes, exerciceTypes, revisionMinutes, exerciceMinutes } = req.body;

    if (!matiereId || !dateExamen) {
      return res.status(400).json({ error: 'matiereId et dateExamen requis' });
    }

    const matiere = await Matiere.findById(matiereId, userId);
    if (!matiere) return res.status(404).json({ error: 'Matière introuvable' });

    // Récupérer les documents et résumés de la matière
    const docs = await Document.findAllBySubject(matiereId, userId);
    const docSummaries = [];
    for (const doc of docs.slice(0, 5)) {
      const resume = await Resume.findByDocumentIdAndType(doc.id, 'detaillé');
      if (resume?.contenu) {
        docSummaries.push({ nom: doc.nom_fichier, contenu: resume.contenu.substring(0, 1500) });
      } else {
        docSummaries.push({ nom: doc.nom_fichier, contenu: '(pas de résumé disponible)' });
      }
    }

    const today = new Date();
    const exam = new Date(dateExamen);
    const daysRemaining = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
    const disponibilitesH = Math.round((disponibilitesMinutesParJour || 60) / 60 * 10) / 10;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    const revisionLabels = { chatbot: 'Chatbot IA', resume: 'Résumé', flashcard: 'Flashcards' };
    const exerciceLabels = { exercices: 'Exercices', qcm: 'QCM', vrai_faux: 'Vrai ou Faux' };
    const revTypes = (revisionTypes && revisionTypes.length > 0)
      ? revisionTypes.map(t => revisionLabels[t] || t).join(', ')
      : 'Chatbot IA, Résumé, Flashcards';
    const exTypes = (exerciceTypes && exerciceTypes.length > 0)
      ? exerciceTypes.map(t => exerciceLabels[t] || t).join(', ')
      : 'Exercices, QCM, Vrai ou Faux';
    const revMin = revisionMinutes || Math.round((disponibilitesMinutesParJour || 60) / 2);
    const exMin = exerciceMinutes || Math.round((disponibilitesMinutesParJour || 60) / 2);

    const docsContent = docSummaries.length > 0
      ? `\nContenu du cours de l'étudiant (base-toi UNIQUEMENT sur ce contenu pour générer les titres et thèmes des sessions) :\n${docSummaries.map((d, i) => `--- Document ${i + 1} : ${d.nom} ---\n${d.contenu}`).join('\n\n')}`
      : '\n(Aucun document uploadé pour cette matière — génère des thèmes génériques basés sur le nom de la matière)';

    const prompt = `
      Tu es un expert en pédagogie. Génère un planning de révision structuré pour un étudiant.
      
      Matière : ${matiere.nom}
      Date de l'examen : ${new Date(dateExamen).toLocaleDateString('fr-FR')}
      Jours restants : ${daysRemaining}
      Disponibilité quotidienne : ${disponibilitesH}h/jour
      Score de maîtrise actuel : ${scoreActuel || 0}%
      ${docsContent}
      
      Types d'activités de révision souhaités : ${revTypes}
      Types d'activités d'exercices souhaités : ${exTypes}
      Temps pour la révision : ${revMin} min/jour
      Temps pour les exercices : ${exMin} min/jour
      
      IMPORTANT : Les titres des sessions doivent être basés sur le CONTENU RÉEL des documents ci-dessus. Par exemple, si le document parle des "réseaux de neurones convolutifs", crée une session "Révision : Réseaux de neurones convolutifs". Ne génère PAS de thèmes génériques inventés.
      
      Génère un planning optimisé sous forme JSON UNIQUEMENT (sans markdown, sans texte avant ou après), structure :
      {
        "sessions": [
          {
            "date": "YYYY-MM-DD",
            "type": "qcm" | "chatbot" | "revision" | "resume" | "flashcard" | "exercices" | "vrai_faux",
            "titre": "...",
            "duree_minutes": 60
          }
        ],
        "conseil": "Un conseil global pour cet étudiant"
      }
      
      Répartis les sessions sur les ${Math.min(daysRemaining - 1, 14)} prochains jours.
      Utilise les types d'activités demandés par l'utilisateur (chatbot, resume, flashcard pour la révision, et exercices, qcm, vrai_faux pour les exercices).
      Alterne entre révision et exercices. Respecte le temps alloué à chaque type d'activité.
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
        'Planning IA généré',
        `${savedSessions.length} sessions de révision pour "${matiere.nom}" ont été ajoutées à votre planning.`,
        'planning'
      );

      // Email récapitulatif si activé
      const user = await User.findById(userId);
      if (user?.notif_email) {
        const typeLabels = { qcm: 'QCM', lecture: 'Lecture', chatbot: 'Chatbot', revision: 'Révision', resume: 'Résumé', flashcard: 'Flashcards', exercices: 'Exercices', vrai_faux: 'Vrai ou Faux' };
        const sessionsList = savedSessions.map(s => {
          const dateStr = new Date(s.date_session).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
          return `<li style="margin: 4px 0; color: #1F2937;">${dateStr} — ${typeLabels[s.type] || s.type} : ${s.titre || ''} (${s.duree_minutes}min)</li>`;
        }).join('');

        sendEmail({
          to: user.email,
          subject: `Planning IA généré — ${matiere.nom}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6366F1, #3B82F6); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Planning IA généré</h1>
              </div>
              <p style="color: #374151; font-size: 16px;">Bonjour <strong>${user.full_name}</strong></p>
              <p style="color: #374151; font-size: 15px;">Votre planning de révision pour <strong>${matiere.nom}</strong> a été généré avec succès.</p>
              <div style="background: #F3F4F6; border-left: 4px solid #6366F1; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 8px; color: #1F2937; font-weight: bold;">${savedSessions.length} session${savedSessions.length > 1 ? 's' : ''} planifiée${savedSessions.length > 1 ? 's' : ''} :</p>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px;">${sessionsList}</ul>
              </div>
              ${planning.conseil ? `
              <div style="background: #EEF2FF; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #4338CA; font-size: 14px;"><strong>Conseil IA :</strong> ${planning.conseil}</p>
              </div>` : ''}
              <p style="color: #6B7280; font-size: 14px;">Consultez votre planning dans l'application pour plus de détails.</p>
              <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px; text-align: center;">AI Study Assistant</p>
            </div>
          `
        }).catch(err => console.error('Erreur email planning:', err.message));
      }
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
