const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

// --- Test ---
async function testGemini() {
  const result = await model.generateContent('Dis-moi bonjour en français.');
  return result.response.text();
}

// --- Résumé ---
async function generateSummary(text, type = 'court') {
  const prompt = `
    Tu es un assistant pédagogique. Résume le texte suivant de manière ${type === 'court' ? 'concise en 2-3 phrases' : 'détaillée en 5-6 phrases'}.

    Texte à résumer :
    ${text}

    Résumé :
  `;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// --- Points clés ---
async function extractKeyPoints(text) {
  const prompt = `
    Extrais les 5 points les plus importants de ce texte sous forme de liste à puces.

    Texte :
    ${text}

    Points clés :
  `;
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  console.log('Réponse brute des points clés :', raw); // <-- LOG

  // Tente de parser même sans puces
  const lines = raw.split('\n').filter(line => line.trim().length > 0);
  // Si la première ligne ressemble à une liste (commence par - ou •), on les prend
  const hasBullets = lines.some(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
  if (hasBullets) {
    return lines
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .map(p => p.replace(/^[•\-]\s*/, '').trim());
  } else {
    // Sinon, on prend toutes les lignes non vides
    return lines.map(line => line.trim());
  }
}
// --- Définitions ---
async function extractDefinitions(text) {
  const prompt = `
    Identifie les termes clés et leurs définitions dans ce texte.
    Retourne les réponses sous forme de liste JSON valide : [{"terme": "...", "definition": "..."}]

    Texte :
    ${text}
  `;
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  try {
    return JSON.parse(raw);
  } catch {
    const lines = raw.split('\n').filter(l => l.includes(':'));
    return lines.map(line => {
      const [terme, ...defParts] = line.split(':');
      return { terme: terme.trim(), definition: defParts.join(':').trim() };
    });
  }
}

// --- Analyse d'image ---
async function analyzeImage(imageBase64, prompt) {
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: 'image/png',
        data: imageBase64.split(',')[1] || imageBase64,
      }
    }
  ]);
  return result.response.text();
}

