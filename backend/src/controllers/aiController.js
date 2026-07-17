const { analyzeDocument } = require('../services/analysisService');

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