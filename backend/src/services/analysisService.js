const fs = require('fs');
const Document = require('../models/Document');
const Resume = require('../models/Resume');
const { extractTextFromFile } = require('./extractService');
const { generateSummary, extractKeyPoints, extractDefinitions, analyzeImage } = require('./geminiService');

async function analyzeDocument(documentId, userId) {
  const doc = await Document.findById(documentId, userId);
  if (!doc) throw new Error('Document non trouvé');

  let content = await extractTextFromFile(doc.url, doc.type);

  if (content === null && doc.type.startsWith('image/')) {
    const imageBuffer = fs.readFileSync(doc.url);
    const imageBase64 = imageBuffer.toString('base64');
    const prompt = `
      Décris le contenu de cette image en détail.
      Si elle contient du texte, transcris-le fidèlement.
      Si c'est un schéma, un graphique ou une formule, explique-le clairement.
      Le but est de pouvoir en faire un résumé pédagogique.
    `;
    content = await analyzeImage(imageBase64, prompt);
  }

  if (!content) throw new Error('Impossible d\'extraire du contenu de ce fichier');

  const [summaryShort, summaryLong, keyPoints, definitions] = await Promise.all([
    generateSummary(content, 'court'),
    generateSummary(content, 'detaillé'),
    extractKeyPoints(content),
    extractDefinitions(content)
  ]);

  await Resume.create('court', summaryShort, documentId);
  await Resume.create('detaillé', summaryLong, documentId);

  return { summaryShort, summaryLong, keyPoints, definitions };
}

module.exports = { analyzeDocument };