// backend/test-gmail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('📧 Test de connexion Gmail');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

transporter.sendMail({
  from: `"AI Study Assistant" <${process.env.EMAIL_USER}>`,
  to: 'oussemamhiri963@gmail.com',   // ← Ton adresse principale
  subject: 'Test Gmail - Connexion',
  text: 'Ceci est un test direct depuis Node.js',
  html: '<p><b>Test direct</b> depuis Node.js</p>',
})
.then(info => {
  console.log('✅ Succès ! Email envoyé.');
  console.log(`   Message ID : ${info.messageId}`);
  console.log(`   Réponse SMTP : ${info.response}`);
})
.catch(err => {
  console.error('❌ Erreur :', err.message);
  console.error('   Code :', err.code);
  console.error('   Réponse :', err.response);
});