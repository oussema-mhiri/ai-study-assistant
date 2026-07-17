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
  console.log('📌 Réponse brute des points clés :', raw); // <-- LOG

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
    Tu es un professeur. Génère un quiz de ${numQuestions} questions de type QCM (choix multiples) basé sur le texte suivant.
    La difficulté est : ${difficulty}.

    Chaque question doit avoir 4 propositions (A, B, C, D) avec une seule réponse correcte.
    La réponse correcte doit être UNIQUEMENT la lettre (A, B, C ou D), rien d'autre.

    Retourne les questions au format JSON suivant :
    [
      {
        "question": "Texte de la question",
        "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
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
    // Nettoyer la réponse pour extraire le JSON
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    let questions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);

    // Nettoyer chaque question pour garantir que correctAnswer n'est qu'une lettre
    questions = questions.map(q => {
      // Si correctAnswer est une chaîne, extraire le premier caractère alphabétique
      if (typeof q.correctAnswer === 'string') {
        const match = q.correctAnswer.match(/[A-D]/i);
        if (match) {
          q.correctAnswer = match[0].toUpperCase();
        } else {
          // Fallback : si aucune lettre trouvée, on prend la première option
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
module.exports = {
  testGemini,
  generateSummary,
  extractKeyPoints,
  extractDefinitions,
  analyzeImage,
  chatWithContext,
  generateQuizFromText,
};