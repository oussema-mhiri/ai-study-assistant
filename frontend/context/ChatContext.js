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

    // 1. Ajouter le message de l'utilisateur de manière optimiste dans l'interface
    const userMsg = {
      id: `temp-user-${Date.now()}`,
      sender: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setStreamingMessage('...'); // Indicateur d'écriture

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/chatbot/conversations/${activeConversation.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageText, imageBase64 })
      });

      if (!response.ok) {
        throw new Error('Erreur HTTP de chatStream');
      }

      // 2. Traiter le flux SSE
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let finished = false;
      let accumulatedText = '';

      // Vider le streamingMessage de départ "..."
      setStreamingMessage('');

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) {
          finished = true;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        // Séparer les lignes par double saut de ligne standard dans SSE
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            
            try {
              const parsed = JSON.parse(dataStr);
              
              if (parsed.event === 'done') {
                finished = true;
                // Message IA finalisé
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
                // Début
              } else if (parsed.text) {
                accumulatedText += parsed.text;
                setStreamingMessage(accumulatedText);
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (jsonErr) {
              // Parfois, les chunks peuvent être tronqués si le tampon TCP est divisé. 
              // Ce bloc évite le crash du client si une ligne incomplète est reçue.
            }
          }
        }
      }

      // Recharger les conversations en tâche de fond pour mettre à jour la date d'activité (updated_at)
      api.get(`/chatbot/subjects/${activeConversation.matiere_id}/conversations`)
        .then(res => setConversations(res.data))
        .catch(console.error);

    } catch (error) {
      console.error('Erreur streaming chatbot:', error);
      toast.error('Erreur lors de la communication avec l\'IA');
      // Retirer l'indicateur d'écriture en cas d'erreur
      setStreamingMessage('');
      // Ajouter un message d'erreur dans le chat
      setMessages(prev => [...prev, {
        id: `temp-error-${Date.now()}`,
        sender: 'ia',
        content: "Désolé, je n'ai pas pu obtenir de réponse de l'IA. Veuillez vérifier vos documents ou réessayer plus tard.",
        created_at: new Date().toISOString()
      }]);
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