// --- Chatbot ---
async function chatWithContext(question, context) {
  const prompt = `
    Tu es un assistant pédagogique. Utilise uniquement le contexte ci-dessous pour répondre.

    ### Contexte :
    ${context}

    ### Question :
    ${question}

    ### Réponse :
  `;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
// backend/src/services/geminiService.js
// backend/src/services/geminiService.js
async function generateQuizFromText(text, numQuestions = 5, difficulty = 'Moyen') {
  const prompt = `
    Tu es un professeur. Génère un quiz de ${numQuestions} questions basé sur le texte suivant.
    La difficulté est : ${difficulty}.

    Mélange les types de questions : environ 60% de QCM et 40% de Vrai/Faux.

    Pour les QCM : chaque question doit avoir 4 propositions (A, B, C, D) avec une seule réponse correcte.
    La réponse correcte doit être UNIQUEMENT la lettre (A, B, C ou D).

    Pour les Vrai/Faux : la réponse correcte est "A" pour Vrai, "B" pour Faux.

    Retourne les questions au format JSON suivant :
    [
      {
        "question": "Texte de la question",
        "type": "qcm",
        "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
        "correctAnswer": "A"
      },
      {
        "question": "Texte de l'affirmation à valider",
        "type": "true_false",
        "options": ["A) Vrai", "B) Faux"],
        "correctAnswer": "A"
      }
    ]

    Texte :
    ${text}

    Réponse (uniquement le JSON) :
  `;
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    let questions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);

    questions = questions.map(q => {
      // Normaliser le type
      if (q.type !== 'qcm' && q.type !== 'true_false') {
        q.type = 'qcm';
      }
      // Pour les Vrai/Faux, forcer les options si absentes
      if (q.type === 'true_false' && (!q.options || q.options.length < 2)) {
        q.options = ['A) Vrai', 'B) Faux'];
      }
      // Nettoyer correctAnswer
      if (typeof q.correctAnswer === 'string') {
        const match = q.correctAnswer.match(/[A-D]/i);
        if (match) {
          q.correctAnswer = match[0].toUpperCase();
        } else {
          q.correctAnswer = 'A';
        }
      }
      return q;
    });

    return questions;
  } catch (error) {
    console.error('Erreur parsing JSON du quiz:', error);
    throw new Error('Impossible de générer le quiz');
  }
}
async function generateExercisesFromText(text, numExercises = 3, difficulty = 'Moyen') {
  const prompt = `
    Tu es un professeur. Génère ${numExercises} exercices pédagogiques basés sur le texte suivant.
    Le niveau de difficulté est : ${difficulty}.

    Mélange les types d'exercices de manière variée : QCM, Vrai/Faux, questions ouvertes, exercices à trous.
    Répartis les types de manière équilibrée.

    Types possibles :
    - "qcm" : question à choix multiples avec 4 options (A, B, C, D). correctAnswer = lettre (A/B/C/D).
    - "true_false" : affirmation à valider. options = ["A) Vrai", "B) Faux"]. correctAnswer = "A" ou "B".
    - "ouverte" : question nécessitant une réponse rédigée. correctAnswer = la réponse complète.
    - "fill_in_blank" : phrase avec un ou plusieurs trous (marqués par ___). correctAnswer = le mot ou terme manquant.

    Retourne les exercices au format JSON suivant :
    [
      {
        "question": "Texte de l'exercice",
        "type": "qcm",
        "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
        "correctAnswer": "A"
      },
      {
        "question": "Affirmation à valider",
        "type": "true_false",
        "options": ["A) Vrai", "B) Faux"],
        "correctAnswer": "B"
      },
      {
        "question": "Question ouverte",
        "type": "ouverte",
        "correctAnswer": "Réponse complète"
      },
      {
        "question": "Le protocole ___ est utilisé pour le transport fiable des données.",
        "type": "fill_in_blank",
        "correctAnswer": "TCP"
      }
    ]

    Texte :
    ${text}

    Réponse (uniquement le JSON) :
  `;
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    let exercises = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);

    // Normaliser les types
    exercises = exercises.map(ex => {
      if (!['qcm', 'true_false', 'ouverte', 'fill_in_blank'].includes(ex.type)) {
        ex.type = 'ouverte';
      }
      // Vrai/Faux : forcer les options
      if (ex.type === 'true_false' && (!ex.options || ex.options.length < 2)) {
        ex.options = ['A) Vrai', 'B) Faux'];
      }
      return ex;
    });

    return exercises;
  } catch (error) {
    console.error('Erreur parsing JSON des exercices:', error);
    throw new Error('Impossible de générer les exercices');
  }
}
async function checkExerciseAnswers(exercises, userAnswers) {
  const prompt = `
    Tu es un professeur qui corrige des exercices.
    Pour chaque exercice, vérifie si la réponse de l'étudiant est correcte.
    - Pour les QCM, la réponse doit correspondre exactement à la lettre de la bonne réponse.
    - Pour les Vrai/Faux, la réponse doit correspondre à la lettre (A=Vrai, B=Faux).
    - Pour les questions ouvertes, utilise ton jugement pour déterminer si la réponse est correcte ou non.
    - Pour les exercices à trous (fill_in_blank), vérifie si le mot proposé correspond à la bonne réponse (insensible à la casse, accepte les synonymes proches).

    Réponds UNIQUEMENT par un tableau JSON valide, rien d'autre :
    [
      {
        "isCorrect": true ou false,
        "feedback": "Explication courte (en français)"
      }
    ]

    Exercices et réponses à corriger :
    ${JSON.stringify(exercises.map((ex, i) => ({
      question: ex.question,
      type: ex.type,
      correctAnswer: ex.correctAnswer,
      userAnswer: userAnswers[i]
    })), null, 2)}
  `;
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
    return parsed;
  } catch (error) {
    console.error('Erreur parsing JSON correction:', error);
    return exercises.map((ex, i) => {
      const userAns = String(userAnswers[i] || '').trim();
      if (ex.type === 'qcm' || ex.type === 'true_false') {
        const correctLetter = ex.correctAnswer?.charAt(0)?.toUpperCase();
        const userLetter = userAns.charAt(0).toUpperCase();
        return {
          isCorrect: correctLetter === userLetter,
          feedback: correctLetter === userLetter ? 'Bonne réponse !' : `La bonne réponse était ${ex.correctAnswer}`
        };
      }
      if (ex.type === 'fill_in_blank') {
        const isCorrect = userAns.toLowerCase() === String(ex.correctAnswer).toLowerCase().trim();
        return {
          isCorrect,
          feedback: isCorrect ? 'Bonne réponse !' : `La bonne réponse était : ${ex.correctAnswer}`
        };
      }
      return {
        isCorrect: false,
        feedback: `La bonne réponse est : ${ex.correctAnswer}`
      };
    });
  }
}

