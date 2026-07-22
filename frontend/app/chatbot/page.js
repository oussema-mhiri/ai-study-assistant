'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import {
  Brain, Search, Plus, Send, Bot, Sparkles, History, Settings,
  Bell, LogOut, Home, Layers, MessageSquare, CalendarDays,
  ChevronDown, Loader2, User, Clock, BookOpen, Trash2, Paperclip, X, Info, Menu
} from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================
// COMPOSANTS DE CHAT & RENDU MARKDOWN SIMPLE
// ============================================

function formatMarkdown(text) {
  if (!text) return '';
  let formatted = text;

  // Blocs de code : ```code```
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre class="bg-zinc-900 text-zinc-100 p-4 rounded-xl overflow-x-auto my-3 text-xs font-mono shadow-inner border border-zinc-800">$1</pre>');

  // Code en ligne : `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-zinc-100 dark:bg-zinc-800 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-xs border border-zinc-200/50 dark:border-zinc-700/50">$1</code>');

  // Gras : **text**
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-950 dark:text-white">$1</strong>');

  // Listes à puces (lignes commençant par - ou *)
  formatted = formatted.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return `<li class="ml-5 list-disc my-1 text-gray-700 dark:text-gray-300 leading-relaxed">${trimmed.slice(2)}</li>`;
    }
    return line;
  }).join('\n');

  // Sauts de paragraphes
  formatted = formatted.replace(/\n\n/g, '<div class="h-3"></div>');
  formatted = formatted.replace(/\n/g, '<br />');

  return <div className="space-y-1" dangerouslySetInnerHTML={{ __html: formatted }} />;
}

function SuggestionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/50 rounded-2xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 shadow-sm hover:shadow-md text-left cursor-pointer"
    >
      <Icon className="w-4 h-4 text-blue-500 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function UserMessage({ content, time }) {
  return (
    <div className="flex justify-end mb-4 animate-fade-in-up">
      <div className="max-w-[75%] bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl rounded-tr-sm px-5 py-3 shadow-md shadow-blue-200/30">
        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        <span className="text-[10px] text-blue-200/80 mt-1 block text-right font-medium">{time}</span>
      </div>
    </div>
  );
}

