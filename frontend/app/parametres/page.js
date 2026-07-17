'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, Bell, LogOut, Home, Layers, MessageSquare, CalendarDays,
  Settings, User, Mail, School, BookOpen, GraduationCap, Layers as LayersIcon,
  Moon, Sun, BellRing, Mail as MailIcon, Search, Loader2, Sparkles
} from 'lucide-react';

// ============================================
// SIDEBAR (identique aux autres pages)
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
// COMPOSANTS DE PARAMÈTRES
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

function RadioGroup({ value, onChange, options, name }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            value === opt
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SettingsSection({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-5">
        <Icon className="w-5 h-5 text-blue-500" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function ProfileField({ label, value, icon: Icon, editable = false }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="flex items-center gap-3 mt-1 sm:mt-0">
        {editable ? (
          <input
            type="text"
            defaultValue={value}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 w-full sm:w-auto"
          />
        ) : (
          <span className="text-sm font-medium text-gray-800">{value}</span>
        )}
      </div>
    </div>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================
export default function ParametresPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // États des paramètres
  const [iaLevel, setIaLevel] = useState('Moyen');
  const [responseMode, setResponseMode] = useState('Détaillé');
  const [dataUsage, setDataUsage] = useState('Documents uniquement');
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailSummaries, setEmailSummaries] = useState(true);

  // Profil utilisateur (statique – à remplacer par les données de l'utilisateur)
  const userProfile = {
    fullName: 'Oussema Mhiri',
    email: 'oussema@...',
    university: 'Université de Carthage',
    faculty: 'FST',
    studyLevel: 'Licence',
    major: 'Informatique',
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.full_name?.split(' ')[0] || 'Étudiant';

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar activePath="/parametres" onLogout={logout} />

      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-4xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-600" strokeWidth={1.8} />
                Paramètres du compte
              </h1>
              <p className="text-gray-500 mt-0.5">Gérez votre profil et vos préférences.</p>
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

          {/* SECTION PROFIL UTILISATEUR */}
          <SettingsSection title="Profil utilisateur" icon={User}>
            <div className="divide-y divide-gray-50">
              <ProfileField label="Nom complet" value={userProfile.fullName} icon={User} editable />
              <ProfileField label="Email" value={userProfile.email} icon={Mail} editable={false} />
              <ProfileField label="Université" value={userProfile.university} icon={School} editable />
              <ProfileField label="Faculté" value={userProfile.faculty} icon={BookOpen} editable />
              <ProfileField label="Niveau d'études" value={userProfile.studyLevel} icon={GraduationCap} editable />
              <ProfileField label="Filière / Branche" value={userProfile.major} icon={LayersIcon} editable />
            </div>
            <div className="mt-6 flex justify-end">
              <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-200">
                Enregistrer les modifications
              </button>
            </div>
          </SettingsSection>

          {/* SECTION PARAMÈTRES IA */}
          <SettingsSection title="Paramètres IA" icon={Brain}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Niveau d'explication de l'IA</label>
                <RadioGroup value={iaLevel} onChange={setIaLevel} options={['Simple', 'Moyen', 'Avancé']} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode de réponse</label>
                <RadioGroup value={responseMode} onChange={setResponseMode} options={['Court', 'Détaillé', 'Personnalisé']} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Utilisation des données</label>
                <RadioGroup value={dataUsage} onChange={setDataUsage} options={['Documents uniquement', 'Documents + ressources académiques', 'Documents + ressources + web']} />
              </div>
            </div>
          </SettingsSection>

          {/* SECTION PRÉFÉRENCES (sans langue) */}
          <SettingsSection title="Préférences" icon={Sparkles}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {darkMode ? <Moon className="w-4 h-4 text-gray-500" /> : <Sun className="w-4 h-4 text-gray-500" />}
                  <span className="text-sm text-gray-700">Mode sombre</span>
                </div>
                <Toggle enabled={darkMode} onChange={setDarkMode} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BellRing className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Notifications push</span>
                </div>
                <Toggle enabled={pushNotifications} onChange={setPushNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MailIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Emails de résumé</span>
                </div>
                <Toggle enabled={emailSummaries} onChange={setEmailSummaries} />
              </div>
            </div>
          </SettingsSection>

          {/* PIED DE PAGE */}
          <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
            <p>Version 1.0.0 • Tous droits réservés © 2026 AI Study Assistant</p>
          </div>
        </div>
      </main>
    </div>
  );
}