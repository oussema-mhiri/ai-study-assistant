// backend/src/services/cronService.js
// Service de rappels automatiques : vérifie toutes les heures les sessions du lendemain
// et envoie un e-mail + une notification in-app.

const SessionPlanning = require('../models/SessionPlanning');
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

const checkAndSendReminders = async () => {
  try {
    const sessions = await SessionPlanning.findTomorrow();
    if (sessions.length === 0) return;

    console.log(`🔔 Cron : ${sessions.length} session(s) de révision demain — envoi des rappels...`);

    for (const session of sessions) {
      const dateStr = new Date(session.date_session).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long'
      });
      const heureStr = session.heure_debut
        ? ` à ${session.heure_debut.substring(0, 5)}`
        : '';
      const titre = session.titre || session.type;

      // Notification in-app
      await Notification.create(
        session.user_id,
        `⏰ Rappel : Session de révision demain`,
        `Vous avez une session "${titre}" pour ${session.matiere_nom} prévu ${dateStr}${heureStr}.`,
        'rappel'
      );

      // E-mail
      try {
        await sendEmail({
          to: session.email,
          subject: `📚 Rappel : Session de révision demain — ${session.matiere_nom}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📚 Rappel de révision</h1>
              </div>
              <p style="color: #374151; font-size: 16px;">Bonjour <strong>${session.full_name}</strong> 👋</p>
              <p style="color: #374151; font-size: 15px;">
                Vous avez une session de révision planifiée pour demain :
              </p>
              <div style="background: #F3F4F6; border-left: 4px solid #3B82F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1F2937;"><strong>📖 Matière :</strong> ${session.matiere_nom}</p>
                <p style="margin: 8px 0 0; color: #1F2937;"><strong>📋 Session :</strong> ${titre}</p>
                <p style="margin: 8px 0 0; color: #1F2937;"><strong>📅 Date :</strong> ${dateStr}${heureStr}</p>
                <p style="margin: 8px 0 0; color: #1F2937;"><strong>⏱️ Durée :</strong> ${session.duree_minutes} minutes</p>
              </div>
              <p style="color: #6B7280; font-size: 14px;">Bonne révision ! 🎓</p>
              <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px; text-align: center;">AI Study Assistant</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error(`❌ Erreur envoi email rappel pour user ${session.user_id}:`, emailErr.message);
      }
    }

    console.log(`✅ Cron : Rappels envoyés.`);
  } catch (err) {
    console.error('❌ Erreur cron rappels:', err);
  }
};

const startCronService = () => {
  // Exécuter immédiatement au démarrage (optionnel pour test)
  // checkAndSendReminders();

  // Exécuter toutes les heures
  const intervalMs = 60 * 60 * 1000;
  setInterval(checkAndSendReminders, intervalMs);
  console.log('⏰ Cron service de rappels démarré (vérification toutes les heures)');
};

module.exports = { startCronService, checkAndSendReminders };