function AssistantMessage({ content, time, isStreaming, onRetry }) {
  const isError = content && content.includes("Désolé, je n'ai pas pu obtenir de réponse");
  return (
    <div className="flex items-start gap-3 mb-4 animate-fade-in-up">
      <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-200 flex-shrink-0 mt-1">
        <Brain className="w-4 h-4 text-white" strokeWidth={2} />
      </div>
      <div className="max-w-[75%] bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700/50 rounded-3xl rounded-tl-sm px-5 py-3.5 shadow-sm hover:shadow-md transition-shadow">
        <div className={`text-sm leading-relaxed ${isError ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
          {content === '...' ? (
            <div className="flex items-center gap-1.5 py-2 px-1">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            formatMarkdown(content)
          )}
        </div>
        {isError && onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Réessayer
          </button>
        )}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100/50 dark:border-gray-700/50 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
          <span>{time}</span>
          {isStreaming && (
            <span className="text-blue-500 font-semibold animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block animate-ping" />
              Rédaction en direct
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================
export default function ChatbotPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);

  // Context Chat
  const {
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
  } = useChat();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [inputValue, setInputValue] = useState('');
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  // Notifications
  const [unreadCount, setUnreadCount] = useState(0);

  // Gestion des images
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
      if (res.data.length > 0) {
        setSelectedSubject(res.data[0]);
        fetchConversations(res.data[0].id);
        fetchSuggestions(res.data[0].id, null);
        fetchDocuments(res.data[0].id);
      }
    } catch (err) {
      console.error('Erreur chargement matières:', err);
    }
  };

  const fetchDocuments = async (subjectId) => {
    try {
      const res = await api.get(`/documents/${subjectId}`);
      setDocuments(res.data);
    } catch (err) {
      console.error('Erreur chargement documents:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubjects();
      const fetchUnread = async () => {
        try {
          const res = await api.get('/planning/notifications');
          setUnreadCount(res.data.unread || 0);
        } catch (err) { /* silent */ }
      };
      fetchUnread();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedImage) || !activeConversation || !!streamingMessage) return;

    const text = inputValue.trim();
    setInputValue('');

    const img = selectedImage;
    setSelectedImage(null);
    setImagePreview(null);

    await sendMessageStream(text, img);
  };

  // Réessayer le dernier message utilisateur après une erreur
  const handleRetryLastMessage = async () => {
    if (!activeConversation || !!streamingMessage) return;

    // Trouver le dernier message utilisateur dans la liste
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (!lastUserMsg) return;

    // Retirer le dernier message d'erreur de l'IA
    const lastErrMsg = [...messages].reverse().find(m => m.sender === 'ia' && m.id?.startsWith('temp-error'));
    if (lastErrMsg) {
      setMessages(prev => prev.filter(m => m.id !== lastErrMsg.id));
    }

    await sendMessageStream(lastUserMsg.content);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (sugText) => {
    if (!!streamingMessage) return;
    setInputValue(sugText);
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    setSelectedDoc(null);
    setShowSubjectSelector(false);
    setShowDocSelector(false);
    fetchConversations(subject.id);
    fetchSuggestions(subject.id, null);
    fetchDocuments(subject.id);
  };

  const handleDocChange = (doc) => {
    setSelectedDoc(doc);
    setShowDocSelector(false);
    setShowSubjectSelector(false);
    fetchSuggestions(selectedSubject.id, doc ? doc.id : null);
  };

  const handleNewConversation = async () => {
    if (!selectedSubject) return;
    const docId = selectedDoc ? selectedDoc.id : null;
    const docSuffix = selectedDoc ? ` (${selectedDoc.nom_fichier.substring(0, 15)})` : '';
    const title = `Discussion${docSuffix} du ${new Date().toLocaleDateString('fr-FR')}`;
    await createNewConversation(selectedSubject.id, title, docId);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (max 5 Mo)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result); // Base64
      setImagePreview(URL.createObjectURL(file));
    };
    reader.readAsDataURL(file);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <div className="hidden lg:block w-64 min-h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 p-4 space-y-3">
          <div className="h-8 w-32 skeleton" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 w-full skeleton rounded-xl" />
          ))}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="w-16 h-16 skeleton rounded-full mb-4" />
          <div className="h-5 w-48 skeleton mb-2" />
          <div className="h-4 w-64 skeleton" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.full_name?.split(' ')[0] || 'Étudiant';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar activePath="/chatbot" onLogout={logout} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowHistorySidebar(!showHistorySidebar)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
              Assistant IA
            </h1>
            <p className="text-gray-500 mt-0.5 dark:text-gray-400 text-xs sm:text-sm truncate">Posez vos questions sur vos cours.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/notifications" className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link href="/parametres" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-200 cursor-pointer hover:opacity-90 transition">
              {firstName[0]?.toUpperCase()}
            </Link>
          </div>
        </div>

        {/* ZONE PRINCIPALE DE DISCUSSION */}
        <div className="flex-1 flex overflow-hidden">

          {/* OVERLAY MOBILE pour sidebar conversations */}
          {showHistorySidebar && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
              onClick={() => setShowHistorySidebar(false)}
            />
          )}

          {/* BARRE LATÉRALE HISTORIQUE DES CONVERSATIONS */}
          <div className={`
            fixed lg:relative top-0 left-0 h-screen lg:h-full z-40 lg:z-10
            w-72 lg:w-64 xl:w-76 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
            flex flex-col shadow-sm
            transition-transform duration-300 ease-out
            ${showHistorySidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sessions</span>
              <div className="flex items-center gap-1.5">
                {selectedSubject && (
                  <button
                    onClick={handleNewConversation}
                    className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] sm:text-xs font-semibold transition-all shadow-md shadow-blue-100 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Nouveau
                  </button>
                )}
                <button
                  onClick={() => setShowHistorySidebar(false)}
                  className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5">
              {loadingConversations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed font-semibold">Aucune discussion active.</p>
                  <p className="text-[10px] text-gray-400/80 dark:text-gray-500/80 leading-relaxed mt-1">Créez une session pour démarrer.</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = activeConversation?.id === conv.id;
                  return (
                    <div
                      key={conv.id}
                      className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl text-xs transition-all border cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-50/60 to-indigo-50/20 text-blue-700 font-bold border-blue-100 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50/80 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      onClick={() => { selectConversation(conv); setShowHistorySidebar(false); }}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="truncate text-gray-800 dark:text-gray-200 font-semibold">{conv.titre}</div>
                        {conv.document_nom && (
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium truncate mt-1 flex items-center gap-1">
                            <BookOpen className="w-2.5 h-2.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                            {conv.document_nom}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Voulez-vous supprimer cette discussion ?')) {
                            deleteConversation(conv.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ESPACE DE DISCUSSION CENTRAL */}
          <div className="flex-1 flex flex-col bg-gray-50/30 dark:bg-gray-950 h-full overflow-hidden">
            
            {/* SÉLECTEURS DE CONTEXTE MATIÈRE ET DOCUMENT */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-3 shrink-0 shadow-sm z-10 flex-wrap">
              {/* Sélecteur de matière */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSubjectSelector(!showSubjectSelector);
                    setShowDocSelector(false);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 rounded-xl text-[10px] sm:text-xs font-bold transition-all border border-blue-100/30 shadow-sm cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-none">{selectedSubject?.nom || 'Matière'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 shrink-0 ${showSubjectSelector ? 'rotate-180' : ''}`} />
                </button>

                {showSubjectSelector && subjects.length > 0 && (
                  <div className="absolute left-0 mt-2 w-56 sm:w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 py-1.5 z-20 max-h-60 overflow-y-auto">
                    {subjects.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSubjectChange(s)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-blue-50 transition-all ${
                          selectedSubject?.id === s.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {s.nom}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sélecteur de document (optionnel) */}
              {selectedSubject && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowDocSelector(!showDocSelector);
                      setShowSubjectSelector(false);
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100/70 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-[10px] sm:text-xs font-bold transition-all border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                    <span className="max-w-[100px] sm:max-w-[180px] truncate">
                      {selectedDoc ? selectedDoc.nom_fichier : 'Documents'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 shrink-0 ${showDocSelector ? 'rotate-180' : ''}`} />
                  </button>

                  {showDocSelector && (
                    <div className="absolute left-0 mt-2 w-64 sm:w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 py-1.5 z-20 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => handleDocChange(null)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all ${
                          !selectedDoc ? 'bg-zinc-50 dark:bg-zinc-800 text-blue-700 font-bold' : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        Tous les documents ({documents.length})
                      </button>
                      {documents.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleDocChange(doc)}
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all ${
                            selectedDoc?.id === doc.id ? 'bg-zinc-50 dark:bg-zinc-800 text-blue-700 font-bold' : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {doc.nom_fichier}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BANNER D'INFORMATION DE CONTEXTE DU CHAT */}
            {activeConversation && (
              <div className="bg-blue-50/50 px-3 sm:px-6 py-2 flex items-center gap-2 shrink-0 border-b border-blue-100/20 text-[10px] sm:text-xs text-blue-800 font-medium select-none">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                {activeConversation.document_nom ? (
                  <span>
                    Discussion restreinte au document : <strong className="font-bold underline">{activeConversation.document_nom}</strong>.
                  </span>
                ) : (
                  <span>
                    Discussion transversale basée sur l'ensemble des documents de la matière.
                  </span>
                )}
              </div>
            )}

            {/* MESSAGE CONTAINER */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-2 bg-gray-50/30 dark:bg-gray-950">
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Chargement de l'historique...</p>
                </div>
              ) : messages.length === 0 && !streamingMessage ? (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center mb-5 shadow-sm">
                    <Brain className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Assistant IA Pédagogique</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                    Posez vos questions sur vos cours de <strong className="text-gray-800 dark:text-gray-200 font-bold">{selectedSubject?.nom}</strong>.
                    {selectedDoc ? (
                      <span> Le chatbot est actuellement configuré pour répondre uniquement sur le document <strong className="text-gray-800 dark:text-gray-200 font-bold">{selectedDoc.nom_fichier}</strong>.</span>
                    ) : (
                      <span> Le chatbot analysera l'ensemble de vos documents importés pour répondre.</span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto w-full">
                  {messages.map((msg) =>
                    msg.sender === 'user' ? (
                      <UserMessage
                        key={msg.id}
                        content={msg.content}
                        time={new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      />
                    ) : (
                      <AssistantMessage
                        key={msg.id}
                        content={msg.content}
                        time={new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        onRetry={String(msg.id).startsWith('temp-error') ? handleRetryLastMessage : null}
                      />
                    )
                  )}

                  {/* Flux streaming IA */}
                  {streamingMessage && (
                    <AssistantMessage
                      content={streamingMessage}
                      time={new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      isStreaming={true}
                    />
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* SUGGESTIONS INTELLIGENTES */}
            {messages.length === 0 && !streamingMessage && suggestions.length > 0 && (
              <div className="px-3 sm:px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0 shadow-inner">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider select-none">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                    <span>Questions suggérées pour réviser :</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {suggestions.map((sug, index) => (
                      <SuggestionButton
                        key={index}
                        icon={BookOpen}
                        label={sug}
                        onClick={() => handleSuggestionClick(sug)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SAISIE DE TEXTE */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <div className="max-w-4xl mx-auto">
                
                {/* Aperçu de l'image sélectionnée */}
                {imagePreview && (
                  <div className="mb-3 relative inline-block transition-transform hover:scale-102">
                    <img src={imagePreview} alt="Aperçu" className="h-20 w-20 object-cover rounded-xl border border-gray-200/80 shadow-md" />
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedImage(null);
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer"
                      title="Supprimer l'image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={!activeConversation || !!streamingMessage}
                    className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-transparent shrink-0 cursor-pointer"
                    title="Ajouter une image (notes scannées, schémas)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      selectedSubject
                        ? activeConversation
                          ? `Posez votre question sur ${selectedSubject.nom}...`
                          : "Créez ou sélectionnez une discussion à gauche pour commencer"
                        : "Sélectionnez une matière pour démarrer"
                    }
                    disabled={!activeConversation || !!streamingMessage}
                    className="flex-1 py-2.5 text-sm text-gray-800 dark:text-white bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={(!inputValue.trim() && !selectedImage) || !activeConversation || !!streamingMessage}
                    className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-200 shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
                
                <div className="text-center text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-2">
                  L'IA s'appuie sur le contexte choisi (matière et/ou document) pour générer ses explications.
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}