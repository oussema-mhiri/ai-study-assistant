const express = require('express');
const { upload, uploadDocument, getDocumentsBySubject, deleteDocument } = require('../controllers/documentController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, upload, uploadDocument);
router.get('/:matiereId', auth, getDocumentsBySubject);
router.delete('/:id', auth, deleteDocument);

module.exports = router;