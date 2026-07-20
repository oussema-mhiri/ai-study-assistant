// frontend/app/dashboard/page.js
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import {
  FileText, BookOpen, Clock, Upload, Bot, CalendarPlus, BarChart3,
  Bell, Search, LogOut, Home, Layers, MessageSquare, CalendarDays,
  Settings, Brain, Loader2, ChevronRight, PlusCircle, Sparkles,
} from 'lucide-react';

// ============================================
// DONNÉES STATIQUES (en attendant l'API)
// ============================================

const STATS_DATA = {
  documentsCount: 12,
  documentsTrend: '+2% ce mois',
  subjectsCount: 8,
  revisionHours: 32,
};

const SUBJECTS_DATA = [
  { id: 1, name: 'Intelligence Artificielle', progress: 80, lastActivity: '2 leçons restantes' },
  { id: 2, name: 'Algorithmes', progress: 60, lastActivity: '3 leçons restantes' },
  { id: 3, name: 'Base de données', progress: 50, lastActivity: '5 leçons restantes' },
  { id: 4, name: 'Réseaux', progress: 25, lastActivity: '7 leçons restantes' },
];

const SHORTCUTS = [
  { id: 1, title: 'Nouveau document', subtitle: 'Importer un fichier', icon: Upload, href: '/matieres', color: 'blue' },
  { id: 2, title: 'Parler au chatbot', subtitle: 'Discuter avec l\'IA', icon: Bot, href: '/chatbot', color: 'indigo' },
  { id: 3, title: 'Créer un planning', subtitle: 'Générer un plan', icon: CalendarPlus, href: '/planning', color: 'purple' },
  { id: 4, title: 'Progression détaillée', subtitle: 'Voir les analyses', icon: BarChart3, href: '/progression', color: 'green' },
];

// ============================================
// COMPOSANTS DE CONTENU
// ============================================

function StatCard({ title, value, icon: Icon, trend, loading }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition duration-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1 dark:bg-gray-800" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 mt-1 dark:text-white">{value}</p>
          )}
          {!loading && trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
        </div>
        <div className="p-3 bg-blue-50 rounded-xl dark:bg-blue-950/30">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
      </div>
    </div>
  );
}

function ShortcutCard({ title, subtitle, icon: Icon, href, color }) {
  const colorMap = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    green: 'bg-emerald-600 hover:bg-emerald-700',
  };
  return (
    <Link
      href={href}
      className={`${colorMap[color] || 'bg-blue-600 hover:bg-blue-700'} rounded-2xl p-5 flex flex-col gap-4 transition duration-200 group`}
    >
      <Icon className="w-6 h-6 text-white/80 group-hover:text-white transition" />
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>
      </div>
    </Link>
  );
}

function SubjectDonut({ name, progress, lastActivity }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 70) return '#2563EB';
    if (progress >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-3">
        <svg className="w-24 h-24 -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="6"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900 dark:text-white">{progress}%</span>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{name}</p>
      {lastActivity && <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">{lastActivity}</p>}
    </div>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.full_name?.split(' ')[0] || 'Étudiant';

  return (
    <div className="min-h-screen bg-white flex dark:bg-gray-950">
      <Sidebar activePath="/dashboard" onLogout={logout} />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bonjour, {firstName} 👋</h1>
            <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
              Centralisez votre apprentissage, organisez vos cours et boostez vos résultats avec l'IA.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl w-48 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-blue-400"
              />
            </div>
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition dark:hover:bg-gray-800">
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                3
              </span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-semibold text-white shadow-sm">
              {firstName[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <StatCard
            title="Documents importés"
            value={STATS_DATA.documentsCount}
            icon={FileText}
            trend={STATS_DATA.documentsTrend}
            loading={dataLoading}
          />
          <StatCard
            title="Matières suivies"
            value={STATS_DATA.subjectsCount}
            icon={BookOpen}
            trend="Total actif"
            loading={dataLoading}
          />
          <StatCard
            title="Temps de révision"
            value={`${STATS_DATA.revisionHours}h`}
            icon={Clock}
            trend="Cette semaine"
            loading={dataLoading}
          />
        </div>

        {/* Raccourcis rapides */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Raccourcis rapides</p>
            <Link href="#" className="text-xs text-blue-600 hover:underline font-medium">
              Voir tout
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {SHORTCUTS.map((shortcut) => (
              <ShortcutCard key={shortcut.id} {...shortcut} />
            ))}
          </div>
        </div>

        {/* Aperçu des matières */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Aperçu des matières</p>
            <Link href="/matieres" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
              Voir toutes
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {dataLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : SUBJECTS_DATA.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-gray-400 mb-3 dark:text-gray-500">Aucune matière pour l'instant.</p>
              <Link
                href="/matieres"
                className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline"
              >
                <PlusCircle className="w-4 h-4" />
                Ajouter votre première matière
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {SUBJECTS_DATA.map((subject) => (
                <SubjectDonut
                  key={subject.id}
                  name={subject.name}
                  progress={subject.progress}
                  lastActivity={subject.lastActivity}
                />
              ))}
            </div>
          )}
        </div>

        {/* Petit message de motivation en bas */}
        <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-4 dark:text-gray-500 dark:border-gray-800">
          <Sparkles className="w-3 h-3 text-blue-500" />
          <span>Continuez votre progression ! </span>
          <span className="text-blue-600 font-medium">{STATS_DATA.subjectsCount} matières</span>
          <span>•</span>
          <span>{STATS_DATA.documentsCount} documents</span>
        </div>
      </main>
    </div>
  );
}