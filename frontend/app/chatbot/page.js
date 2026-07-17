'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  Brain, Search, Plus, Send, Bot, Sparkles, History, Settings,
  Bell, LogOut, Home, Layers, MessageSquare, CalendarDays,
  ChevronDown, Loader2, User, Clock, BookOpen
} from 'lucide-react';

// ============================================
// SIDEBAR
// ============================================
const navItems = [
  { label: 'Tableau de bord', icon: Home, href: '/dashboard' },
  { label: 'Matières', icon: Layers, href: '/matieres' },
  { label: 'Chatbot IA', icon: MessageSquare, href: '/chatbot' },
  { label: 'Planning', icon: CalendarDays, href: '/planning' },
];

const navFooterItems = [
  { label: 'Notifications', icon: Bell, href: '/notifications' },
  { label: 'Paramètres', icon: Settings, href: '/parametres' },
];

function Sidebar({ activePath, onLogout }) {
  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 px-5 py-7 shadow-sm">
      <div className="flex items-center gap-2.5 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
          <Brain className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <span className="text-lg font-bold text-gray-800 tracking-tight">AI Study Assistant</span>
      </div>

      <nav className="flex flex-col gap-1.5 flex-1">
        {navItems.map(({ label, icon: Icon, href }) => {
          const active = activePath === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-blue-700' : 'text-gray-400'}`} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1.5 pt-4 border-t border-gray-100">
        {navFooterItems.map(({ label, icon: Icon, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
          >
            <Icon className="w-[18px] h-[18px] text-gray-400" strokeWidth={1.8} />
            {label}
          </Link>
        ))}
        <button
          onClick={onLogout}
          className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-left mt-2"
        >
          <LogOut className="w-[18px] h-[18px] text-gray-400" strokeWidth={1.8} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

// ============================================
// COMPOSANTS DE CHAT
// ============================================

function SuggestionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <Icon className="w-4 h-4 text-blue-500" />
      {label}
    </button>
  );
}

function UserMessage({ content, time }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] bg-blue-600 rounded-2xl rounded-tr-sm px-5 py-3 shadow-md shadow-blue-200/50">
        <p className="text-white text-sm leading-relaxed">{content}</p>
        <span className="text-[10px] text-blue-200/80 mt-1 block text-right">{time}</span>
      </div>
    </div>
  );
}

function AssistantMessage({ content, time }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-200 flex-shrink-0 mt-0.5">
        <Brain className="w-4 h-4 text-white" strokeWidth={2} />
      </div>
      <div className="max-w-[75%] bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
        <p className="text-gray-700 text-sm leading-relaxed">{content}</p>
        <span className="text-[10px] text-gray-400 mt-1 block">{time}</span>
      </div>
    </div>
  );
}

function ChatInput({ value, onChange, onSend, disabled, placeholder }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 py-2.5 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
      />
      <button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-200"
      >
        <Send className="w-4 h-4" strokeWidth={2} />
      </button>
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

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);

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
        setMessages([
          {
            id: 'welcome',
            sender: 'assistant',
            content: `Je suis votre assistant IA pour **${res.data[0].nom}**. Posez-moi vos questions sur vos cours.`,
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error('Erreur chargement matières:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubjects();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedSubject) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      content: inputValue.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const assistantMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        content: `Voici une réponse à votre question : "${userMsg.content}". L'IA analysera vos documents pour vous fournir une explication détaillée.`,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 1000 + Math.random() * 500);
  };

  const handleSuggestion = (suggestion) => {
    setInputValue(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    setShowSubjectSelector(false);
    setMessages([
      {
        id: 'welcome-' + subject.id,
        sender: 'assistant',
        content: `Je suis votre assistant IA pour **${subject.nom}**. Posez-moi vos questions sur vos cours.`,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const suggestions = [
    { icon: Sparkles, label: 'Expliquer un concept' },
    { icon: BookOpen, label: 'Résumer un chapitre' },
    { icon: Plus, label: 'Donner des exemples' },
    { icon: Brain, label: 'Générer des questions' },
    { icon: Clock, label: 'Aide aux révisions' },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.full_name?.split(' ')[0] || 'Étudiant';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activePath="/chatbot" onLogout={logout} />

      <main className="flex-1 flex flex-col h-screen">
        {/* HEADER MODERNISÉ – sans "Bonjour, Oussema" */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Assistant IA</h1>
            <p className="text-sm text-gray-500">Posez vos questions sur vos cours et obtenez des réponses instantanées.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm shadow-blue-200">
              {firstName[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* ZONE DE CHAT */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Sélection de matière */}
          <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 flex-wrap">
            <button
              onClick={() => setShowSubjectSelector(!showSubjectSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-all"
            >
              <Layers className="w-4 h-4" />
              {selectedSubject?.nom || 'Sélectionner une matière'}
              <ChevronDown className={`w-4 h-4 transition-transform ${showSubjectSelector ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex gap-1.5">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <History className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {showSubjectSelector && subjects.length > 0 && (
              <div className="absolute mt-10 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 min-w-[200px]">
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSubjectChange(s)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-all ${
                      selectedSubject?.id === s.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {s.nom}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/30">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Bonjour 👋</h2>
                <p className="text-gray-500 max-w-md mt-1">
                  {selectedSubject
                    ? `Je suis votre assistant IA pour **${selectedSubject.nom}**. Posez-moi vos questions sur vos cours.`
                    : 'Veuillez sélectionner une matière pour commencer.'}
                </p>
              </div>
            ) : (
              messages.map((msg) =>
                msg.sender === 'user' ? (
                  <UserMessage key={msg.id} content={msg.content} time={msg.time} />
                ) : (
                  <AssistantMessage key={msg.id} content={msg.content} time={msg.time} />
                )
              )
            )}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-200 flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && selectedSubject && (
            <div className="px-6 py-3 bg-white border-t border-gray-100 flex flex-wrap gap-2 justify-center">
              {suggestions.map((sug, index) => (
                <SuggestionButton
                  key={index}
                  icon={sug.icon}
                  label={sug.label}
                  onClick={() => handleSuggestion(sug.label)}
                />
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendMessage}
              disabled={!selectedSubject || isLoading}
              placeholder={
                selectedSubject
                  ? `Posez votre question sur ${selectedSubject.nom}...`
                  : 'Veuillez sélectionner une matière'
              }
            />
            <div className="text-xs text-gray-400 text-center mt-2">
              L'IA répond en se basant sur vos documents importés.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}