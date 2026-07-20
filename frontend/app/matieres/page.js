'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import {
  Brain, Search, Plus, Upload, FileText, Sparkles, ChevronRight, X, Loader2,
  BookOpen, Bot, CalendarDays, Bell, Settings, LogOut, Home, Layers, MessageSquare,
  Award, Zap, CheckCircle, ClipboardList, PenTool, ListChecks, AlertCircle,
  Eye, Trash2, Clock, FileCheck
} from 'lucide-react';

// ============================================
// COMPOSANTS RÉUTILISABLES
// ============================================

const SUBJECT_COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-950/30', ring: 'ring-blue-500/30' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-50 dark:bg-indigo-950/30', ring: 'ring-indigo-500/30' },
  { bg: 'bg-violet-500', light: 'bg-violet-50 dark:bg-violet-950/30', ring: 'ring-violet-500/30' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-950/30', ring: 'ring-emerald-500/30' },
  { bg: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-950/30', ring: 'ring-amber-500/30' },
  { bg: 'bg-rose-500', light: 'bg-rose-50 dark:bg-rose-950/30', ring: 'ring-rose-500/30' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-50 dark:bg-cyan-950/30', ring: 'ring-cyan-500/30' },
  { bg: 'bg-pink-500', light: 'bg-pink-50 dark:bg-pink-950/30', ring: 'ring-pink-500/30' },
];

function SubjectTag({ subject, selected, onClick, index }) {
  const color = SUBJECT_COLORS[(index || 0) % SUBJECT_COLORS.length];
  const docCount = subject.documents_count || 0;

  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-3.5 px-5 py-3.5 rounded-2xl border-2 transition-all duration-200 text-left w-full ${
        selected
          ? `bg-white dark:bg-gray-900 border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 ring-1 ${color.ring}`
          : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl ${color.light} flex items-center justify-center shrink-0`}>
        <Layers className={`w-5 h-5 ${color.bg} text-white`} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${selected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
          {subject.nom}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {docCount} document{docCount !== 1 ? 's' : ''}
        </p>
      </div>
      {selected && (
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
          <CheckCircle className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </button>
  );
}

function ResultCard({ icon: Icon, title, description, color }) {
  const accentColors = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600', border: 'border-blue-100 dark:border-blue-900/50' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600', border: 'border-amber-100 dark:border-amber-900/50' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600', border: 'border-emerald-100 dark:border-emerald-900/50' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600', border: 'border-violet-100 dark:border-violet-900/50' },
  };
  const accent = accentColors[color] || accentColors.blue;

  return (
    <div className={`bg-white rounded-2xl border ${accent.border} p-5 shadow-sm hover:shadow-md transition-all duration-200 dark:bg-gray-900`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${accent.bg}`}>
          <Icon className={`w-5 h-5 ${accent.text}`} strokeWidth={1.8} />
        </div>
        <h3 className="font-bold text-gray-800 dark:text-gray-200">{title}</h3>
      </div>
      <div className="w-full">
        {typeof description === 'string' ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{description || 'Aucun résultat.'}</p>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-1">{description}</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// COMPOSANT QUIZ
// ============================================

function QuizQuestion({ question, index, total, selectedAnswer, onSelect, showResult, isCorrect }) {
  const optionLabels = ['A', 'B', 'C', 'D'];

  const getOptionClass = (idx) => {
    if (!showResult) return 'hover:bg-gray-50 dark:hover:bg-gray-800';
    const letter = optionLabels[idx];
    const isSelected = selectedAnswer === letter;
    const isCorrectAnswer = question.bonne_reponse?.charAt(0) === letter;

    if (isSelected && isCorrectAnswer) return 'bg-green-100 border-green-400 dark:bg-green-950/30 dark:border-green-700';
    if (isSelected && !isCorrectAnswer) return 'bg-red-100 border-red-400 dark:bg-red-950/30 dark:border-red-700';
    if (isCorrectAnswer && showResult) return 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-700';
    return 'hover:bg-gray-50 dark:hover:bg-gray-800';
  };

  return (
    <div className={`bg-white rounded-xl border p-4 mb-4 dark:bg-gray-900 ${
      showResult
        ? isCorrect
          ? 'border-green-300 shadow-sm shadow-green-100 dark:border-green-700 dark:shadow-none'
          : 'border-red-300 shadow-sm shadow-red-100 dark:border-red-700 dark:shadow-none'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-start gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-500 min-w-[60px] dark:text-gray-400">
          Q{index + 1}/{total}
        </span>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{question.contenu}</p>
      </div>

      <div className="space-y-1.5 ml-2">
        {question.options?.map((opt, i) => {
          const letter = optionLabels[i];
          const isSelected = selectedAnswer === letter;
          const isCorrectAnswer = question.bonne_reponse?.charAt(0) === letter;

          return (
            <label
              key={i}
              className={`flex items-center gap-3 p-2 rounded-lg border transition-all duration-200 cursor-pointer ${getOptionClass(i)}`}
            >
              <input
                type="radio"
                name={`q${question.id}`}
                value={letter}
                checked={isSelected}
                onChange={() => onSelect(question.id, letter)}
                disabled={showResult}
                className="w-4 h-4 text-blue-600 disabled:opacity-60"
              />
              <span className={`text-sm ${showResult && isSelected && !isCorrectAnswer ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {opt}
              </span>
              {showResult && isSelected && isCorrectAnswer && (
                <span className="text-xs text-green-600 font-semibold ml-auto">✅</span>
              )}
              {showResult && isSelected && !isCorrectAnswer && (
                <span className="text-xs text-red-600 font-semibold ml-auto">❌</span>
              )}
              {showResult && !isSelected && isCorrectAnswer && (
                <span className="text-xs text-green-500 ml-auto">✓ Bonne réponse</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================
export default function MatieresPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Quiz
  const [selectedQuizDoc, setSelectedQuizDoc] = useState('');
  const [quizQuestions, setQuizQuestions] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState('Moyen');
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Exercices
  const [selectedExerciseDoc, setSelectedExerciseDoc] = useState('');
  const [exerciseCount, setExerciseCount] = useState(3);
  const [exerciseDifficulty, setExerciseDifficulty] = useState('Moyen');
  const [generatingExercise, setGeneratingExercise] = useState(false);
  const [exerciseData, setExerciseData] = useState(null);
  const [showExercise, setShowExercise] = useState(false);
  const [exerciseAnswers, setExerciseAnswers] = useState({});
  const [exerciseResults, setExerciseResults] = useState({});
  const [showCorrection, setShowCorrection] = useState(false);

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
        fetchDocuments(res.data[0].id);
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

  const fetchDocuments = async (matiereId) => {
    try {
      const res = await api.get(`/documents/${matiereId}`);
      setDocuments(res.data);
    } catch (err) {
      console.error('Erreur chargement documents:', err);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/subjects', { nom: newSubjectName });
      setSubjects([res.data, ...subjects]);
      setSelectedSubject(res.data);
      setNewSubjectName('');
    } catch (err) {
      console.error('Erreur création matière:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedSubject) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('matiereId', selectedSubject.id);
    try {
      const uploadRes = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newDoc = uploadRes.data;

      const analysisRes = await api.post('/ai/analyze', { documentId: newDoc.id });
      setAnalysisResult(analysisRes.data);
      fetchDocuments(selectedSubject.id);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    fetchDocuments(subject.id);
    setAnalysisResult(null);
    setQuizData(null);
    setShowQuiz(false);
    setShowResults(false);
    setUserAnswers({});
    setExerciseData(null);
    setShowExercise(false);
    setExerciseAnswers({});
    setExerciseResults({});
    setShowCorrection(false);
  };

  const handleViewAnalysis = async (docId) => {
    setLoadingAnalysis(true);
    try {
      const res = await api.get(`/ai/analysis/${docId}`);
      setAnalysisResult(res.data);
    } catch (err) {
      console.error('Erreur récupération analyse:', err);
      alert('Aucune analyse disponible pour ce document.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Quiz
  const handleGenerateQuiz = async () => {
    if (!selectedQuizDoc) {
      alert('Veuillez sélectionner un document');
      return;
    }
    setGeneratingQuiz(true);
    setShowQuiz(false);
    setShowResults(false);
    setUserAnswers({});
    try {
      const res = await api.post('/quizzes/generate', {
        documentId: parseInt(selectedQuizDoc),
        numQuestions: quizQuestions,
        difficulty: quizDifficulty,
      });
      setQuizData(res.data);
      setShowQuiz(true);
    } catch (err) {
      console.error('Erreur génération quiz:', err);
      alert('Erreur lors de la génération du quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSelectAnswer = (questionId, answer) => {
    if (showResults) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleShowResults = () => {
    if (!quizData?.questions) return;
    let correct = 0;
    const total = quizData.questions.length;

    quizData.questions.forEach((q) => {
      const userAnswer = userAnswers[q.id];
      const correctAnswer = q.bonne_reponse;

      const userMatch = String(userAnswer || '').match(/[A-D]/i);
      const correctMatch = String(correctAnswer || '').match(/[A-D]/i);

      const normalizedUser = userMatch ? userMatch[0].toUpperCase() : '';
      const normalizedCorrect = correctMatch ? correctMatch[0].toUpperCase() : '';

      if (normalizedUser && normalizedCorrect && normalizedUser === normalizedCorrect) {
        correct++;
      }
    });

    setScore({ correct, total });
    setShowResults(true);
  };

  const handleReviewErrors = () => {
    setShowResults(false);
  };

  // Exercices
  const handleGenerateExercise = async () => {
    if (!selectedExerciseDoc) {
      alert('Veuillez sélectionner un document');
      return;
    }
    setGeneratingExercise(true);
    setShowExercise(false);
    setExerciseAnswers({});
    setExerciseResults({});
    setShowCorrection(false);
    try {
      const res = await api.post('/exercises/generate', {
        documentId: parseInt(selectedExerciseDoc),
        numExercises: exerciseCount,
        difficulty: exerciseDifficulty,
      });
      setExerciseData(res.data);
      setShowExercise(true);
    } catch (err) {
      console.error('Erreur génération exercices:', err);
      alert('Erreur lors de la génération des exercices');
    } finally {
      setGeneratingExercise(false);
    }
  };

  const handleCheckExercises = async () => {
    // Vérifier que toutes les réponses sont fournies
    const allAnswered = exerciseData.exercises.every((_, idx) => {
      const ans = exerciseAnswers[idx];
      return ans && ans.trim() !== '';
    });
    if (!allAnswered) {
      alert('Veuillez répondre à tous les exercices avant de voir les corrections.');
      return;
    }

    // Vérifier que chaque exercice a une question et une réponse correcte valides
    const allValid = exerciseData.exercises.every((ex) => {
      const q = ex.question && ex.question.trim() !== '';
      const c = ex.correctAnswer && ex.correctAnswer.trim() !== '';
      return q && c;
    });
    if (!allValid) {
      alert('Certains exercices générés sont incomplets. Veuillez les régénérer.');
      return;
    }

    setShowCorrection(true);
    const payload = {
      exercises: exerciseData.exercises.map(ex => ({
        question: ex.question.trim(),
        type: ex.type || 'ouverte',
        correctAnswer: ex.correctAnswer.trim(),
      })),
      userAnswers: exerciseData.exercises.map((_, idx) => (exerciseAnswers[idx] || '').trim()),
    };
    try {
      const res = await api.post('/exercises/check', payload);
      const resultsArray = res.data.results;
      const results = {};
      resultsArray.forEach((r, idx) => { results[idx] = r; });
      setExerciseResults(results);
    } catch (err) {
      console.error('Erreur vérification exercices', err);
      if (err.response && err.response.status === 400) {
        alert('Erreur 400 : vérifiez que tous les exercices ont une question et une réponse correcte valides.');
      }
      const fallbackResults = {};
      exerciseData.exercises.forEach((ex, idx) => {
        fallbackResults[idx] = {
          isCorrect: false,
          feedback: 'Erreur de vérification. Veuillez réessayer.',
          correctAnswer: ex.correctAnswer,
        };
      });
      setExerciseResults(fallbackResults);
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

  const allAnsweredQuiz = quizData?.questions?.every((q) => userAnswers[q.id] !== undefined);
  const allAnsweredExercises = exerciseData?.exercises?.every((_, idx) => {
    const ans = exerciseAnswers[idx];
    return ans && ans.trim() !== '';
  });

  return (
    <div className="min-h-screen bg-white flex dark:bg-gray-950">
      <Sidebar activePath="/matieres" onLogout={logout} />

      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-blue-600" />
                Gestion des matières
              </h1>
              <p className="text-gray-500 mt-0.5 dark:text-gray-400">Gérez vos matières et importez vos documents pour l'analyse IA.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher une matière..."
                  className="pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                />
              </div>
              <button className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors dark:hover:bg-gray-800">
                <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">3</span>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md shadow-blue-200 dark:shadow-none">
                {user.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>

          {/* AJOUT / SÉLECTION MATIÈRE */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nouvelle matière (ex: Intelligence Artificielle)"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm transition-all text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                />
              </div>
              <button
                onClick={handleAddSubject}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-200 dark:shadow-none disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Ajouter
              </button>
              <button className="px-6 py-2.5 border border-blue-600 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 transition-all dark:hover:bg-blue-950/30">
                Sélectionner
              </button>
            </div>
          </div>

          {/* LISTE DES MATIÈRES */}
          {subjects.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
              {subjects.map((s, idx) => (
                <SubjectTag
                  key={s.id}
                  subject={s}
                  selected={selectedSubject?.id === s.id}
                  onClick={() => handleSelectSubject(s)}
                  index={idx}
                />
              ))}
            </div>
          )}

          {/* UPLOAD DE DOCUMENTS */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-blue-300 p-8 text-center mb-8 transition-all hover:border-blue-400 hover:bg-blue-50/30 dark:bg-gray-900 dark:border-blue-800 dark:hover:bg-blue-950/20">
            <Upload className="w-14 h-14 text-blue-500 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-gray-700 font-medium dark:text-gray-300">Glissez-déposez votre document ici</p>
            <p className="text-sm text-gray-400 mb-4 dark:text-gray-500">ou cliquez pour sélectionner un fichier</p>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept=".pdf,.docx,.pptx,.jpg,.png"
              disabled={!selectedSubject || uploading}
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                selectedSubject && !uploading
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 dark:shadow-none'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Choisir un fichier
                </>
              )}
            </label>
            <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              PDF, DOCX, PPTX, JPG, PNG – Max 50 Mo
            </div>
            {!selectedSubject && (
              <p className="mt-4 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-full inline-block dark:bg-amber-950/30 dark:text-amber-400">
                ⚠️ Veuillez sélectionner une matière avant d'importer.
              </p>
            )}
          </div>

          {/* LISTE DES DOCUMENTS */}
          {documents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 dark:text-gray-200">
                <FileText className="w-5 h-5 text-blue-500" />
                Documents déposés
                <span className="text-sm font-normal text-gray-400 ml-1 dark:text-gray-500">({documents.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`bg-white rounded-2xl border p-5 shadow-sm transition-all duration-200 dark:bg-gray-900 ${
                      doc.has_resume
                        ? 'border-blue-200 hover:shadow-md hover:border-blue-300 cursor-pointer dark:border-blue-800 dark:hover:border-blue-700'
                        : 'border-gray-100 dark:border-gray-800'
                    }`}
                    onClick={() => doc.has_resume && handleViewAnalysis(doc.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${doc.has_resume ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          {doc.has_resume ? (
                            <FileCheck className="w-5 h-5 text-blue-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate text-sm dark:text-gray-200">{doc.nom_fichier}</p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 dark:text-gray-500">
                            <Clock className="w-3 h-3" />
                            {new Date(doc.uploaded_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    {doc.has_resume ? (
                      <button
                        disabled={loadingAnalysis}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-all disabled:opacity-50 dark:bg-blue-950/30 dark:hover:bg-blue-900/30"
                      >
                        {loadingAnalysis ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        Voir l'analyse IA
                      </button>
                    ) : (
                      <p className="mt-3 text-xs text-gray-400 text-center italic dark:text-gray-500">Non analysé</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RÉSULTATS IA */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 dark:text-gray-200">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Résultats de l'analyse IA
            </h2>
            {analysisResult ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResultCard
                  icon={FileText}
                  title="Résumé court"
                  description={analysisResult.summaryShort}
                  color="blue"
                />
                <ResultCard
                  icon={BookOpen}
                  title="Résumé détaillé"
                  description={analysisResult.summaryLong}
                  color="blue"
                />
                <ResultCard
                  icon={Award}
                  title="Points clés"
                  color="amber"
                  description={
                    Array.isArray(analysisResult.keyPoints) && analysisResult.keyPoints.length > 0 ? (
                      <ul className="space-y-2">
                        {analysisResult.keyPoints.map((p, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="mt-1 w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{typeof p === 'string' ? p : JSON.stringify(p)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 italic">Aucun point clé disponible.</p>
                    )
                  }
                />
                <ResultCard
                  icon={CheckCircle}
                  title="Définitions importantes"
                  color="emerald"
                  description={
                    Array.isArray(analysisResult.definitions) && analysisResult.definitions.length > 0 ? (
                      <div className="space-y-3">
                        {analysisResult.definitions.map((d, i) => {
                          const terme = typeof d === 'object' ? (d.terme || d.term || Object.values(d)[0] || JSON.stringify(d)) : d;
                          const definition = typeof d === 'object' ? (d.definition || d.def || '') : '';
                          return (
                            <div key={i} className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30">
                              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{terme}</p>
                              {definition && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{definition}</p>}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 italic">Aucune définition disponible.</p>
                    )
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResultCard
                  icon={FileText}
                  title="Résumé court"
                  description="Importez un document pour générer un résumé IA."
                  color="blue"
                />
                <ResultCard
                  icon={BookOpen}
                  title="Résumé détaillé"
                  description="Importez un document pour générer un résumé détaillé."
                  color="blue"
                />
                <ResultCard
                  icon={Award}
                  title="Points clés"
                  description="Importez un document pour extraire les points clés."
                  color="amber"
                />
                <ResultCard
                  icon={CheckCircle}
                  title="Définitions importantes"
                  description="Importez un document pour extraire les définitions."
                  color="emerald"
                />
              </div>
            )}
          </div>

          {/* QUIZ */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 dark:bg-gray-900 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 dark:text-gray-200">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              Générer un quiz
            </h2>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedQuizDoc}
                onChange={(e) => setSelectedQuizDoc(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white min-w-[180px] text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              >
                <option value="">Sélectionner un document</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.nom_fichier}</option>
                ))}
              </select>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-500 mr-1 dark:text-gray-400">Questions :</span>
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuizQuestions(n)}
                    className={`px-3 py-1.5 border rounded-full text-sm transition-all ${
                      quizQuestions === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-blue-50 text-gray-700 dark:hover:bg-blue-950/30 dark:text-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-500 mr-1 dark:text-gray-400">Niveau :</span>
                {['Facile', 'Moyen', 'Difficile'].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuizDifficulty(n)}
                    className={`px-3 py-1.5 border rounded-full text-sm transition-all ${
                      quizDifficulty === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-blue-50 text-gray-700 dark:hover:bg-blue-950/30 dark:text-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerateQuiz}
                disabled={generatingQuiz}
                className="ml-auto px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-200 dark:shadow-none disabled:opacity-60 flex items-center gap-2"
              >
                {generatingQuiz && <Loader2 className="w-4 h-4 animate-spin" />}
                {generatingQuiz ? 'Génération...' : 'Commencer le quiz'}
              </button>
            </div>

            {showQuiz && quizData && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2 dark:text-gray-200">
                    <ListChecks className="w-4 h-4 text-blue-500" />
                    {quizData.titre}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Object.keys(userAnswers).length}/{quizData.questions?.length || 0} répondues
                  </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {quizData.questions?.map((q, i) => (
                    <QuizQuestion
                      key={q.id}
                      question={q}
                      index={i}
                      total={quizData.questions.length}
                      selectedAnswer={userAnswers[q.id]}
                      onSelect={handleSelectAnswer}
                      showResult={showResults}
                      isCorrect={userAnswers[q.id]?.charAt(0) === q.bonne_reponse?.charAt(0)}
                    />
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {!showResults ? (
                    <>
                      <button
                        onClick={handleShowResults}
                        disabled={!allAnsweredQuiz}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Voir les résultats
                      </button>
                      {!allAnsweredQuiz && (
                        <span className="text-sm text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Répondez à toutes les questions
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Score : <strong className="text-blue-600">{score.correct}/{score.total}</strong>
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({Math.round((score.correct / score.total) * 100)}%)
                        </span>
                      </div>
                      <button
                        onClick={handleReviewErrors}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-200 dark:shadow-none"
                      >
                        Revoir les erreurs
                      </button>
                      <button
                        onClick={() => {
                          setUserAnswers({});
                          setShowResults(false);
                          setQuizData(null);
                          setShowQuiz(false);
                        }}
                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-all dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Recommencer
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/* EXERCICES (version interactive corrigée) */}
          {/* ========================================== */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 dark:text-gray-200">
              <PenTool className="w-5 h-5 text-blue-500" />
              Générer des exercices
            </h2>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedExerciseDoc}
                onChange={(e) => setSelectedExerciseDoc(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white min-w-[180px] text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              >
                <option value="">Sélectionner un document</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.nom_fichier}</option>
                ))}
              </select>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-500 mr-1 dark:text-gray-400">Exercices :</span>
                {[3, 5, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => setExerciseCount(n)}
                    className={`px-3 py-1.5 border rounded-full text-sm transition-all ${
                      exerciseCount === n ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-blue-50 text-gray-700 dark:hover:bg-blue-950/30 dark:text-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-500 mr-1 dark:text-gray-400">Niveau :</span>
                {['Facile', 'Moyen', 'Difficile'].map((n) => (
                  <button
                    key={n}
                    onClick={() => setExerciseDifficulty(n)}
                    className={`px-3 py-1.5 border rounded-full text-sm transition-all ${
                      exerciseDifficulty === n ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-blue-50 text-gray-700 dark:hover:bg-blue-950/30 dark:text-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerateExercise}
                disabled={generatingExercise}
                className="ml-auto px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 dark:shadow-none disabled:opacity-60 flex items-center gap-2"
              >
                {generatingExercise && <Loader2 className="w-4 h-4 animate-spin" />}
                {generatingExercise ? 'Génération...' : 'Générer des exercices'}
              </button>
            </div>

            {showExercise && exerciseData && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 dark:bg-gray-950 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 dark:text-gray-200">
                  <PenTool className="w-4 h-4 text-emerald-500" />
                  Exercices générés
                </h3>
                <div className="space-y-4">
                  {exerciseData.exercises?.map((ex, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
                      <p className="font-medium text-gray-800 dark:text-gray-200">Exercice {idx + 1}</p>
                      <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">{ex.question}</p>

                      {/* Zone de réponse */}
                      <div className="mt-2">
                        {ex.options ? (
                          <div className="space-y-1">
                            {ex.options.map((opt, j) => (
                              <label key={j} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                  type="radio"
                                  name={`exercise-${idx}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const newAnswers = { ...exerciseAnswers, [idx]: e.target.value };
                                    setExerciseAnswers(newAnswers);
                                  }}
                                  disabled={showCorrection}
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Votre réponse..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            value={exerciseAnswers[idx] || ''}
                            onChange={(e) => {
                              const newAnswers = { ...exerciseAnswers, [idx]: e.target.value };
                              setExerciseAnswers(newAnswers);
                            }}
                            disabled={showCorrection}
                          />
                        )}
                      </div>

                      {/* Correction */}
                      {showCorrection && exerciseResults[idx] && (
                        <div className={`mt-2 p-2 rounded-lg ${exerciseResults[idx].isCorrect ? 'bg-green-100 border border-green-300 dark:bg-green-950/30 dark:border-green-700' : 'bg-red-100 border border-red-300 dark:bg-red-950/30 dark:border-red-700'}`}>
                          <p className="text-sm font-medium">
                            {exerciseResults[idx].isCorrect ? '✅ Correct' : '❌ Incorrect'}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">Réponse correcte : {ex.correctAnswer}</p>
                          {exerciseResults[idx].feedback && (
                            <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">{exerciseResults[idx].feedback}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Boutons d'action */}
                <div className="mt-4 flex gap-3">
                  {!showCorrection ? (
                    <button
                      onClick={handleCheckExercises}
                      disabled={!allAnsweredExercises}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Voir les corrections
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setShowCorrection(false);
                          setExerciseResults({});
                          setExerciseAnswers({});
                          setShowExercise(false);
                          setExerciseData(null);
                        }}
                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Recommencer
                      </button>
                      <button
                        onClick={() => {
                          setShowCorrection(false);
                          setExerciseResults({});
                          setExerciseAnswers({});
                          setShowExercise(false);
                          setExerciseData(null);
                        }}
                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Fermer
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}