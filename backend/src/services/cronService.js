// backend/src/services/cronService.js
// Rappels automatiques : sessions demain + examens à venir (3j / 1j)

const SessionPlanning = require('../models/SessionPlanning');
const Notification = require('../models/Notification');
const Matiere = require('../models/Matiere');
const pool = require('../config/db');
const { sendEmail } = require('./emailService');

// Vérifier si on est à l'heure préférée de l'utilisateur (±1h)
const isUserNotifHour = (notifHour) => {
  if (!notifHour) return true; // pas d'heure définie → toujours envoyer
  const now = new Date();
  const currentHour = now.getHours();
  const preferredHour = parseInt(notifHour.split(':')[0], 10);
  return Math.abs(currentHour - preferredHour) <= 1;
};

// Vérifier si une notification similaire existe déjà aujourd'hui
const notifExistsToday = async (userId, type) => {
  const query = `
    SELECT id FROM notifications
    WHERE user_id = $1 AND type = $2
      AND DATE(created_at) = CURRENT_DATE
    LIMIT 1
  `;
  const result = await pool.query(query, [userId, type]);
  return result.rows.length > 0;
};

// ============================================
// 1. RAPPEL SESSIONS DEMAIN
// ============================================
const checkSessionReminders = async () => {
  const sessions = await SessionPlanning.findTomorrow();
  if (sessions.length === 0) return;

  console.log(`Cron : ${sessions.length} session(s) demain — envoi des rappels...`);

  for (const session of sessions) {
    if (!isUserNotifHour(session.notif_hour)) continue;

    const dateStr = new Date(session.date_session).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    const heureStr = session.heure_debut
      ? ` à ${session.heure_debut.substring(0, 5)}`
      : '';
    const titre = session.titre || session.type;

    // Notification in-app (pas de doublon)
    const alreadyExists = await notifExistsToday(session.user_id, 'rappel_session');
    if (!alreadyExists) {
      await Notification.create(
        session.user_id,
        `Rappel : Session de révision demain`,
        `Vous avez une session "${titre}" pour ${session.matiere_nom} prévue le ${dateStr}${heureStr}.`,
        'rappel_session'
      );
    }

    // E-mail si activé
    if (session.notif_email) {
      try {
        await sendEmail({
          to: session.email,
          subject: `Rappel : Session de révision demain — ${session.matiere_nom}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3B82F6, #6366F1); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Rappel de révision</h1>
              </div>
              <p style="color: #374151; font-size: 16px;">Bonjour <strong>${session.full_name}</strong></p>
              <p style="color: #374151; font-size: 15px;">Vous avez une session de révision planifiée pour demain :</p>
              <div style="background: #F3F4F6; border-left: 4px solid #3B82F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1F2937;"><strong>Matiere :</strong> ${session.matiere_nom}</p>
                <p style="margin: 8px 0 0; color: #1F2937;"><strong>Session :</strong> ${titre}</p>
                <p style="margin: 8px 0 0; color: #1F2937;"><strong>Date :</strong> ${dateStr}${heureStr}</p>
                <p style="margin: 8px 0 0; color: #1F2937;"><strong>Duree :</strong> ${session.duree_minutes} minutes</p>
              </div>
              <p style="color: #6B7280; font-size: 14px;">Bonne revision !</p>
              <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px; text-align: center;">AI Study Assistant</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error(`Erreur email rappel session user ${session.user_id}:`, emailErr.message);
      }
    }
  }
};

// ============================================
// 2. RAPPELS EXAMENS (3 jours et 1 jour avant)
// ============================================
const checkExamReminders = async () => {
  // Examens dans les 3 prochains jours
  const exams3Days = await Matiere.findUpcomingExams(3);

  for (const exam of exams3Days) {
    if (!isUserNotifHour(exam.notif_hour)) continue;

    const examDate = new Date(exam.date_examen);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

    // Déterminer le type de notif pour éviter les doublons
    const notifType = daysLeft <= 1 ? 'rappel_exam_1j' : 'rappel_exam_3j';

    // Pas de doublon
    const alreadyExists = await notifExistsToday(exam.user_id, notifType);
    if (alreadyExists) continue;

    const dateStr = examDate.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const urgency = daysLeft <= 1 ? 'Urgent' : 'Attention';
    const label = daysLeft <= 1 ? 'demain' : `dans ${daysLeft} jours`;

    // Notification in-app
    await Notification.create(
      exam.user_id,
      `Examen ${label} : ${exam.nom}`,
      `Votre examen de "${exam.nom}" est prévu le ${dateStr}. Préparez-vous !`,
      notifType
    );

    // E-mail si activé
    if (exam.notif_email) {
      try {
        await sendEmail({
          to: exam.email,
          subject: `Examen ${label} : ${exam.nom}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, ${daysLeft <= 1 ? '#EF4444, #DC2626' : '#F59E0B, #D97706'}); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Rappel d'examen</h1>
              </div>
              <p style="color: #374151; font-size: 16px;">Bonjour <strong>${exam.full_name}</strong></p>
              <p style="color: #374151; font-size: 15px;">Votre examen est prévu <strong>${label}</strong> :</p>
              <div style="background: #F3F4F6; border-left: 4px solid ${daysLeft <= 1 ? '#EF4444' : '#F59E0B'}; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1F2937;"><strong>Matiere :</strong> ${exam.nom}</p>
                <p style="margin: 8px 0 0; color: #1F2937;"><strong>Date :</strong> ${dateStr}</p>
                <p style="margin: 8px 0 0; color: #1F2937;"><strong>Temps restant :</strong> ${daysLeft} jour${daysLeft > 1 ? 's' : ''}</p>
              </div>
              <p style="color: #374151; font-size: 15px;">Courage pour vos revisions !</p>
              <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px; text-align: center;">AI Study Assistant</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error(`Erreur email examen user ${exam.user_id}:`, emailErr.message);
      }
    }
  }
};

// ============================================
// ORCHESTRATION
// ============================================
const checkAndSendReminders = async () => {
  try {
    await checkSessionReminders();
    await checkExamReminders();
  } catch (err) {
    console.error('Erreur cron:', err);
  }
};

const startCronService = () => {
  const intervalMs = 60 * 60 * 1000;
  setInterval(checkAndSendReminders, intervalMs);
  console.log('Cron service démarré (vérification toutes les heures)');
};

module.exports = { startCronService, checkAndSendReminders };
