const Matiere = require('../models/Matiere');
const { extractTextFromFile } = require('../services/extractService');
const { recommendResources } = require('../services/geminiService');
const pool = require('../config/db');
const path = require('path');

const getRecommendations = async (req, res) => {
  try {
    const userId = req.userId;
    const { matiereId } = req.params;

    const matiere = await Matiere.findById(matiereId, userId);
    if (!matiere) return res.status(404).json({ error: 'Matiere introuvable' });

    const docsRes = await pool.query(
      'SELECT id, nom_fichier, type, url FROM documents WHERE matiere_id = $1 AND user_id = $2 ORDER BY uploaded_at DESC',
      [matiereId, userId]
    );
    const documents = docsRes.rows;
    if (documents.length === 0) {
      return res.json({ resources: [], message: 'Aucun document importe pour cette matiere.' });
    }

    let combinedText = '';
    for (const doc of documents) {
      try {
        const filePath = path.isAbsolute(doc.url) ? doc.url : path.join(process.cwd(), doc.url);
        const text = await extractTextFromFile(filePath, doc.type);
        if (text) combinedText += text + '\n\n';
      } catch (e) {
        console.error(`Erreur extraction fichier ${doc.nom_fichier}:`, e.message);
      }
    }

    if (!combinedText.trim()) {
      return res.json({ resources: [], message: 'Impossible d\'extraire le texte des documents.' });
    }

    const resources = await recommendResources(combinedText, matiere.nom);
    res.json({ resources });
  } catch (err) {
    console.error('Erreur getRecommendations:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { getRecommendations };
