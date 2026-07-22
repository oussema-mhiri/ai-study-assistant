'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import {
  Brain, Bell, LogOut, Home, Layers, MessageSquare, CalendarDays,
  ChevronDown, ChevronLeft, ChevronRight, Loader2, Settings,
  Target, FileText, BookOpen, BarChart3, TrendingUp, CheckCircle,
  Award, Zap, Plus, Sparkles, GraduationCap, Clock, Trash2,
  AlertCircle, Info, X, Send, Check, RotateCcw, Bot
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ============================================
// UTILITAIRES CALENDRIER
// ============================================
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

const TYPE_CONFIG = {
  qcm:      { label: 'QCM', color: 'bg-violet-500',  light: 'bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  lecture:  { label: 'Lecture', color: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300',     dot: 'bg-blue-500' },
  chatbot:  { label: 'Chatbot', color: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  revision: { label: 'Révision', color: 'bg-amber-500',  light: 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  resume:   { label: 'Résumé', color: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  flashcard:{ label: 'Flashcards', color: 'bg-violet-500', light: 'bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  exercices:{ label: 'Exercices', color: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  vrai_faux:{ label: 'Vrai ou Faux', color: 'bg-rose-500', light: 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  let d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Lundi = 0
}

// ============================================
// COMPOSANT MODAL CRÉATION SESSION
// ============================================
function CreateSessionModal({ subjects, selectedDate, onClose, onCreated }) {
  const [form, setForm] = useState({
    matiereId: subjects[0]?.id || '',
    type: 'revision',
    titre: '',
    dureeMinutes: 60,
    heureDebut: '09:00',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.matiereId) return toast.error('Sélectionnez une matière');
    setLoading(true);
    try {
      const res = await api.post('/planning/sessions', {
        matiereId: form.matiereId,
        dateSession: selectedDate,
        type: form.type,
        titre: form.titre || TYPE_CONFIG[form.type]?.label,
        dureeMinutes: parseInt(form.dureeMinutes),
        heureDebut: form.heureDebut,
      });
      onCreated(res.data);
      toast.success('Session planifiée !');
      onClose();
    } catch (err) {
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-scale-in dark:bg-gray-900">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Nouvelle session
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 font-medium">
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Matière</label>
            <select value={form.matiereId} onChange={e => setForm(f => ({...f, matiereId: e.target.value}))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
              {subjects.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Type de session</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => setForm(f => ({...f, type: key}))}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    form.type === key ? `${cfg.light} border-current shadow-sm` : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}>{cfg.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Titre (optionnel)</label>
            <input type="text" value={form.titre} onChange={e => setForm(f => ({...f, titre: e.target.value}))}
              placeholder={`Ex : ${TYPE_CONFIG[form.type]?.label} Chapitre 3`}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Heure</label>
              <input type="time" value={form.heureDebut} onChange={e => setForm(f => ({...f, heureDebut: e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Durée (min)</label>
              <select value={form.dureeMinutes} onChange={e => setForm(f => ({...f, dureeMinutes: e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                {[30,45,60,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-200 dark:shadow-none hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? 'Création...' : 'Planifier cette session'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================
// ONGLET 1 — PROGRESSION PAR MATIÈRE
// ============================================
function ProgressTab({ subjects }) {
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProgress = useCallback(async (subjectId) => {
    setLoading(true);
    setProgress(null);
    try {
      const res = await api.get(`/progress/${subjectId}`);
      setProgress(res.data);
    } catch (err) {
      toast.error('Erreur chargement progression');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSubject) fetchProgress(selectedSubject.id);
  }, [selectedSubject, fetchProgress]);

  const score = progress?.score_maitrise_pct || 0;
  const scoreColor = score >= 75 ? 'from-emerald-500 to-teal-500' : score >= 50 ? 'from-blue-500 to-indigo-500' : 'from-amber-500 to-orange-500';
  const scoreBg = score >= 75 ? 'bg-emerald-50 dark:bg-emerald-950/30' : score >= 50 ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-amber-50 dark:bg-amber-950/30';
  const scoreText = score >= 75 ? 'text-emerald-700' : score >= 50 ? 'text-blue-700' : 'text-amber-700';

  const chartData = (progress?.score_history || []).map((h, i) => ({
    name: i + 1,
    score: h.score,
  }));

  return (
    <div className="space-y-6">
      {/* Sélecteur matière */}
      <div className="flex items-center gap-3 flex-wrap">
        {subjects.map(s => (
          <button key={s.id} onClick={() => setSelectedSubject(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              selectedSubject?.id === s.id
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200 dark:shadow-none border-transparent'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:text-blue-700'
            }`} style={{ borderLeft: `3px solid ${s.couleur || '#3B82F6'}` }}>
            {s.nom}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="rounded-3xl p-6 bg-gray-100 dark:bg-gray-800 animate-pulse">
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 skeleton rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-32 skeleton" />
                <div className="h-4 w-48 skeleton" />
                <div className="h-3 w-40 skeleton" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 skeleton rounded-2xl" />
            ))}
          </div>
        </div>
      )}

      {progress && !loading && (
        <>
          {/* Score principal */}
          <div className={`${scoreBg} rounded-3xl p-4 sm:p-6 flex items-center gap-4 sm:gap-6`}>
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 shrink-0">
              <svg className="w-20 h-20 sm:w-28 sm:h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" className="dark:stroke-gray-700" strokeWidth="10"/>
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke="url(#scoreGrad2)" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40 * score / 100} ${2 * Math.PI * 40 * (1 - score / 100)}`}
                />
                <defs>
                  <linearGradient id="scoreGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={score >= 75 ? '#10B981' : score >= 50 ? '#3B82F6' : '#F59E0B'} />
                    <stop offset="100%" stopColor={score >= 75 ? '#14B8A6' : score >= 50 ? '#6366F1' : '#EF4444'} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl sm:text-2xl font-black ${scoreText}`}>{score}%</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5">maîtrise</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className={`text-lg sm:text-xl font-black ${scoreText}`}>{selectedSubject?.nom}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                {score >= 75 ? 'Excellente maîtrise ! Continuez à maintenir ce niveau.' : score >= 50 ? 'Bonne progression ! Quelques efforts encore pour maîtriser cette matière.' : 'Encore du chemin, mais vous êtes sur la bonne voie !'}
              </p>
              {progress.matiere?.date_examen && (
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                  Examen : {new Date(progress.matiere.date_examen).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                </div>
              )}
              {progress.temps_estime_restant_minutes > 0 && (
                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Temps estimé restant : ~{Math.round(progress.temps_estime_restant_minutes / 60 * 10) / 10}h
                </div>
              )}
            </div>
          </div>

          {/* Cartes stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: FileText, label: 'Documents', value: progress.documents?.total, sub: 'importés', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-100 dark:border-blue-800/30' },
              { icon: BookOpen, label: 'Quiz', value: progress.quizs?.total, sub: `${progress.quizs?.total_questions} questions`, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-100 dark:border-violet-800/30' },
              { icon: Target, label: 'Réussite QCM', value: `${progress.quiz_results?.taux_reussite || 0}%`, sub: `${progress.quiz_results?.correctes}/${progress.quiz_results?.total_reponses}`, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-100 dark:border-emerald-800/30' },
              { icon: Zap, label: 'Exercices', value: progress.exercises?.total || 0, sub: `${progress.exercises?.correctes || 0} justes`, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-100 dark:border-amber-800/30' },
              { icon: Brain, label: 'Flashcards', value: progress.flashcards?.total || 0, sub: `${progress.flashcards?.reviews || 0} révisions`, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-100 dark:border-pink-800/30' },
              { icon: MessageSquare, label: 'Sessions Chat', value: progress.chatbot?.conversations, sub: `${progress.chatbot?.messages} messages`, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-100 dark:border-indigo-800/30' },
            ].map(({ icon: Icon, label, value, sub, color, bg, border }) => (
              <div key={label} className={`${bg} border ${border} rounded-2xl p-4 flex flex-col gap-2`}>
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className={`text-2xl font-black ${color}`}>{value ?? '—'}</div>
                <div>
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-300">{label}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Graphique évolution score */}
          {chartData.length > 1 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Évolution du score QCM
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                      formatter={(value) => [`${value}%`, 'Score']}
                      labelFormatter={(label) => `Quiz #${label}`}
                    />
                    <Area type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Barres de progression par catégorie */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-5 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Détail de la progression
            </h4>
            <div className="space-y-4">
              {[
                { label: 'Documents couverts', pct: Math.min(progress.documents?.total * 12.5, 100), color: 'from-blue-500 to-blue-400' },
                { label: 'Taux de réussite QCM', pct: progress.quiz_results?.taux_reussite || 0, color: 'from-violet-500 to-indigo-400' },
                { label: 'Exercices réussis', pct: progress.exercises?.total > 0 ? Math.round(progress.exercises.correctes / progress.exercises.total * 100) : 0, color: 'from-amber-500 to-orange-400' },
                { label: 'Efficacité flashcards', pct: progress.flashcards?.avg_efficacite || 0, color: 'from-pink-500 to-rose-400' },
                { label: 'Engagement chatbot', pct: Math.min(progress.chatbot?.conversations * 10, 100), color: 'from-emerald-500 to-teal-400' },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    <span>{label}</span><span>{Math.round(pct)}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analyse IA */}
          {progress.ia_analyse && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-100/50 dark:border-indigo-800/30 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Analyse IA — Conseils personnalisés</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{progress.ia_analyse}</p>
            </div>
          )}
        </>
      )}

      {!loading && !progress && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Sélectionnez une matière pour voir votre progression.</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// ONGLET 2 — CALENDRIER DE RÉVISION
// ============================================
function CalendarTab({ subjects }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newSessionDate, setNewSessionDate] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/planning/sessions?month=${currentMonth + 1}&year=${currentYear}`);
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const getSessionsForDay = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessions.filter(s => s.date_session?.startsWith(dateStr));
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  const handleDeleteSession = async (id) => {
    try {
      await api.delete(`/planning/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Session supprimée');
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const handleStatusToggle = async (session) => {
    const newStatus = session.statut === 'complete' ? 'planifie' : 'complete';
    try {
      const res = await api.patch(`/planning/sessions/${session.id}`, { statut: newStatus });
      setSessions(prev => prev.map(s => s.id === session.id ? res.data : s));
    } catch {
      toast.error('Erreur mise à jour');
    }
  };

  const selectedDaySessions = selectedDay ? getSessionsForDay(selectedDay) : [];
  const selectedDateStr = selectedDay
    ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* CALENDRIER */}
      <div className="flex-1 min-w-0">
        {/* Navigation mois */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
            <button onClick={() => {
              if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
              else setCurrentMonth(m => m - 1);
              setSelectedDay(null);
            }} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <h3 className="text-base font-bold text-white">
              {MONTHS_FR[currentMonth]} {currentYear}
            </h3>
            <button onClick={() => {
              if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
              else setCurrentMonth(m => m + 1);
              setSelectedDay(null);
            }} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
            {DAYS_FR.map(d => (
              <div key={d} className="py-3 text-center text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Grille des jours */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {/* Cellules vides avant le 1er */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[50px] sm:min-h-[80px] border-b border-r border-gray-50/50 dark:border-gray-800/50" />
              ))}

              {/* Jours du mois */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const daySessions = getSessionsForDay(day);
                const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                const isSelected = day === selectedDay;
                const isPast = new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const col = (firstDay + day - 1) % 7;
                const isLastCol = col === 6;

                return (
                  <div key={day}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[50px] sm:min-h-[80px] p-1.5 sm:p-2 border-b border-r border-gray-50/80 dark:border-gray-800/50 cursor-pointer transition-all duration-150 ${
                      isSelected ? 'bg-blue-50/80 dark:bg-blue-950/30 ring-1 ring-inset ring-blue-300' :
                      isToday ? 'bg-indigo-50/50 dark:bg-indigo-950/30' :
                      isPast ? 'bg-gray-50/30 dark:bg-gray-950' : 'hover:bg-gray-50/60 dark:hover:bg-gray-800/50'
                    } ${isLastCol ? 'border-r-0' : ''}`}>
                    <div className={`text-xs font-bold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-blue-600 text-white' : isPast ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
                    }`}>{day}</div>
                    <div className="space-y-0.5">
                      {daySessions.slice(0, 3).map(s => (
                        <div key={s.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          TYPE_CONFIG[s.type]?.light || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        } truncate ${s.statut === 'complete' ? 'opacity-50 line-through' : ''}`}>
                          {s.titre || TYPE_CONFIG[s.type]?.label}
                        </div>
                      ))}
                      {daySessions.length > 3 && (
                        <div className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold px-1">+{daySessions.length - 3}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Légende */}
        <div className="flex flex-wrap gap-3 mt-4">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </div>
          ))}
        </div>
      </div>

      {/* PANNEAU LATÉRAL — Détail du jour sélectionné */}
      <div className="w-full lg:w-72 lg:shrink-0">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sticky top-4">
          {selectedDay ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{MONTHS_FR[currentMonth]}</div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white">{selectedDay}</div>
                </div>
                <button
                  onClick={() => { setNewSessionDate(selectedDateStr); setShowModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200 dark:shadow-none">
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter
                </button>
              </div>

              {selectedDaySessions.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Aucune session planifiée.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDaySessions.map(s => (
                    <div key={s.id} className={`rounded-2xl p-3 border ${s.statut === 'complete' ? 'opacity-60 bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${TYPE_CONFIG[s.type]?.light}`}>
                            {TYPE_CONFIG[s.type]?.label}
                          </div>
                          <div className={`text-xs font-bold text-gray-800 dark:text-gray-200 truncate ${s.statut === 'complete' ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                            {s.titre || TYPE_CONFIG[s.type]?.label}
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                            {s.heure_debut ? s.heure_debut.substring(0, 5) + ' — ' : ''}{s.duree_minutes} min · {s.matiere_nom}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => handleStatusToggle(s)} title={s.statut === 'complete' ? 'Marquer non complète' : 'Marquer complète'}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${s.statut === 'complete' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-emerald-100 hover:text-emerald-600'}`}>
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDeleteSession(s.id)}
                            className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <CalendarDays className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Cliquez sur un jour<br />pour voir les sessions.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <CreateSessionModal
          subjects={subjects}
          selectedDate={newSessionDate}
          onClose={() => setShowModal(false)}
          onCreated={(session) => {
            setSessions(prev => [...prev, session]);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// ONGLET 3 — PLANNING IA
// ============================================
const REVISION_TYPES = [
  { key: 'chatbot', label: 'Chatbot IA', color: 'indigo' },
  { key: 'resume', label: 'Résumé', color: 'blue' },
  { key: 'flashcard', label: 'Flashcards', color: 'violet' },
];

const EXERCICE_TYPES = [
  { key: 'exercices', label: 'Exercices', color: 'emerald' },
  { key: 'qcm', label: 'QCM', color: 'amber' },
  { key: 'vrai_faux', label: 'Vrai ou Faux', color: 'rose' },
];

function AIPlanningTab({ subjects }) {
  const [form, setForm] = useState({
    matiereId: subjects[0]?.id || '',
    dateExamen: '',
    disponibilitesMinutesParJour: 60,
    revisionTypes: ['chatbot', 'resume', 'flashcard'],
    exerciceTypes: ['exercices', 'qcm', 'vrai_faux'],
    revisionMinutes: 30,
    exerciceMinutes: 30,
  });
  const [loading, setLoading] = useState(false);
  const [aiPlanning, setAiPlanning] = useState(null);

  const toggleRevisionType = (key) => {
    setForm(f => {
      const types = f.revisionTypes.includes(key)
        ? f.revisionTypes.filter(t => t !== key)
        : [...f.revisionTypes, key];
      return { ...f, revisionTypes: types };
    });
  };

  const toggleExerciceType = (key) => {
    setForm(f => {
      const types = f.exerciceTypes.includes(key)
        ? f.exerciceTypes.filter(t => t !== key)
        : [...f.exerciceTypes, key];
      return { ...f, exerciceTypes: types };
    });
  };

  const handleSplitSlider = (val) => {
    const rev = parseInt(val) || 0;
    setForm(f => {
      const total = f.disponibilitesMinutesParJour || 60;
      return { ...f, revisionMinutes: rev, exerciceMinutes: total - rev };
    });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.matiereId || !form.dateExamen) return toast.error('Matière et date d\'examen requis');
    setLoading(true);
    setAiPlanning(null);
    try {
      const res = await api.post('/planning/generate', form);
      setAiPlanning(res.data);
      toast.success('Planning généré et ajouté à votre calendrier !');
    } catch (err) {
      toast.error('Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Formulaire de génération */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-100/60 dark:border-indigo-800/30 rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Génération IA du planning</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Laissez l'IA créer un planning optimal selon votre niveau actuel.</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Matière à réviser</label>
              <select value={form.matiereId} onChange={e => setForm(f => ({...f, matiereId: e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                {subjects.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Date de l'examen</label>
              <input type="date" value={form.dateExamen} onChange={e => setForm(f => ({...f, dateExamen: e.target.value}))} required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
              Disponibilité quotidienne : <span className="text-blue-600">{Math.round(form.disponibilitesMinutesParJour / 60 * 10) / 10}h/jour</span>
            </label>
            <input type="range" min="30" max="300" step="15"
              value={form.disponibilitesMinutesParJour}
              onChange={e => {
                const total = parseInt(e.target.value) || 60;
                setForm(f => {
                  const rev = f.revisionMinutes || 0;
                  const ex = f.exerciceMinutes || 0;
                  const sum = rev + ex || 1;
                  const revRatio = rev / sum;
                  return {
                    ...f,
                    disponibilitesMinutesParJour: total,
                    revisionMinutes: Math.round(total * revRatio),
                    exerciceMinutes: Math.round(total * (1 - revRatio)),
                  };
                });
              }}
              className="w-full accent-blue-600" />
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1">
              <span>30 min</span><span>5h</span>
            </div>
          </div>

          {/* Activités de révision */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">Activités de révision</label>
            <div className="flex flex-wrap gap-2">
              {REVISION_TYPES.map(t => {
                const active = form.revisionTypes.includes(t.key);
                return (
                  <button key={t.key} type="button" onClick={() => toggleRevisionType(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      active
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activités d'exercices */}
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">Activités d'exercices</label>
            <div className="flex flex-wrap gap-2">
              {EXERCICE_TYPES.map(t => {
                const active = form.exerciceTypes.includes(t.key);
                return (
                  <button key={t.key} type="button" onClick={() => toggleExerciceType(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      active
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Répartition du temps */}
          <div className="bg-gray-50/60 dark:bg-gray-800/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50">
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-3">Répartition du temps</label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Révision</span>
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{form.revisionMinutes} min</span>
              </div>
              <input type="range" min="0" max={form.disponibilitesMinutesParJour} step="5"
                value={form.revisionMinutes}
                onChange={e => handleSplitSlider(e.target.value)}
                className="w-full accent-indigo-600 h-2" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Exercices</span>
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{form.exerciceMinutes} min</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium pt-1 border-t border-gray-200/50 dark:border-gray-700/30">
                <span>Total : {form.revisionMinutes + form.exerciceMinutes} min</span>
                <span>Dispo : {form.disponibilitesMinutesParJour} min</span>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            {loading ? 'L\'IA génère votre planning...' : 'Générer mon planning personnalisé'}
          </button>
        </form>
      </div>

      {/* Planning généré */}
      {aiPlanning && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              Planning pour {aiPlanning.matiereNom}
            </h3>
            <button onClick={() => setAiPlanning(null)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Régénérer
            </button>
          </div>

          {/* Conseil IA */}
          {aiPlanning.planning?.conseil && (
            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-800/30 rounded-2xl p-3 mb-4 text-xs text-indigo-800 dark:text-indigo-300 font-medium flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
              {aiPlanning.planning.conseil}
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {aiPlanning.planning?.sessions?.map((s, idx) => {
              const cfg = TYPE_CONFIG[s.type] || TYPE_CONFIG.revision;
              const sessionDate = s.date_session || s.date;
              return (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800/30">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.light}`}>{cfg.label}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        {new Date(sessionDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate mt-0.5">{s.titre}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{s.duree_minutes} min</div>
                  </div>
                  <span className="w-7 h-7 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600 shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={() => window.location.href = '/planning?tab=calendar'}
              className="w-full py-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all flex items-center justify-center gap-2">
              <CalendarDays className="w-3.5 h-3.5" />
              Voir mon planning complet
            </button>
          </div>
        </div>
      )}
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
  const [activeTab, setActiveTab] = useState('progress');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [subsRes, notifsRes] = await Promise.all([
          api.get('/subjects'),
          api.get('/planning/notifications'),
        ]);
        setSubjects(subsRes.data);
        setUnreadCount(notifsRes.data.unread);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <div className="hidden lg:block w-64 min-h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 p-4 space-y-3">
          <div className="h-8 w-32 skeleton" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-full skeleton rounded-xl" />
          ))}
        </div>
        <div className="flex-1 p-4 sm:p-6 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="h-8 w-48 skeleton" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 w-32 skeleton rounded-xl" />
              ))}
            </div>
            <div className="h-40 w-full skeleton rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const firstName = user.full_name?.split(' ')[0] || 'Étudiant';

  const TABS = [
    { id: 'progress', label: 'Progression', icon: BarChart3 },
    { id: 'calendar', label: 'Calendrier', icon: CalendarDays },
    { id: 'ai', label: 'Planning IA', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar activePath="/planning" onLogout={logout} unreadCount={unreadCount} />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* HEADER */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
              Progression & Planning
            </h1>
            <p className="text-gray-500 mt-0.5 dark:text-gray-400">Suivez votre avancement et organisez vos révisions intelligemment.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link href="/parametres" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm shadow-blue-200 dark:shadow-none cursor-pointer hover:opacity-90 transition">
              {firstName[0]?.toUpperCase()}
            </Link>
          </div>
        </div>

        {/* ONGLETS */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                  activeTab === id
                    ? 'text-blue-700 border-blue-600 bg-blue-50/50'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                <Icon className={`w-4 h-4 ${activeTab === id ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`} />
                {label}
                {id === 'ai' && (
                  <span className="ml-0.5 px-1.5 py-0.5 text-[9px] font-black bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-full">IA</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENU DE L'ONGLET */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 overflow-y-auto">
          {subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <GraduationCap className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-4" />
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Aucune matière trouvée.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Commencez par créer une matière dans la section <Link href="/matieres" className="text-blue-500 underline">Matières</Link>.</p>
            </div>
          ) : (
            <>
              {activeTab === 'progress' && <ProgressTab subjects={subjects} />}
              {activeTab === 'calendar' && <CalendarTab subjects={subjects} />}
              {activeTab === 'ai' && <AIPlanningTab subjects={subjects} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}