const nodemailer = require('nodemailer');

// Cache pour réutiliser le même transporteur (Ethereal en dev, Gmail en prod)
let cachedTransporter = null;
let cachedAccount = null;
let isEthereal = false;

const getTransporter = async () => {
  // Si le transporteur est déjà en cache, le réutiliser
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // Choix selon l'environnement
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // --- MODE PRODUCTION : Gmail (SMTP) ---
    console.log('Utilisation de Gmail (production)');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
    cachedTransporter = transporter;
    return transporter;
  } else {
    // --- MODE DÉVELOPPEMENT : Ethereal ---
    console.log('Création d\'un compte Ethereal (développement)');
    const testAccount = await nodemailer.createTestAccount();
    cachedAccount = testAccount;
    isEthereal = true;

    console.log(`   Email : ${testAccount.user}`);
    console.log(`   Mot de passe : ${testAccount.pass}`);
    console.log(`   Consulter les emails : ${testAccount.web}`);

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    cachedTransporter = transporter;
    return transporter;
  }
};

exports.sendResetCodeEmail = async (toEmail, code) => {
  try {
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
      from: `"AI Study Assistant" <${isEthereal ? cachedAccount.user : process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Code de réinitialisation de mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px;">
          <h2 style="color: #2563EB;">AI Study Assistant</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Voici votre code de vérification :</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #F0F4FF; padding: 16px 24px; border-radius: 12px; text-align: center; margin: 16px 0;">
            ${code}
          </div>
          <p style="color: #6b7280; font-size: 13px;">Ce code est valable 5 minutes.</p>
          <p style="color: #6b7280; font-size: 13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    });

    // En mode développement, afficher le lien de visualisation Ethereal
    if (isEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`Lien de visualisation : ${previewUrl}`);
    }

    console.log(`Email envoyé à ${toEmail} : ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Erreur sendResetCodeEmail:', error);
    throw error;
  }
};

// Email générique (pour cron, rappels, etc.)
exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"AI Study Assistant" <${isEthereal ? cachedAccount.user : process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    if (isEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`Rappel email visualisable : ${previewUrl}`);
    }

    console.log(`Email envoyé à ${to} : ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Erreur sendEmail:', error);
    throw error;
  }
};