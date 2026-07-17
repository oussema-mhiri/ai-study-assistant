'use client';
import { useState, useEffect } from 'react';import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, Bell, LogOut, Home, Layers, MessageSquare, CalendarDays,
  Settings, ChevronRight, Clock, Mail, BellRing, CheckCircle,
  AlertCircle, BookOpen, Zap, Calendar, Search, Loader2, TrendingUp
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
            className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              activePath === href
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className={`w-[18px] h-[18px] ${activePath === href ? 'text-blue-700' : 'text-gray-400'}`} strokeWidth={1.8} />
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
// COMPOSANTS
// ============================================

function Toggle({ enabled, onChange, label }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
      <div
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </label>
  );
}

function NotificationCard({ title, description, time, isRead, icon: Icon }) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${
      isRead ? 'bg-white border-gray-100' : 'bg-blue-50/40 border-blue-200/50 shadow-sm'
    }`}>
      <div className={`p-2.5 rounded-xl ${isRead ? 'bg-gray-100' : 'bg-blue-100'}`}>
        <Icon className={`w-5 h-5 ${isRead ? 'text-gray-500' : 'text-blue-600'}`} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className={`text-sm font-semibold ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>{title}</h4>
          <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
            isRead ? 'bg-gray-200 text-gray-500' : 'bg-blue-500 text-white'
          }`}>
            {isRead ? 'Lue' : 'Non lue'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        <span className="text-xs text-gray-400 mt-1.5 block">{time}</span>
      </div>
    </div>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================
export default function NotificationsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // États des toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [reminderHour, setReminderHour] = useState('18:00');
  const [frequency, setFrequency] = useState('quotidienne');

  const [notifications] = useState([
    {
      id: 1,
      title: 'Votre session de révision en Algorithmes',
      description: 'Révision programmée à 18h00',
      time: '17:30',
      isRead: false,
      icon: BookOpen,
    },
    {
      id: 2,
      title: 'Nouveau quiz disponible pour la matière IA',
      description: 'Quiz généré automatiquement à partir de vos cours',
      time: '14:15',
      isRead: false,
      icon: Brain,
    },
    {
      id: 3,
      title: 'Votre progression a augmenté de 5%',
      description: 'Vous êtes passé de 73% à 78%',
      time: '09:00',
      isRead: true,
      icon: TrendingUp,
    },
    {
      id: 4,
      title: 'Examen de Base de données dans 3 jours',
      description: 'Préparez-vous pour l\'examen du 15 janvier',
      time: 'Hier',
      isRead: true,
      icon: Calendar,
    },
  ]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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
      <Sidebar activePath="/notifications" onLogout={logout} />

      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-6 h-6 text-blue-600" />
                Centre de notifications
              </h1>
              <p className="text-gray-500 mt-0.5">Gérez vos alertes, rappels et notifications intelligentes.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
              <button className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">3</span>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-blue-200">
                {firstName[0]?.toUpperCase()}
              </div>
            </div>
          </div>

          {/* SECTION PARAMÈTRES */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-5">
              <Settings className="w-5 h-5 text-blue-500" />
              Paramètres des notifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Colonne gauche - Push */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-blue-500" />
                  Notifications Push
                </h3>
                <div className="space-y-3">
                  <Toggle
                    label="Activer les notifications push"
                    enabled={pushEnabled}
                    onChange={setPushEnabled}
                  />
                  <div className="ml-6 space-y-2.5">
                    <Toggle label="Rappels de révision" enabled={pushEnabled} onChange={() => {}} />
                    <Toggle label="Alertes avant examens" enabled={pushEnabled} onChange={() => {}} />
                    <Toggle label="Rappel de quiz non terminé" enabled={pushEnabled} onChange={() => {}} />
                  </div>
                </div>
              </div>

              {/* Colonne droite - Email */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  Notifications par Email
                </h3>
                <div className="space-y-3">
                  <Toggle
                    label="Activer les emails"
                    enabled={emailEnabled}
                    onChange={setEmailEnabled}
                  />
                  <div className="ml-6 space-y-2.5">
                    <Toggle label="Résumé quotidien des révisions" enabled={emailEnabled} onChange={() => {}} />
                    <Toggle label="Récapitulatif hebdomadaire de progression" enabled={emailEnabled} onChange={() => {}} />
                    <Toggle label="Alertes importantes (examens, deadlines)" enabled={emailEnabled} onChange={() => {}} />
                  </div>
                </div>
              </div>
            </div>

            {/* Préférences de rappel */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Préférences de rappel
              </h3>
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Heure des notifications</label>
                  <input
                    type="time"
                    value={reminderHour}
                    onChange={(e) => setReminderHour(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fréquence</label>
                  <div className="flex gap-2">
                    {['Quotidienne', 'Hebdomadaire', 'Personnalisée'].map((freq) => (
                      <button
                        key={freq}
                        onClick={() => setFrequency(freq.toLowerCase())}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                          frequency === freq.toLowerCase()
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION NOTIFICATIONS RÉCENTES */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" />
                Notifications récentes
              </h2>
              <button className="text-sm text-blue-600 hover:underline font-medium">
                Marquer tout comme lu
              </button>
            </div>

            <div className="space-y-3">
              {notifications.map((notif) => (
                <NotificationCard key={notif.id} {...notif} />
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Supprimer l'historique
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}