'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Charger toutes les conversations pour une matière donnée
  const fetchConversations = async (subjectId) => {
    if (!subjectId) return;
    setLoadingConversations(true);
    try {
      const res = await api.get(`/chatbot/subjects/${subjectId}/conversations`);
      setConversations(res.data);
      if (res.data.length > 0) {
        // Sélectionner par défaut la conversation la plus récente
        selectConversation(res.data[0]);
      } else {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Erreur fetchConversations:', error);
      toast.error('Impossible de charger les conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  // Charger les messages d'une conversation spécifique
  const selectConversation = async (conv) => {
    setActiveConversation(conv);
    if (!conv) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    setStreamingMessage('');
    try {
      const res = await api.get(`/chatbot/conversations/${conv.id}/messages`);
      setMessages(res.data);
    } catch (error) {
      console.error('Erreur selectConversation:', error);
      toast.error('Impossible de charger les messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Créer une nouvelle session de conversation
  const createNewConversation = async (subjectId, title = '', documentId = null) => {
    try {
      const res = await api.post('/chatbot/conversations', {
        matiereId: subjectId,
        titre: title,
        documentId: documentId
      });
      setConversations(prev => [res.data, ...prev]);
      setActiveConversation(res.data);
      setMessages([]);
      setStreamingMessage('');
      return res.data;
    } catch (error) {
      console.error('Erreur createNewConversation:', error);
      toast.error('Erreur lors de la création de la discussion');
    }
  };

  // Supprimer une conversation
  const deleteConversation = async (convId) => {
    try {
      await api.delete(`/chatbot/conversations/${convId}`);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConversation?.id === convId) {
        setActiveConversation(null);
        setMessages([]);
      }
      toast.success('Discussion supprimée');
    } catch (error) {
      console.error('Erreur deleteConversation:', error);
      toast.error('Impossible de supprimer la discussion');
    }
  };

  // Charger les suggestions intelligentes
  const fetchSuggestions = async (subjectId, documentId = null) => {
    if (!subjectId) return;
    setLoadingSuggestions(true);
    try {
      const url = `/chatbot/subjects/${subjectId}/suggestions${documentId ? `?documentId=${documentId}` : ''}`;
      const res = await api.get(url);
      setSuggestions(res.data.suggestions);
    } catch (error) {
      console.error('Erreur fetchSuggestions:', error);
      setSuggestions([
        "Quels sont les concepts clés de ce cours ?",
        "Peux-tu résumer les documents ?",
        "Propose-moi des exemples pratiques."
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Envoyer un message en streaming SSE
  const sendMessageStream = async (messageText, imageBase64 = null) => {
    if (!activeConversation) return;

    console.log('[Chat] Envoi message pour conversation #' + activeConversation.id);

    // 1. Ajouter le message de l'utilisateur de manière optimiste dans l'interface
    const userMsg = {
      id: `temp-user-${Date.now()}`,
      sender: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setStreamingMessage('...'); // Indicateur d'écriture

    // Timeout frontend : si le fetch ne résout pas en 45 secondes, on annule tout
    const abortController = new AbortController();
    const fetchTimeout = setTimeout(() => {
      console.warn('[Chat] Timeout fetch (45s) - annulation');
      abortController.abort();
    }, 45000);

    try {
      const token = localStorage.getItem('token');
      console.log('[Chat] Fetch en cours...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/chatbot/conversations/${activeConversation.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageText, imageBase64 }),
        signal: abortController.signal
      });

      clearTimeout(fetchTimeout);
      console.log('[Chat] Fetch terminé, status:', response.status);

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      // 2. Traiter le flux SSE
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let finished = false;
      let accumulatedText = '';
      let lineBuffer = '';
      let lastActivityTime = Date.now();
      const ACTIVITY_TIMEOUT_MS = 30000; // 30s sans données = timeout

      // Vider le streamingMessage de départ "..."
      setStreamingMessage('');

      while (!finished) {
        // Vérifier le timeout d'activité
        if (Date.now() - lastActivityTime > ACTIVITY_TIMEOUT_MS) {
          console.warn('[Chat] Timeout activité stream (30s sans données)');
          throw new Error('Le serveur ne répond plus. Réessayez.');
        }

        const { value, done } = await reader.read();
        if (done) {
          console.log('[Chat] Stream terminé (done=true)');
          finished = true;
          break;
        }

        lastActivityTime = Date.now();
        const chunk = decoder.decode(value, { stream: true });
        lineBuffer += chunk;

        const parts = lineBuffer.split('\n');
        lineBuffer = parts.pop() || '';

        for (const line of parts) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const dataStr = trimmed.slice(6).trim();
          if (!dataStr) continue;

          // Détection d'erreur SSE AVANT le JSON.parse pour ne pas l'avaler
          if (dataStr.includes('"error"')) {
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                console.error('[Chat] Erreur SSE reçue:', parsed.error);
                throw new Error(parsed.error);
              }
            } catch (parseErr) {
              if (parseErr.message && !parseErr.message.includes('Unexpected token') && !parseErr.message.includes('Unexpected end')) {
                throw parseErr;
              }
            }
          }

          try {
            const parsed = JSON.parse(dataStr);

            if (parsed.event === 'done') {
              console.log('[Chat] Événement done reçu');
              finished = true;
              const iaMsg = {
                id: `temp-ia-${Date.now()}`,
                sender: 'ia',
                content: parsed.fullResponse || accumulatedText,
                created_at: new Date().toISOString()
              };
              setMessages(prev => [...prev, iaMsg]);
              setStreamingMessage('');
              break;
            } else if (parsed.event === 'start') {
              console.log('[Chat] Événement start reçu');
            } else if (parsed.text) {
              accumulatedText += parsed.text;
              setStreamingMessage(accumulatedText);
            } else if (parsed.error) {
              console.error('[Chat] Erreur SSE dans parse:', parsed.error);
              throw new Error(parsed.error);
            }
          } catch (jsonErr) {
            if (jsonErr.message && !jsonErr.message.includes('Unexpected token') && !jsonErr.message.includes('Unexpected end')) {
              throw jsonErr;
            }
          }
        }
      }

      // Traiter le reste du buffer
      if (lineBuffer.trim().startsWith('data: ')) {
        const dataStr = lineBuffer.trim().slice(6).trim();
        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.event === 'done' && !finished) {
              const iaMsg = {
                id: `temp-ia-${Date.now()}`,
                sender: 'ia',
                content: parsed.fullResponse || accumulatedText,
                created_at: new Date().toISOString()
              };
              setMessages(prev => [...prev, iaMsg]);
              setStreamingMessage('');
            }
          } catch (e) { /* buffer tronqué */ }
        }
      }

      // Si le stream se termine sans event 'done'
      if (accumulatedText && !finished) {
        const iaMsg = {
          id: `temp-ia-${Date.now()}`,
          sender: 'ia',
          content: accumulatedText,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, iaMsg]);
      }

      // Recharger les conversations en tâche de fond
      api.get(`/chatbot/subjects/${activeConversation.matiere_id}/conversations`)
        .then(res => setConversations(res.data))
        .catch(console.error);

    } catch (error) {
      console.error('[Chat] Erreur streaming chatbot:', error.message || error);
      const isAbort = error.name === 'AbortError';
      toast.error(isAbort ? 'Le serveur met trop de temps à répondre.' : 'Erreur lors de la communication avec l\'IA');
      setMessages(prev => [...prev, {
        id: `temp-error-${Date.now()}`,
        sender: 'ia',
        content: isAbort
          ? "Le serveur met trop de temps à répondre. Vérifiez que le backend est démarré et que votre clé API Gemini est valide."
          : "Désolé, je n'ai pas pu obtenir de réponse de l'IA. Veuillez vérifier vos documents ou réessayer plus tard.",
        created_at: new Date().toISOString()
      }]);
    } finally {
      // GARANTIE : streamingMessage est TOUJOURS vidé, même si une erreur non catchée se produit
      clearTimeout(fetchTimeout);
      setStreamingMessage('');
      console.log('[Chat] streamingMessage nettoyé (finally)');
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        loadingConversations,
        loadingMessages,
        streamingMessage,
        suggestions,
        loadingSuggestions,
        fetchConversations,
        selectConversation,
        createNewConversation,
        deleteConversation,
        fetchSuggestions,
        sendMessageStream
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
