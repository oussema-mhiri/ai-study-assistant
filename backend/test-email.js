// backend/test-email.js
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '✅ défini' : '❌ manquant');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

transporter.sendMail({
  to: process.env.EMAIL_USER, // s'envoie à soi-même
  subject: 'Test nodemailer',
  text: 'Ceci est un test de connexion Gmail',
})
.then(info => console.log('✅ Email envoyé !', info.response))
.catch(err => console.error('❌ Erreur détaillée :', err));