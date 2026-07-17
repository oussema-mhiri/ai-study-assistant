// backend/test-models.js
const dotenv = require('dotenv');
dotenv.config();

const pool = require('./src/config/db');
const Matiere = require('./src/models/Matiere');
const Document = require('./src/models/Document');
const Quiz = require('./src/models/Quiz');
const Question = require('./src/models/Question');

// ⚠️ REMPLACEZ CET ID PAR UN ID VALIDE DE VOTRE TABLE "users"
// Récupérez un ID depuis pgAdmin (ex: SELECT id FROM users LIMIT 1;)
const TEST_USER_ID = 1; // ← CHANGEZ ICI

async function runTests() {
  console.log('🧪 Début des tests des modèles...\n');

  try {
    // 1. Tester la connexion à la base
    console.log('✅ Connexion à PostgreSQL établie');

    // 2. Tester la création d'une matière
    console.log('📚 Création d\'une matière de test...');
    const matiere = await Matiere.create(
      'Intelligence Artificielle - Test',
      'Cours sur l\'IA généré automatiquement',
      TEST_USER_ID
    );
    console.log('   ✅ Matière créée :', matiere.nom, '(ID:', matiere.id, ')');

    // 3. Tester la récupération des matières
    console.log('📚 Récupération des matières...');
    const matieres = await Matiere.findAllByUser(TEST_USER_ID);
    console.log(`   ✅ ${matieres.length} matière(s) trouvée(s)`);

    // 4. Tester la création d'un document
    console.log('📄 Création d\'un document de test...');
    const doc = await Document.create(
      'cours_ia_test.pdf',
      'pdf',
      '/uploads/fake/path.pdf',
      matiere.id,
      TEST_USER_ID
    );
    console.log('   ✅ Document créé :', doc.nom_fichier, '(ID:', doc.id, ')');

    // 5. Tester la récupération des documents par matière
    console.log('📄 Récupération des documents de la matière...');
    const docs = await Document.findAllBySubject(matiere.id, TEST_USER_ID);
    console.log(`   ✅ ${docs.length} document(s) trouvé(s)`);

    // 6. Tester la création d'un quiz
    console.log('❓ Création d\'un quiz de test...');
    const quiz = await Quiz.create(
      'Quiz IA - Chapitre 1',
      'Moyen',
      matiere.id,
      TEST_USER_ID
    );
    console.log('   ✅ Quiz créé :', quiz.titre, '(ID:', quiz.id, ')');

    // 7. Tester l'ajout de questions
    console.log('❓ Ajout de questions au quiz...');
    const questions = await Question.createMultiple([
      {
        contenu: 'Qu\'est-ce que l\'Intelligence Artificielle ?',
        type: 'ouverte',
        bonneReponse: 'Simulation de l\'intelligence humaine par des machines',
        options: null
      },
      {
        contenu: 'L\'IA est une technologie récente (moins de 10 ans).',
        type: 'vrai_faux',
        bonneReponse: 'faux',
        options: null
      },
      {
        contenu: 'Quel est le langage le plus utilisé en IA ?',
        type: 'qcm',
        bonneReponse: 'Python',
        options: ['Python', 'Java', 'C++', 'JavaScript']
      }
    ], quiz.id);
    console.log(`   ✅ ${questions.length} question(s) ajoutée(s)`);

    // 8. Tester la récupération des questions
    console.log('❓ Récupération des questions du quiz...');
    const fetchedQuestions = await Question.findByQuizId(quiz.id);
    console.log(`   ✅ ${fetchedQuestions.length} question(s) trouvée(s)`);
    fetchedQuestions.forEach((q, i) => {
      console.log(`      ${i+1}. ${q.contenu.substring(0, 30)}... (${q.type})`);
    });

    // 9. (Optionnel) Nettoyer les données de test
    console.log('\n🧹 Nettoyage des données de test...');
    await Question.deleteByQuizId(quiz.id);
    await Quiz.delete(quiz.id, TEST_USER_ID);
    await Document.delete(doc.id, TEST_USER_ID);
    await Matiere.delete(matiere.id, TEST_USER_ID);
    console.log('   ✅ Nettoyage terminé');

    console.log('\n🎉 Tous les tests sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests :', error.message);
    console.error(error.stack);
  } finally {
    // Fermer la connexion à la base
    await pool.end();
    console.log('🔒 Connexion à la base fermée');
  }
}

runTests();