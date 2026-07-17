const Matiere = require('../models/Matiere');

// Récupérer toutes les matières de l'utilisateur
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Matiere.findAllByUser(req.userId);
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Créer une nouvelle matière
exports.createSubject = async (req, res) => {
  try {
    const { nom, description } = req.body;
    if (!nom) return res.status(400).json({ message: 'Le nom est requis' });
    const newSubject = await Matiere.create(nom, description, req.userId);
    res.status(201).json(newSubject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une matière
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Matiere.delete(id, req.userId);
    if (!deleted) return res.status(404).json({ message: 'Matière non trouvée' });
    res.json({ message: 'Matière supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une matière
exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description } = req.body;
    const updated = await Matiere.update(id, req.userId, { nom, description });
    if (!updated) return res.status(404).json({ message: 'Matière non trouvée' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};