// --- Vrai/Faux pur ---
async function generateTrueFalseFromText(text, numQuestions = 5, difficulty = 'Moyen') {
  const prompt = `
    Tu es un professeur. Génère un quiz de ${numQuestions} questions VRAI ou FAUX basé sur le texte suivant.
    La difficulté est : ${difficulty}.

    Chaque question est une affirmation que l'étudiant doit juger vraie ou fausse.
    La réponse correcte est "A" pour Vrai, "B" pour Faux.
    Les affirmations doivent être claires, sans ambiguïté.
    Varie les affirmations : environ 50% vraies et 50% fausses.

    Retourne les questions au format JSON suivant :
    [
      {
        "question": "Affirmation à juger vraie ou fausse",
        "type": "true_false",
        "options": ["A) Vrai", "B) Faux"],
        "correctAnswer": "A"
      }
    ]

    Texte :
    ${text}

    Réponse (uniquement le JSON) :
  `;
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    let questions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);

    questions = questions.map(q => {
      q.type = 'true_false';
      if (!q.options || q.options.length < 2) {
        q.options = ['A) Vrai', 'B) Faux'];
      }
      if (typeof q.correctAnswer === 'string') {
        const match = q.correctAnswer.match(/[A-B]/i);
        q.correctAnswer = match ? match[0].toUpperCase() : 'A';
      } else {
        q.correctAnswer = 'A';
      }
      return q;
    });

    return questions;
  } catch (error) {
    console.error('Erreur parsing JSON vrai/faux:', error);
    throw new Error('Impossible de générer les questions vrai/faux');
  }
}

// --- Flashcards ---
async function generateFlashcardsFromText(text, numCards = 10) {
  const prompt = `
    Tu es un professeur. Génère ${numCards} flashcards de révision basées sur le texte suivant.
    Chaque flashcard a un recto (question ou concept) et un verso (réponse ou explication).

    Catégories possibles : "definition", "concept", "formule", "exemple"

    Retourne les flashcards au format JSON suivant :
    [
      {
        "recto": "Question ou concept à retenir",
        "verso": "Réponse ou explication détaillée",
        "categorie": "definition"
      }
    ]

    Règles :
    - Le recto doit être une question claire et concise
    - Le verso doit être une réponse complète et pédagogique
    - Varie les catégories (definitions, concepts, formules, exemples)
    - Le contenu doit être basé UNIQUEMENT sur le texte fourni

    Texte :
    ${text}

    Réponse (uniquement le JSON) :
  `;
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    let cards = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);

    // Normaliser les catégories
    const validCategories = ['definition', 'concept', 'formule', 'exemple'];
    cards = cards.map(card => {
      if (!validCategories.includes(card.categorie)) {
        card.categorie = 'concept';
      }
      return card;
    });

    return cards;
  } catch (error) {
    console.error('Erreur parsing JSON flashcards:', error);
    throw new Error('Impossible de générer les flashcards');
  }
}

