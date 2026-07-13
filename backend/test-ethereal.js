// backend/test-ethereal.js
const nodemailer = require('nodemailer');

(async () => {
  // Créer un compte Ethereal de test (fourni par nodemailer)
  const testAccount = await nodemailer.createTestAccount();
  console.log('📧 Compte Ethereal créé :');
  console.log(`   Email : ${testAccount.user}`);
  console.log(`   Mot de passe : ${testAccount.pass}`);
  console.log(`   Consulter les emails : ${nodemailer.getTestMessageUrl(testAccount)}`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Envoyer un email de test
  const info = await transporter.sendMail({
    from: '"AI Study Assistant" <test@ethereal.email>',
    to: 'test@example.com',
    subject: 'Test Ethereal',
    text: 'Email envoyé depuis Ethereal !',
    html: '<p>Email envoyé depuis Ethereal !</p>',
  });

  console.log('✅ Email envoyé ! ID:', info.messageId);
  console.log('📬 Voir l\'email :', nodemailer.getTestMessageUrl(info));
})();