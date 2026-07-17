'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  Brain, Search, Bell, LogOut, Home, Layers, MessageSquare, CalendarDays,
  ChevronDown, Loader2, Calendar, Clock, Target, FileText, BookOpen,
  BarChart3, TrendingUp, CheckCircle, Award, Zap, Plus, Settings,
  Sparkles, GraduationCap
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
// COMPOSANTS
// ============================================

// --- Donut Chart pour la progression globale ---
function DonutChart({ percentage, label, color = '#2563EB', size = 130 }) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="9"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
          <span className="text-xs font-medium text-gray-500">{label}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, subtitle, color }) {
  const colorClasses = {
    blue: 'bg-blue-50/80 text-blue-600 border-blue-200',
    green: 'bg-green-50/80 text-green-600 border-green-200',
    orange: 'bg-orange-50/80 text-orange-600 border-orange-200',
    purple: 'bg-purple-50/80 text-purple-600 border-purple-200',
  };
  const bgClass = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`bg-gradient-to-br ${bgClass} rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-2.5 bg-white/70 rounded-xl shadow-sm">
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

function DayCard({ day, subject, duration, activity, color }) {
  const colorMap = {
    blue: 'border-blue-200 bg-blue-50/40 hover:shadow-blue-200/30',
    green: 'border-green-200 bg-green-50/40 hover:shadow-green-200/30',
    orange: 'border-orange-200 bg-orange-50/40 hover:shadow-orange-200/30',
    purple: 'border-purple-200 bg-purple-50/40 hover:shadow-purple-200/30',
    red: 'border-red-200 bg-red-50/40 hover:shadow-red-200/30',
    teal: 'border-teal-200 bg-teal-50/40 hover:shadow-teal-200/30',
  };

  const activityColors = {
    'Lecture': 'text-blue-600',
    'Quiz': 'text-purple-600',
    'Révision': 'text-orange-600',
    'Exercices': 'text-green-600',
  };

  const activityIcons = {
    'Lecture': <BookOpen className="w-3.5 h-3.5" />,
    'Quiz': <Brain className="w-3.5 h-3.5" />,
    'Révision': <Target className="w-3.5 h-3.5" />,
    'Exercices': <FileText className="w-3.5 h-3.5" />,
  };

  return (
    <div className={`bg-white rounded-xl border ${colorMap[color] || 'border-gray-200'} p-3.5 text-center shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{day}</p>
      <p className="text-sm font-semibold text-gray-800 mt-1.5">{subject}</p>
      <p className="text-xs font-medium text-blue-600">{duration}</p>
      <div className={`flex items-center justify-center gap-1.5 mt-1.5 text-xs font-medium ${activityColors[activity] || 'text-gray-500'}`}>
        {activityIcons[activity] || <Zap className="w-3.5 h-3.5" />}
        <span>{activity}</span>
      </div>
    </div>
  );
}

function SubjectProgress({ name, progress, color }) {
  const colorMap = {
    blue: 'bg-blue-600',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
  };
  const barColor = colorMap[color] || 'bg-blue-600';

  return (
    <div className="group flex items-center gap-4 p-2.5 rounded-xl hover:bg-gray-50/60 transition-colors">
      <span className="text-sm font-medium text-gray-700 w-40 truncate">{name}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-700 group-hover:scale-x-105`} style={{ width: `${progress}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-800 w-12 text-right">{progress}%</span>
    </div>
  );
}