async function checkExerciseAnswer(question, userAnswer, correctAnswer) {
  const prompt = `
    Tu es un professeur. Voici un exercice, la réponse correcte, et la réponse proposée par l'étudiant.
    Détermine si la réponse de l'étudiant est correcte (ou suffisamment proche) et renvoie un objet JSON avec les champs :
    - isCorrect: boolean (true si la réponse est correcte, false sinon)
    - feedback: string (un retour court pour l'étudiant, expliquant pourquoi c'est juste ou faux)
    - correctAnswer: string (réponse correcte, au cas où l'étudiant voudrait la voir)

    Exercice: ${question}
    Réponse correcte: ${correctAnswer}
    Réponse de l'étudiant: ${userAnswer}

    Réponse (uniquement le JSON) :
  `;
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  try {
    const json = JSON.parse(raw);
    return json;
  } catch (error) {
    console.error('Erreur parsing JSON de vérification:', error);
    return {
      isCorrect: false,
      feedback: "Erreur lors de la vérification, veuillez réessayer.",
      correctAnswer: correctAnswer
    };
  }
}
// --- Chatbot en Streaming ---
async function chatWithContextStream(question, context, history = [], imageBase64 = null) {
  const formattedHistory = history.length > 0
    ? history.map(msg => `${msg.sender === 'user' ? 'Étudiant' : 'IA'}: ${msg.content}`).join('\n')
    : 'Aucun historique.';

  const prompt = `
Tu es un assistant pédagogique universitaire spécialisé dans l'accompagnement des étudiants.

### Instructions :
1. **Priorité aux documents** : Réponds d'abord en te basant sur les documents fournis ci-dessous. Cite les sources (noms de fichiers, concepts) quand c'est possible.

2. **Connaissances générales** : Si l'information ne se trouve pas clairement dans les documents, tu peux utiliser tes connaissances générales sur le sujet pour compléter ta réponse, tout en précisant : "Cette information ne figure pas dans vos documents, mais d'après mes connaissances..."

3. **Questions générales sur la matière** : L'étudiant peut te poser des questions sur des concepts généraux de la matière, pas uniquement sur le contenu exact des documents. Dans ce cas, réponds normalement en t'appuyant sur tes connaissances.

4. **Refus uniquement si hors-sujet** : Refuse de répondre uniquement si la question est complètement étrangère au domaine d'étude de la matière.

5. **Ton** : Sois pédagogique, clair, et encourageant. Utilise des exemples quand c'est utile.

### Contexte (Documents du cours) :
${context || 'Aucun document n\'a été importé pour cette matière.'}

### Historique de la conversation :
${formattedHistory}

### Question de l'étudiant :
${question}

### Réponse :
`;

  const contents = [];
  if (imageBase64) {
    // Si l'image contient l'en-tête data:image/png;base64, on l'extrait
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+-\.]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    
    contents.push({
      inlineData: {
        mimeType,
        data: base64Data
      }
    });
  }
  contents.push(prompt);

  const result = await model.generateContentStream(contents);
  return result.stream;
}

// --- Recommandation de ressources ---
async function recommendResources(text, matiereName) {
  const prompt = `
    Tu es un assistant pédagogique. En te basant sur le contenu du cours de "${matiereName}" ci-dessous, recommande 6 à 8 ressources externes utiles pour l'étudiant.

    Types de ressources à recommander (mélange varié) :
    - Vidéos YouTube éducatives (avec des URLs réelles du domaine youtube.com ou youtube.fr)
    - Cours en ligne (Coursera, edX, Khan Academy, OpenClassrooms, etc.)
    - Articles académiques ou tutoriels
    - Exercices interactifs ou quiz en ligne

    Pour chaque ressource, fournis :
    - titre : titre clair et descriptif
    - type : "video" | "cours" | "article" | "exercice"
    - url : une URL réaliste et plausible (format youtube.com/watch?v=... ou coursera.org/... etc.)
    - description : description courte (1-2 phrases) expliquant en quoi cette ressource est utile
    - source : la plateforme d'origine (YouTube, Coursera, Khan Academy, etc.)

    Retourne UNIQUEMENT un JSON valide, rien d'autre :
    [
      {
        "titre": "...",
        "type": "video",
        "url": "https://www.youtube.com/watch?v=...",
        "description": "...",
        "source": "YouTube"
      }
    ]

    Texte du cours :
    ${text.substring(0, 6000)}

    Réponse (uniquement le JSON) :
  `;
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    let resources = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
    const validTypes = ['video', 'cours', 'article', 'exercice'];
    resources = resources.map(r => ({
      titre: r.titre || 'Ressource',
      type: validTypes.includes(r.type) ? r.type : 'article',
      url: r.url || '#',
      description: r.description || '',
      source: r.source || 'Web',
    }));
    return resources;
  } catch (error) {
    console.error('Erreur parsing JSON ressources:', error);
    return [];
  }
}

module.exports = {
  testGemini,
  generateSummary,
  extractKeyPoints,
  extractDefinitions,
  analyzeImage,
  chatWithContext,
  chatWithContextStream,
  generateQuizFromText,
  generateTrueFalseFromText,
  generateExercisesFromText,
  generateFlashcardsFromText,
  checkExerciseAnswers,
  recommendResources,
};