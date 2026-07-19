const { analyzeDocument } = require('../services/analysisService');
const Document = require('../models/Document');
const Resume = require('../models/Resume');

exports.analyzeDocument = async (req, res) => {
  try {
    const { documentId } = req.body;
    if (!documentId) {
      return res.status(400).json({ message: 'documentId requis' });
    }

    const result = await analyzeDocument(documentId, req.userId);
    res.json(result);
  } catch (error) {
    console.error('Erreur analyse:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de l\'analyse' });
  }
};

exports.getAnalysis = async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!documentId) {
      return res.status(400).json({ message: 'documentId requis' });
    }

    const doc = await Document.findById(parseInt(documentId), req.userId);
    if (!doc) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    const resumes = await Resume.findByDocumentId(parseInt(documentId));

    const court = resumes.find(r => r.type === 'court');
    const detaille = resumes.find(r => r.type === 'detaillé');
    const pointsCles = resumes.find(r => r.type === 'points_cles');
    const definitions = resumes.find(r => r.type === 'definitions');

    if (!court && !detaille) {
      return res.status(404).json({ message: 'Aucune analyse trouvée pour ce document' });
    }

    res.json({
      summaryShort: court?.contenu || '',
      summaryLong: detaille?.contenu || '',
      keyPoints: pointsCles ? JSON.parse(pointsCles.contenu) : [],
      definitions: definitions ? JSON.parse(definitions.contenu) : [],
    });
  } catch (error) {
    console.error('Erreur récupération analyse:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de la récupération' });
  }
};