// --- Amélioration de la partie Objectifs ---
function ObjectiveItem({ label, isCompleted, progress, objectiveIndex }) {
  const percentage = progress !== undefined ? progress : isCompleted ? 100 : 0;
  
  return (
    <div className="group p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
            isCompleted ? 'bg-green-500' : 'bg-blue-500'
          }`}>
            {isCompleted ? (
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            ) : (
              <span className="text-white text-[10px] font-bold">{objectiveIndex}</span>
            )}
          </div>
          <span className={`text-sm font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            {label}
          </span>
        </div>
        <span className={`text-xs font-semibold px-3 py-0.5 rounded-full ${
          isCompleted 
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-50 text-blue-700'
        }`}>
          {isCompleted ? 'Terminé' : 'En cours'}
        </span>
      </div>
      <div className="ml-8">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{percentage}% de progression</p>
      </div>
    </div>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================
export default function PlanningPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [availableTime, setAvailableTime] = useState(2);
  const [objective, setObjective] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);

  const timeOptions = [1, 2, 3, 4, 5];

  const [stats] = useState({
    quizRealises: 24,
    matieresSuivies: 8,
    tempsRevision: '32h',
    progression: 78,
  });

  const [subjectsProgress] = useState([
    { name: 'Intelligence Artificielle', progress: 75, color: 'blue' },
    { name: 'Algorithmes', progress: 60, color: 'orange' },
    { name: 'Réseaux', progress: 55, color: 'purple' },
    { name: 'Base de données', progress: 50, color: 'teal' },
    { name: 'Mathématiques', progress: 25, color: 'red' },
  ]);

  // Objectifs améliorés avec progression individuelle
  const [objectives] = useState([
    { label: 'Atteindre 80% en Intelligence Artificielle', completed: false, progress: 75 },
    { label: 'Atteindre 70% en Algorithmes', completed: false, progress: 60 },
    { label: 'Atteindre 60% en Mathématiques', completed: false, progress: 25 },
  ]);

  const [calendarData] = useState([
    { day: 'Lundi', subject: 'Algorithmique', duration: '2h', activity: 'Lecture', color: 'blue' },
    { day: 'Mardi', subject: 'IA', duration: '1h', activity: 'Quiz', color: 'purple' },
    { day: 'Mercredi', subject: 'Maths', duration: '3h', activity: 'Révision', color: 'orange' },
    { day: 'Jeudi', subject: 'Maths', duration: '2h', activity: 'Exercices', color: 'orange' },
    { day: 'Vendredi', subject: 'Algorithmique', duration: '2h', activity: 'Révision', color: 'blue' },
    { day: 'Samedi', subject: 'IA', duration: '2h', activity: 'Exercices', color: 'purple' },
    { day: 'Dimanche', subject: 'Révision', duration: '1h30', activity: 'Quiz', color: 'teal' },
  ]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
    } catch (err) {
      console.error('Erreur chargement matières:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubjects();
    }
  }, [user]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setPlanGenerated(true);
    }, 1500);
  };

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
      <Sidebar activePath="/planning" onLogout={logout} />

      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          {/* HEADER - sans "Bonjour, Oussema" */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-blue-600" />
                Planning de révision
              </h1>
              <p className="text-gray-500 mt-0.5">Organisez vos révisions efficacement avec l'IA.</p>
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

          {/* ========================================== */}
          {/* SECTION 1 : CONFIGURATION DU PLANNING */}
          {/* ========================================== */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-5">
              <Calendar className="w-5 h-5 text-blue-500" />
              Configuration du planning
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date du prochain examen</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Matière</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="">Sélectionner une matière</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Temps disponible par jour</label>
              <div className="flex flex-wrap gap-2">
                {timeOptions.map((t) => (
                  <button
                    key={t}
                    onClick={() => setAvailableTime(t)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      availableTime === t
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t}h
                  </button>
                ))}
                <button
                  onClick={() => setAvailableTime(5)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    availableTime === 5
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  5h+
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Objectif (optionnel)</label>
              <input
                type="text"
                placeholder="Ex: Réviser tout le programme"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mt-6 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-60 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Générer le planning
                </>
              )}
            </button>
          </div>

          {/* ========================================== */}
          {/* SECTION 2 : CALENDRIER HEBDOMADAIRE */}
          {/* ========================================== */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-500" />
                Calendrier hebdomadaire
              </h2>
              <span className="text-sm font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                Semaine du 10 au 16 Janvier 2024
              </span>
            </div>

            {planGenerated ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {calendarData.map((day, index) => (
                  <DayCard key={index} {...day} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" strokeWidth={1.5} />
                <p className="text-sm">Générez votre planning pour voir le calendrier</p>
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/* SECTION 3 : PROGRESSION */}
          {/* ========================================== */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-800">Suivi de progression</h2>
              <span className="text-sm text-gray-400 ml-2">↓ Descendre pour voir vos statistiques</span>
            </div>

            {/* Stats avec donut chart pour progression globale */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {/* Donut Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                <DonutChart percentage={stats.progression} label="Progression globale" color="#2563EB" size={130} />
                <p className="text-xs text-gray-400 mt-2">78% terminé • 22% restant</p>
              </div>
              {/* Les 3 autres cartes */}
              <StatCard title="Quiz réalisés" value={stats.quizRealises} icon={Brain} subtitle="+2 cette semaine" color="green" />
              <StatCard title="Matières suivies" value={stats.matieresSuivies} icon={BookOpen} subtitle="Total actif" color="orange" />
              <StatCard title="Temps de révision" value={stats.tempsRevision} icon={Clock} subtitle="Cette semaine" color="purple" />
            </div>

            {/* Progression par matière */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-800">Progression par matière</h3>
              </div>
              <div className="space-y-1">
                {subjectsProgress.map((s, i) => (
                  <SubjectProgress key={i} {...s} />
                ))}
              </div>
            </div>

            {/* Objectifs améliorés */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-800">Objectifs de progression</h3>
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                  {objectives.filter(o => o.completed).length}/{objectives.length} atteints
                </span>
              </div>
              <div className="space-y-3">
                {objectives.map((obj, i) => (
                  <ObjectiveItem key={i} objectiveIndex={i + 1} {...obj} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}