const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Document = require('../models/Document');
const Resume = require('../models/Resume');
const { extractTextFromFile } = require('../services/extractService');
const { chatWithContextStream } = require('../services/geminiService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Récupérer toutes les conversations d'une matière pour l'utilisateur connecté
exports.getConversations = async (req, res) => {
  try {
    const { matiereId } = req.params;
    if (!matiereId) {
      return res.status(400).json({ message: 'matiereId requis' });
    }
    const conversations = await Conversation.findByUserAndSubject(req.userId, parseInt(matiereId));
    res.json(conversations);
  } catch (error) {
    console.error('Erreur getConversations:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des conversations' });
  }
};

// Créer une nouvelle conversation
exports.createConversation = async (req, res) => {
  try {
    const { matiereId, titre, documentId } = req.body;
    if (!matiereId) {
      return res.status(400).json({ message: 'matiereId requis' });
    }
    const titleVal = titre || `Discussion du ${new Date().toLocaleDateString('fr-FR')}`;
    const newConv = await Conversation.create(
      req.userId, 
      parseInt(matiereId), 
      titleVal, 
      documentId ? parseInt(documentId) : null
    );
    res.status(201).json(newConv);
  } catch (error) {
    console.error('Erreur createConversation:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la conversation' });
  }
};

// Récupérer tous les messages d'une conversation
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(parseInt(id), req.userId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée ou accès refusé' });
    }
    const messages = await Message.findByConversationId(parseInt(id));
    res.json(messages);
  } catch (error) {
    console.error('Erreur getMessages:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
  }
};

// Supprimer une conversation
exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Conversation.delete(parseInt(id), req.userId);
    if (!deleted) {
      return res.status(404).json({ message: 'Conversation non trouvée ou accès refusé' });
    }
    res.json({ message: 'Conversation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur deleteConversation:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la conversation' });
  }
};

// Envoyer un message et obtenir une réponse en streaming (SSE)
exports.chatStream = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, imageBase64 } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message requis' });
    }

    // 1. Récupérer et valider la conversation
    const conversation = await Conversation.findById(parseInt(id), req.userId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée ou accès refusé' });
    }

    // 2. Sauvegarder le message de l'utilisateur
    await Message.create(conversation.id, 'user', message);

    // 3. Récupérer les documents pour le contexte (tous les documents ou uniquement le document sélectionné)
    let docs = [];
    if (conversation.document_id) {
      const singleDoc = await Document.findById(conversation.document_id, req.userId);
      if (singleDoc) {
        docs = [singleDoc];
      }
    } else {
      docs = await Document.findAllBySubject(conversation.matiere_id, req.userId);
    }

    let context = '';

    for (const doc of docs) {
      try {
        let text = '';
        if (doc.type.startsWith('image/')) {
          const resume = await Resume.findByDocumentIdAndType(doc.id, 'detaillé');
          text = resume ? resume.contenu : '';
        } else {
          text = await extractTextFromFile(doc.url, doc.type);
        }
        if (text) {
          context += `--- Document: ${doc.nom_fichier} ---\n${text}\n\n`;
        }
      } catch (err) {
        console.warn(`[Chatbot] Erreur lecture document ${doc.nom_fichier}:`, err);
      }
    }

    // Limiter le contexte à environ 40000 caractères pour ne pas saturer le prompt en version Lite
    if (context.length > 40000) {
      context = context.substring(0, 40000) + '\n... [Texte tronqué pour cause de volume]';
    }

    // 4. Charger l'historique récent de la conversation (10 derniers messages max pour garder la fluidité)
    const allMessages = await Message.findByConversationId(conversation.id);
    // On exclut le tout dernier message utilisateur qu'on vient d'enregistrer pour l'envoyer comme "question"
    const history = allMessages
      .slice(0, -1)
      .slice(-10)
      .map(m => ({ sender: m.sender, content: m.content }));

    // 5. Configurer la réponse HTTP pour Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Envoyer un événement de début de flux
    res.write(`data: ${JSON.stringify({ event: 'start' })}\n\n`);

    // 6. Lancer le flux Gemini
    const stream = await chatWithContextStream(message, context, history, imageBase64);
    let fullResponseText = '';

    for await (const chunk of stream) {
      const chunkText = chunk.text();
      fullResponseText += chunkText;
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    // 7. Enregistrer le message complet de l'IA en base de données
    await Message.create(conversation.id, 'ia', fullResponseText);

    // Mettre à jour la date de modification de la conversation
    const pool = require('../config/db');
    await pool.query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [conversation.id]);

    // Envoyer l'événement de fin de flux
    res.write(`data: ${JSON.stringify({ event: 'done', fullResponse: fullResponseText })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Erreur chatStream:', error);
    // Tenter d'envoyer l'erreur en SSE si la connexion est déjà établie
    if (!res.headersSent) {
      res.status(500).json({ message: 'Erreur serveur lors de la discussion' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Une erreur est survenue' })}\n\n`);
      res.end();
    }
  }
};

