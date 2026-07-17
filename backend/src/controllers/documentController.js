const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');

// Configuration de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['pdf', 'docx', 'pptx', 'jpg', 'png', 'jpeg'];
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 Mo
  fileFilter,
});

exports.upload = upload.single('file');

// Upload d'un document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier téléchargé' });
    }
    const { matiereId } = req.body;
    if (!matiereId) {
      return res.status(400).json({ message: 'Matière requise' });
    }

    const newDoc = await Document.create(
      req.file.originalname,
      req.file.mimetype,
      req.file.path,
      parseInt(matiereId),
      req.userId
    );

    res.status(201).json(newDoc);
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload' });
  }
};

// Récupérer les documents d'une matière
exports.getDocumentsBySubject = async (req, res) => {
  try {
    const { matiereId } = req.params;
    const docs = await Document.findAllBySubject(parseInt(matiereId), req.userId);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un document
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Document.delete(parseInt(id), req.userId);
    if (!deleted) return res.status(404).json({ message: 'Document non trouvé' });
    res.json({ message: 'Document supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};