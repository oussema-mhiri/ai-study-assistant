'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import {
  FileText, BookOpen, Clock, Upload, Bot, CalendarPlus, BarChart3,
  Bell, Search, Layers, CalendarDays, Loader2, ChevronRight, PlusCircle,
  Sparkles, Target, Brain, GraduationCap, AlertTriangle, CheckCircle2, Home,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

function StatCard({ title, value, icon: Icon, trend, loading, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600',
    green: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600',
    purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600',
  };
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
          {!loading && trend && <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">{trend}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
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

function SubjectDonut({ name, progress }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((progress || 0) / 100) * circumference;

  const getColor = () => {
    if (progress >= 70) return '#2563EB';
    if (progress >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-3">
        <svg className="w-24 h-24 -rotate-90">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="6" />
          <circle
            cx="48" cy="48" r={radius} fill="none" stroke={getColor()}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900 dark:text-white">{progress || 0}%</span>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px] mx-auto" title={name}>{name}</p>
    </div>
  );
}

function ScoreChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400 dark:text-gray-500">
        Pas encore de scores enregistrés
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }}
          tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
          formatter={(value) => [`${value}%`, 'Réussite']}
          labelFormatter={(v) => { const d = new Date(v); return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); }}
        />
        <Area type="monotone" dataKey="taux_reussite" stroke="#3B82F6" strokeWidth={2.5} fill="url(#colorScore)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const SHORTCUTS = [
  { id: 1, title: 'Nouveau document', subtitle: 'Importer un fichier', icon: Upload, href: '/matieres', color: 'blue' },
  { id: 2, title: 'Parler au chatbot', subtitle: 'Discuter avec l\'IA', icon: Bot, href: '/chatbot', color: 'indigo' },
  { id: 3, title: 'Créer un planning', subtitle: 'Générer un plan', icon: CalendarPlus, href: '/planning', color: 'purple' },
  { id: 4, title: 'Flashcards', subtitle: 'Réviser les cartes', icon: Brain, href: '/matieres', color: 'green' },
];

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/overview');
        setData(res.data);
      } catch (err) {
        console.error('Erreur dashboard:', err);
        setError(err.response?.data?.error || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.full_name?.split(' ')[0] || 'Etudiant';

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return '0min';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m > 0 ? m : ''}` : `${m}min`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(d); target.setHours(0,0,0,0);
    const diff = Math.round((target - today) / (1000*60*60*24));
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    if (diff === 2) return 'Apres-demain';
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const matieres = (data?.matieres || []).filter(m =>
    !searchQuery || m.nom?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const allMatieres = data?.matieres || [];
  const sessions = data?.upcomingSessions || [];
  const exams = data?.upcomingExams || [];
  const quizzes = data?.recentQuizzes || [];
  const scoreHistory = data?.scoreHistory || [];

  return (
    <div className="min-h-screen bg-white flex dark:bg-gray-950">
      <Sidebar activePath="/dashboard" onLogout={logout} />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Home className="w-6 h-6 text-blue-600" />
              Bonjour, {firstName} 👋
            </h1>
            <p className="text-gray-500 mt-0.5 dark:text-gray-400">
              Centralisez votre apprentissage, organisez vos cours et boostez vos résultats avec l'IA.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-500" />
              <input
                type="text" placeholder="Rechercher une matière..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl w-48 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
            <Link href="/notifications" className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition dark:hover:bg-gray-800">
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              {data && data.unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                  {data.unreadNotifications}
                </span>
              )}
            </Link>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-semibold text-white shadow-sm">
              {firstName[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Documents" value={data?.totalDocuments ?? 0} icon={FileText} trend={`${matieres.length} matiere${matieres.length > 1 ? 's' : ''}`} loading={loading} color="blue" />
          <StatCard title="Quiz passes" value={data?.totalQuizs ?? 0} icon={Target} trend={data?.overallQuizSuccess > 0 ? `${data.overallQuizSuccess}% reussite` : 'Pas encore de score'} loading={loading} color="green" />
          <StatCard title="Flashcards" value={data?.totalFlashcards ?? 0} icon={Brain} trend="Cartes de revision" loading={loading} color="purple" />
          <StatCard title="Temps aujourd'hui" value={formatDuration(data?.revisionTimeToday)} icon={Clock} trend={`${data?.totalQuizAnswers || 0} reponses`} loading={loading} color="amber" />
        </div>

        {/* Raccourcis */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Raccourcis rapides</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {SHORTCUTS.map((s) => (
              <ShortcutCard key={s.id} {...s} />
            ))}
          </div>
        </div>

        {/* Matieres + Graphique */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Matieres donuts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Mes matieres</p>
              <Link href="/matieres" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
                Voir toutes <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : matieres.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400 mb-3 dark:text-gray-500">Aucune matiere pour l'instant.</p>
                <Link href="/matieres" className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline">
                  <PlusCircle className="w-4 h-4" /> Ajouter votre premiere matiere
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-6">
                {matieres.slice(0, 6).map((m) => (
                  <SubjectDonut key={m.id} name={m.nom} progress={m.score_maitrise || m.quiz_success || 0} />
                ))}
              </div>
            )}
          </div>

          {/* Graphique progression */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Progression des scores</p>
              <span className="text-xs text-gray-400 dark:text-gray-500">14 derniers jours</span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : (
              <ScoreChart data={scoreHistory} />
            )}
          </div>
        </div>

        {/* Sessions + Activite */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sessions a venir */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-500" /> Prochaines sessions
              </p>
              <Link href="/planning" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
                Planning <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-10">
                <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2 dark:text-gray-600" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Aucune session prevue cette semaine.</p>
                <Link href="/planning" className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline mt-2">
                  <CalendarPlus className="w-4 h-4" /> Planifier une session
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.matiere_couleur || '#3B82F6' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.titre || s.type}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{s.matiere_nom}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{formatDate(s.date_session)}</p>
                      {s.heure_debut && <p className="text-[11px] text-gray-400">{s.heure_debut.substring(0,5)} · {s.duree_minutes}min</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activite recente */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Activite recente
              </p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-10">
                <Target className="w-8 h-8 text-gray-300 mx-auto mb-2 dark:text-gray-600" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Aujourd'hui, aucune activite enregistree.</p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Commencez par generer un quiz !</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map((q) => {
                  const success = q.taux_reussite != null ? parseFloat(q.taux_reussite) : null;
                  return (
                    <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                        success !== null ? (success >= 70 ? 'bg-emerald-500' : success >= 50 ? 'bg-amber-500' : 'bg-red-500') : 'bg-gray-400'
                      }`}>
                        {success !== null ? `${Math.round(success)}%` : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{q.titre}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {q.matiere_nom} · {q.total_questions} questions · {q.niveau}
                        </p>
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {new Date(q.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Examens a venir */}
        {exams.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-800 mb-8">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-blue-500" /> Examens a venir
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {exams.map((e) => {
                const jours = parseInt(e.jours_restants);
                const isUrgent = jours <= 3;
                return (
                  <div key={e.id} className={`flex items-center gap-3 p-4 rounded-xl border transition ${
                    isUrgent
                      ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50'
                      : 'bg-gray-50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-700/50'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isUrgent ? 'bg-red-100 text-red-600 dark:bg-red-900/40' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40'
                    }`}>
                      {jours}j
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{e.nom}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(e.date_examen).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                    {isUrgent && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-4 dark:text-gray-500 dark:border-gray-800">
          <Sparkles className="w-3 h-3 text-blue-500" />
          <span>Continuez votre progression !</span>
          <span className="text-blue-600 font-medium">{allMatieres.length} matiere{allMatieres.length > 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{data?.totalDocuments || 0} documents</span>
          <span>·</span>
          <span>{data?.totalQuizs || 0} quizs</span>
        </div>
      </main>
    </div>
  );
}
