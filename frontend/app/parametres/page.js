'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Brain, Bell, Settings, User, Mail, School, BookOpen, GraduationCap,
  Layers as LayersIcon, Moon, Sun, BellRing, Mail as MailIcon, Loader2, Save
} from 'lucide-react';

function Toggle({ enabled, onChange, label, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={1.8} />
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
          enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function RadioGroup({ value, onChange, options }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            value === opt
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ProfileField({ label, value, icon: Icon, editable = false, onChange, placeholder }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={1.8} />
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="flex items-center gap-3 mt-1 sm:mt-0">
        {editable ? (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 w-full sm:w-64 transition-colors"
          />
        ) : (
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{value || '—'}</span>
        )}
      </div>
    </div>
  );
}

export default function ParametresPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [studyLevel, setStudyLevel] = useState('');
  const [major, setMajor] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [iaLevel, setIaLevel] = useState('Moyen');
  const [responseMode, setResponseMode] = useState('Détaillé');
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailSummaries, setEmailSummaries] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setUniversity(user.university || '');
      setFaculty(user.faculty || '');
      setStudyLevel(user.study_level || '');
      setMajor(user.major || '');
      setIaLevel(user.ia_level || 'Moyen');
      setResponseMode(user.response_mode || 'Détaillé');
    }
  }, [user]);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    setDarkMode(theme === 'dark');
  }, []);

  const toggleDarkMode = (enabled) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', { university, faculty, studyLevel, major });
      toast.success('Profil mis à jour avec succès !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await api.put('/auth/preferences', { iaLevel, responseMode });
      toast.success('Préférences IA sauvegardées !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSavingPrefs(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.full_name?.split(' ')[0] || 'Étudiant';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar activePath="/parametres" onLogout={logout} />

      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-4xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-6 h-6 text-blue-600" strokeWidth={1.8} />
                Paramètres du compte
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">Gérez votre profil et vos préférences.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-blue-200">
              {firstName[0]?.toUpperCase()}
            </div>
          </div>

          {/* SECTION PROFIL */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-blue-500" />
              Profil utilisateur
            </h2>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              <ProfileField label="Nom complet" value={user.full_name} icon={User} />
              <ProfileField label="Email" value={user.email} icon={Mail} />
              <ProfileField label="Université" value={university} icon={School} editable onChange={setUniversity} placeholder="Ex: Université de Carthage" />
              <ProfileField label="Faculté" value={faculty} icon={BookOpen} editable onChange={setFaculty} placeholder="Ex: FST" />
              <ProfileField label="Niveau d'études" value={studyLevel} icon={GraduationCap} editable onChange={setStudyLevel} placeholder="Ex: Licence, Master" />
              <ProfileField label="Filière / Branche" value={major} icon={LayersIcon} editable onChange={setMajor} placeholder="Ex: Informatique" />
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-50"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingProfile ? 'Enregistrement...' : 'Enregistrer le profil'}
              </button>
            </div>
          </div>

          {/* SECTION PRÉFÉRENCES IA */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-5">
              <Brain className="w-5 h-5 text-blue-500" />
              Paramètres IA
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Niveau d'explication</label>
                <RadioGroup value={iaLevel} onChange={setIaLevel} options={['Simple', 'Moyen', 'Avancé']} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode de réponse</label>
                <RadioGroup value={responseMode} onChange={setResponseMode} options={['Court', 'Détaillé', 'Personnalisé']} />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-50"
              >
                {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingPrefs ? 'Enregistrement...' : 'Enregistrer les préférences'}
              </button>
            </div>
          </div>

          {/* SECTION PRÉFÉRENCES */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-5">
              <Sun className="w-5 h-5 text-blue-500" />
              Préférences
            </h2>
            <div className="space-y-1">
              <Toggle
                enabled={darkMode}
                onChange={toggleDarkMode}
                label="Mode sombre"
                icon={darkMode ? Moon : Sun}
              />
              <Toggle
                enabled={pushNotifications}
                onChange={setPushNotifications}
                label="Notifications push"
                icon={BellRing}
              />
              <Toggle
                enabled={emailSummaries}
                onChange={setEmailSummaries}
                label="Emails de résumé"
                icon={MailIcon}
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600 border-t border-gray-200 dark:border-gray-800 pt-4">
            <p>Version 1.0.0 • AI Study Assistant © 2026</p>
          </div>
        </div>
      </main>
    </div>
  );
}
