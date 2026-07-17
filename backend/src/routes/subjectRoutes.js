const express = require('express');
const { getSubjects, createSubject, deleteSubject, updateSubject } = require('../controllers/subjectController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, getSubjects);
router.post('/', auth, createSubject);
router.put('/:id', auth, updateSubject);
router.delete('/:id', auth, deleteSubject);

module.exports = router;