// Générer des suggestions intelligentes basées sur les documents de la matière
exports.getSmartSuggestions = async (req, res) => {
  try {
    const { matiereId } = req.params;
    const { documentId } = req.query;
    if (!matiereId) {
      return res.status(400).json({ message: 'matiereId requis' });
    }

    let docs = [];
    if (documentId) {
      const singleDoc = await Document.findById(parseInt(documentId), req.userId);
      if (singleDoc) {
        docs = [singleDoc];
      }
    } else {
      docs = await Document.findAllBySubject(parseInt(matiereId), req.userId);
    }

    if (docs.length === 0) {
      return res.json({
        suggestions: [
          "Quels sont les concepts clés de cette matière ?",
          "Peux-tu me donner des exemples pratiques ?",
          "Aide-moi à organiser mes révisions."
        ]
      });
    }

    // Extraire un échantillon de texte des deux premiers documents pour guider la génération de questions
    let textSample = '';
    for (const doc of docs.slice(0, 2)) {
      try {
        let text = '';
        if (doc.type.startsWith('image/')) {
          const resume = await Resume.findByDocumentIdAndType(doc.id, 'detaillé');
          text = resume ? resume.contenu : '';
        } else {
          text = await extractTextFromFile(doc.url, doc.type);
        }
        if (text) {
          textSample += text + '\n';
        }
      } catch (err) {
        console.warn(`[Suggestions] Erreur lecture ${doc.nom_fichier}:`, err);
      }
    }

    textSample = textSample.substring(0, 3000);

    if (!textSample.trim()) {
      return res.json({
        suggestions: [
          "Quels sont les thèmes principaux abordés dans mes cours ?",
          "Fais-moi un résumé global des documents importés.",
          "Quelles sont les définitions importantes à retenir ?"
        ]
      });
    }

    const prompt = `
Tu es un professeur universitaire de haut niveau.
En te basant sur cet extrait de cours, génère 3 questions courtes, pertinentes et stimulantes qu'un étudiant pourrait poser pour réviser ou approfondir sa compréhension.
Réponds UNIQUEMENT par un tableau JSON valide contenant les questions sous forme de chaînes de caractères, exemple :
["Question 1 ?", "Question 2 ?", "Question 3 ?"]

Extrait de cours :
${textSample}
`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(raw);
      res.json({ suggestions });
    } catch {
      res.json({
        suggestions: [
          "Quels sont les points essentiels à retenir dans ce cours ?",
          "Explique-moi les termes clés décrits dans ces documents.",
          "Peux-tu me proposer un exemple concret d'application ?"
        ]
      });
    }

  } catch (error) {
    console.error('Erreur getSmartSuggestions:', error);
    res.json({
      suggestions: [
        "Quels sont les concepts clés de ce cours ?",
        "Peux-tu résumer les documents de cette matière ?",
        "Propose-moi un quiz rapide sur ce sujet."
      ]
    });
  }
};
