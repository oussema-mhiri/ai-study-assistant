'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import {
  Brain, Plus, Upload, FileText, Sparkles, X, Loader2,
  BookOpen, Bell, Settings, Layers,
  Award, Zap, CheckCircle, ClipboardList, PenTool, ListChecks, AlertCircle,
  Eye, Trash2, Clock, FileCheck, RotateCcw, FlipVertical, ToggleLeft, Play, ExternalLink
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

function SubjectTag({ subject, selected, onClick, index, onDelete }) {
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
      {onDelete && (
        <div onClick={(e) => onDelete(e, subject.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer" title="Supprimer">
          <X className="w-3 h-3" />
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
  const isTrueFalse = question.type === 'true_false';

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
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{question.contenu}</p>
          {isTrueFalse && (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full dark:bg-violet-950/30 dark:text-violet-400">
              Vrai / Faux
            </span>
          )}
        </div>
      </div>

      {isTrueFalse ? (
        <div className="flex gap-3 ml-2 mt-3">
          {['A', 'B'].map((letter, i) => {
            const isSelected = selectedAnswer === letter;
            const isCorrectAnswer = question.bonne_reponse?.charAt(0) === letter;
            const label = i === 0 ? 'Vrai' : 'Faux';
            return (
              <button
                key={letter}
                onClick={() => !showResult && onSelect(question.id, letter)}
                disabled={showResult}
                className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                  showResult
                    ? isSelected && isCorrectAnswer
                      ? 'bg-green-100 border-green-400 text-green-700 dark:bg-green-950/30 dark:border-green-700 dark:text-green-400'
                      : isSelected && !isCorrectAnswer
                        ? 'bg-red-100 border-red-400 text-red-700 dark:bg-red-950/30 dark:border-red-700 dark:text-red-400'
                        : isCorrectAnswer
                          ? 'bg-green-50 border-green-300 text-green-600 dark:bg-green-950/30 dark:border-green-700 dark:text-green-400'
                          : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700'
                    : isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-600'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : (
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
                  <span className="text-xs text-green-600 font-semibold ml-auto">Correct</span>
                )}
                {showResult && isSelected && !isCorrectAnswer && (
                  <span className="text-xs text-red-600 font-semibold ml-auto">Incorrect</span>
                )}
                {showResult && !isSelected && isCorrectAnswer && (
                  <span className="text-xs text-green-500 ml-auto">Bonne réponse</span>
                )}
              </label>
            );
          })}
        </div>
      )}
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
  const [quizUseAdaptive, setQuizUseAdaptive] = useState(false);
  const [adaptiveQuizInfo, setAdaptiveQuizInfo] = useState(null);
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
  const [exerciseUseAdaptive, setExerciseUseAdaptive] = useState(false);
  const [adaptiveExerciseInfo, setAdaptiveExerciseInfo] = useState(null);
  const [generatingExercise, setGeneratingExercise] = useState(false);
  const [exerciseData, setExerciseData] = useState(null);
  const [showExercise, setShowExercise] = useState(false);
  const [exerciseAnswers, setExerciseAnswers] = useState({});
  const [exerciseResults, setExerciseResults] = useState({});
  const [showCorrection, setShowCorrection] = useState(false);

  // Flashcards
  const [selectedFlashcardDoc, setSelectedFlashcardDoc] = useState('');
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardStats, setFlashcardStats] = useState(null);
  const [showFlashcardReview, setShowFlashcardReview] = useState(false);
  const [dueCards, setDueCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Notifications
  const [unreadCount, setUnreadCount] = useState(0);

  // Ressources
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Timer exercices
  const exerciseStartTime = useRef(Date.now());
  const [exerciseResponseTimes, setExerciseResponseTimes] = useState({});

  // Timer quiz
  const quizStartTime = useRef(Date.now());
  const [quizResponseTimes, setQuizResponseTimes] = useState({});

  // Vrai/Faux
  const [selectedTFDoc, setSelectedTFDoc] = useState('');
  const [tfQuestions, setTfQuestions] = useState(5);
  const [tfDifficulty, setTfDifficulty] = useState('Moyen');
  const [tfUseAdaptive, setTfUseAdaptive] = useState(false);
  const [adaptiveTFInfo, setAdaptiveTFInfo] = useState(null);
  const [generatingTF, setGeneratingTF] = useState(false);
  const [tfData, setTfData] = useState(null);
  const [showTF, setShowTF] = useState(false);
  const [tfAnswers, setTfAnswers] = useState({});
  const [tfShowResults, setTfShowResults] = useState(false);
  const [tfScore, setTfScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchResources = async (matiereId) => {
    setLoadingResources(true);
    try {
      const res = await api.get(`/resources/recommendations/${matiereId}`);
      setResources(res.data.resources || []);
    } catch (err) {
      console.error('Erreur ressources:', err);
      setResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
      if (res.data.length > 0) {
        setSelectedSubject(res.data[0]);
        fetchDocuments(res.data[0].id);
        fetchResources(res.data[0].id);
      }
    } catch (err) {
      console.error('Erreur chargement matières:', err);
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

  const handleDeleteSubject = async (e, subjectId) => {
    e.stopPropagation();
    if (!confirm('Supprimer cette matière et tous ses documents ?')) return;
    try {
      await api.delete(`/subjects/${subjectId}`);
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      if (selectedSubject?.id === subjectId) {
        setSelectedSubject(null);
        setDocuments([]);
      }
    } catch (err) {
      console.error('Erreur suppression matière:', err);
    }
  };

  const handleDeleteDocument = async (e, docId) => {
    e.stopPropagation();
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (selectedSubject) fetchDocuments(selectedSubject.id);
    } catch (err) {
      console.error('Erreur suppression document:', err);
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
      fetchResources(selectedSubject.id);
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
    setFlashcards([]);
    setFlashcardStats(null);
    setShowFlashcardReview(false);
    setDueCards([]);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setTfData(null);
    setShowTF(false);
    setTfAnswers({});
    setTfShowResults(false);
    setAdaptiveTFInfo(null);
    setResources([]);
    fetchResources(subject.id);
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

  // Fetch adaptive difficulty
  const fetchAdaptiveDifficulty = async (matiereId) => {
    try {
      const res = await api.get(`/progress/adaptive-difficulty/${matiereId}`);
      return res.data;
    } catch (err) {
      console.error('Erreur récupération difficulté adaptative:', err);
      return null;
    }
  };

  // Progression de difficulté
  const getNextDifficulty = (currentDifficulty, scorePercent, useAdaptive) => {
    if (!useAdaptive) return currentDifficulty;
    if (scorePercent >= 75) {
      const levels = ['Facile', 'Moyen', 'Difficile'];
      const idx = levels.indexOf(currentDifficulty);
      return idx < levels.length - 1 ? levels[idx + 1] : 'Difficile';
    }
    return currentDifficulty;
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
    setQuizResponseTimes({});
    quizStartTime.current = Date.now();
    try {
      let effectiveDifficulty = quizDifficulty;
      if (quizUseAdaptive && selectedSubject) {
        const adaptive = await fetchAdaptiveDifficulty(selectedSubject.id);
        if (adaptive) {
          effectiveDifficulty = adaptive.difficulty;
          setAdaptiveQuizInfo(adaptive);
        }
      } else {
        setAdaptiveQuizInfo(null);
      }
      const res = await api.post('/quizzes/generate', {
        documentId: parseInt(selectedQuizDoc),
        numQuestions: quizQuestions,
        difficulty: effectiveDifficulty,
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
    setQuizResponseTimes((prev) => ({
      ...prev,
      [questionId]: Date.now() - quizStartTime.current,
    }));
  };

  const handleShowResults = async () => {
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

    if (selectedSubject && quizData?.id) {
      const answersPayload = quizData.questions.map((q) => {
        const userAnswer = userAnswers[q.id] || '';
        const userMatch = String(userAnswer).match(/[A-D]/i);
        const correctMatch = String(q.bonne_reponse || '').match(/[A-D]/i);
        const normalizedUser = userMatch ? userMatch[0].toUpperCase() : '';
        const normalizedCorrect = correctMatch ? correctMatch[0].toUpperCase() : '';
        return {
          questionId: q.id,
          reponseDonnee: userAnswer,
          estCorrect: normalizedUser && normalizedCorrect && normalizedUser === normalizedCorrect,
          responseTimeMs: quizResponseTimes[q.id] || null,
        };
      });
      try {
        await api.post('/progress/quiz-result', { quizId: quizData.id, answers: answersPayload });
      } catch (e) {
        console.error('Erreur sauvegarde résultats quiz:', e);
      }
    }
  };

  const handleReviewErrors = () => {
    setShowResults(false);
  };

  const handleContinueQuiz = async () => {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    const newDifficulty = getNextDifficulty(quizDifficulty, pct, quizUseAdaptive);

    if (quizUseAdaptive && newDifficulty !== quizDifficulty && selectedSubject) {
      setAdaptiveQuizInfo({ difficulty: newDifficulty, score: pct, totalResults: score.total, increased: true });
    }

    setGeneratingQuiz(true);
    setShowQuiz(false);
    setShowResults(false);
    setUserAnswers({});
    try {
      const res = await api.post('/quizzes/generate', {
        documentId: parseInt(selectedQuizDoc),
        numQuestions: quizQuestions,
        difficulty: newDifficulty,
      });
      setQuizData(res.data);
      setShowQuiz(true);
    } catch (err) {
      console.error('Erreur continuation quiz:', err);
      alert('Erreur lors de la génération du quiz');
    } finally {
      setGeneratingQuiz(false);
    }
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
      let effectiveDifficulty = exerciseDifficulty;
      if (exerciseUseAdaptive && selectedSubject) {
        const adaptive = await fetchAdaptiveDifficulty(selectedSubject.id);
        if (adaptive) {
          effectiveDifficulty = adaptive.difficulty;
          setAdaptiveExerciseInfo(adaptive);
        }
      } else {
        setAdaptiveExerciseInfo(null);
      }
      const res = await api.post('/exercises/generate', {
        documentId: parseInt(selectedExerciseDoc),
        numExercises: exerciseCount,
        difficulty: effectiveDifficulty,
      });
      setExerciseData(res.data);
      setShowExercise(true);
      exerciseStartTime.current = Date.now();
      setExerciseResponseTimes({});
    } catch (err) {
      console.error('Erreur génération exercices:', err);
      alert('Erreur lors de la génération des exercices');
    } finally {
      setGeneratingExercise(false);
    }
  };

  const trackExerciseAnswer = (idx, answer) => {
    setExerciseAnswers(prev => ({ ...prev, [idx]: answer }));
    if (!exerciseResponseTimes[idx]) {
      setExerciseResponseTimes(prev => ({ ...prev, [idx]: Date.now() - exerciseStartTime.current }));
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
        options: ex.options || undefined,
      })),
      userAnswers: exerciseData.exercises.map((ex, idx) => {
        const ans = (exerciseAnswers[idx] || '').trim();
        // Mapper les labels Vrai/Faux vers les lettres A/B pour la correction
        if (ex.type === 'true_false') {
          return ans === 'Vrai' ? 'A' : ans === 'Faux' ? 'B' : ans;
        }
        return ans;
      }),
    };
    try {
      const res = await api.post('/exercises/check', {
        ...payload,
        matiereId: selectedSubject?.id,
        difficulty: exerciseUseAdaptive ? adaptiveExerciseInfo?.difficulty : exerciseDifficulty,
        responseTimes: exerciseData.exercises.map((_, idx) => exerciseResponseTimes[idx] || null),
      });
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

  const handleContinueExercises = async () => {
    const totalEx = exerciseData?.exercises?.length || 0;
    const correctEx = Object.values(exerciseResults).filter(r => r.isCorrect).length;
    const pct = totalEx > 0 ? Math.round((correctEx / totalEx) * 100) : 0;
    const newDifficulty = getNextDifficulty(exerciseDifficulty, pct, exerciseUseAdaptive);

    if (exerciseUseAdaptive && newDifficulty !== exerciseDifficulty && selectedSubject) {
      setAdaptiveExerciseInfo({ difficulty: newDifficulty, score: pct, totalResults: totalEx, increased: true });
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
        difficulty: newDifficulty,
      });
      setExerciseData(res.data);
      setShowExercise(true);
    } catch (err) {
      console.error('Erreur continuation exercices:', err);
      alert('Erreur lors de la génération des exercices');
    } finally {
      setGeneratingExercise(false);
    }
  };

  // Flashcards
  const handleGenerateFlashcards = async () => {
    if (!selectedFlashcardDoc) {
      alert('Veuillez sélectionner un document');
      return;
    }
    setGeneratingFlashcards(true);
    try {
      const res = await api.post('/flashcards/generate', {
        documentId: parseInt(selectedFlashcardDoc),
        numCards: flashcardCount,
      });
      setFlashcards(res.data.cards);
      if (selectedSubject) {
        fetchFlashcardStats(selectedSubject.id);
      }
    } catch (err) {
      console.error('Erreur génération flashcards:', err);
      alert('Erreur lors de la génération des flashcards');
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const fetchFlashcardStats = async (matiereId) => {
    try {
      const res = await api.get(`/flashcards/subject/${matiereId}/stats`);
      setFlashcardStats(res.data);
    } catch (err) {
      console.error('Erreur stats flashcards:', err);
    }
  };

  const handleStartFlashcardReview = async () => {
    if (!selectedSubject) return;
    try {
      const res = await api.get(`/flashcards/subject/${selectedSubject.id}/due`);
      setDueCards(res.data);
      setCurrentCardIndex(0);
      setIsCardFlipped(false);
      setShowFlashcardReview(true);
    } catch (err) {
      console.error('Erreur chargement cartes dues:', err);
    }
  };

  const handleReviewCard = async (quality) => {
    if (!dueCards[currentCardIndex]) return;
    try {
      await api.post(`/flashcards/${dueCards[currentCardIndex].id}/review`, { quality });
      if (currentCardIndex < dueCards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsCardFlipped(false);
      } else {
        setShowFlashcardReview(false);
        if (selectedSubject) fetchFlashcardStats(selectedSubject.id);
      }
    } catch (err) {
      console.error('Erreur review flashcard:', err);
    }
  };

  const handleDeleteFlashcard = async (cardId) => {
    if (!confirm('Supprimer cette flashcard ?')) return;
    try {
      await api.delete(`/flashcards/${cardId}`);
      setFlashcards(flashcards.filter(c => c.id !== cardId));
      if (selectedSubject) fetchFlashcardStats(selectedSubject.id);
    } catch (err) {
      console.error('Erreur suppression flashcard:', err);
    }
  };

  // Vrai/Faux
  const handleGenerateTrueFalse = async () => {
    if (!selectedTFDoc) {
      alert('Veuillez sélectionner un document');
      return;
    }
    setGeneratingTF(true);
    setShowTF(false);
    setTfShowResults(false);
    setTfAnswers({});
    setQuizResponseTimes({});
    quizStartTime.current = Date.now();
    try {
      let effectiveDifficulty = tfDifficulty;
      if (tfUseAdaptive && selectedSubject) {
        const adaptive = await fetchAdaptiveDifficulty(selectedSubject.id);
        if (adaptive) {
          effectiveDifficulty = adaptive.difficulty;
          setAdaptiveTFInfo(adaptive);
        }
      } else {
        setAdaptiveTFInfo(null);
      }
      const res = await api.post('/quizzes/generate-true-false', {
        documentId: parseInt(selectedTFDoc),
        numQuestions: tfQuestions,
        difficulty: effectiveDifficulty,
      });
      setTfData(res.data);
      setShowTF(true);
    } catch (err) {
      console.error('Erreur génération vrai/faux:', err);
      alert('Erreur lors de la génération des questions vrai/faux');
    } finally {
      setGeneratingTF(false);
    }
  };

  const handleSelectTFAnswer = (questionId, answer) => {
    if (tfShowResults) return;
    setTfAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setQuizResponseTimes((prev) => ({
      ...prev,
      [questionId]: Date.now() - quizStartTime.current,
    }));
  };

  const handleShowTFResults = async () => {
    if (!tfData?.questions) return;
    let correct = 0;
    const total = tfData.questions.length;
    tfData.questions.forEach((q) => {
      const userAnswer = tfAnswers[q.id];
      const userMatch = String(userAnswer || '').match(/[A-B]/i);
      const correctMatch = String(q.bonne_reponse || '').match(/[A-B]/i);
      if (userMatch && correctMatch && userMatch[0].toUpperCase() === correctMatch[0].toUpperCase()) {
        correct++;
      }
    });
    setTfScore({ correct, total });
    setTfShowResults(true);

    if (selectedSubject && tfData?.id) {
      const answersPayload = tfData.questions.map((q) => {
        const userAnswer = tfAnswers[q.id] || '';
        const userMatch = String(userAnswer).match(/[A-B]/i);
        const correctMatch = String(q.bonne_reponse || '').match(/[A-B]/i);
        return {
          questionId: q.id,
          reponseDonnee: userAnswer,
          estCorrect: userMatch && correctMatch && userMatch[0].toUpperCase() === correctMatch[0].toUpperCase(),
          responseTimeMs: quizResponseTimes[q.id] || null,
        };
      });
      try {
        await api.post('/progress/quiz-result', { quizId: tfData.id, answers: answersPayload });
      } catch (e) {
        console.error('Erreur sauvegarde résultats TF:', e);
      }
    }
  };

  const handleReviewTFErrors = () => {
    setTfShowResults(false);
  };

  const handleContinueTrueFalse = async () => {
    const pct = tfScore.total > 0 ? Math.round((tfScore.correct / tfScore.total) * 100) : 0;
    const newDifficulty = getNextDifficulty(tfDifficulty, pct, tfUseAdaptive);

    if (tfUseAdaptive && newDifficulty !== tfDifficulty && selectedSubject) {
      setAdaptiveTFInfo({ difficulty: newDifficulty, score: pct, totalResults: tfScore.total, increased: true });
    }

    setGeneratingTF(true);
    setShowTF(false);
    setTfShowResults(false);
    setTfAnswers({});
    try {
      const res = await api.post('/quizzes/generate-true-false', {
        documentId: parseInt(selectedTFDoc),
        numQuestions: tfQuestions,
        difficulty: newDifficulty,
      });
      setTfData(res.data);
      setShowTF(true);
    } catch (err) {
      console.error('Erreur continuation vrai/faux:', err);
      alert('Erreur lors de la génération des questions vrai/faux');
    } finally {
      setGeneratingTF(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex dark:bg-gray-950">
        <div className="hidden lg:block w-64 min-h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 p-4 space-y-3">
          <div className="h-8 w-32 skeleton" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full skeleton rounded-xl" />
          ))}
        </div>
        <div className="flex-1 p-4 sm:p-6 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="h-8 w-48 skeleton" />
            <div className="h-4 w-64 skeleton" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 skeleton rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const allAnsweredQuiz = quizData?.questions?.every((q) => userAnswers[q.id] !== undefined);
  const allAnsweredExercises = exerciseData?.exercises?.every((_, idx) => {
    const ans = exerciseAnswers[idx];
    return ans && ans.trim() !== '';
  });
  const allAnsweredTF = tfData?.questions?.every((q) => tfAnswers[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-white flex dark:bg-gray-950">
      <Sidebar activePath="/matieres" onLogout={logout} />

      <main className="flex-1 p-4 sm:p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                Gestion des matières
              </h1>
              <p className="text-gray-500 mt-0.5 dark:text-gray-400 text-xs sm:text-sm">Gérez vos matières et importez vos documents.</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/notifications" className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors dark:hover:bg-gray-800">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/parametres" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md shadow-blue-200 dark:shadow-none cursor-pointer hover:opacity-90 transition">
                {user.full_name?.[0]?.toUpperCase() || 'U'}
              </Link>
            </div>
          </div>

          {/* AJOUT / SÉLECTION MATIÈRE */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0 sm:min-w-[200px] relative">
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
              <button
                onClick={() => {
                  if (selectedSubject) {
                    setSelectedSubject(null);
                    setDocuments([]);
                  } else if (subjects.length > 0) {
                    setSelectedSubject(subjects[0]);
                    fetchDocuments(subjects[0].id);
                  }
                }}
                className="px-6 py-2.5 border border-blue-600 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 transition-all dark:hover:bg-blue-950/30"
              >
                {selectedSubject ? 'Désélectionner' : 'Sélectionner'}
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
                  onDelete={handleDeleteSubject}
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
                Veuillez sélectionner une matière avant d'importer.
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
                      <button
                        onClick={(e) => handleDeleteDocument(e, doc.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
            <h2 className="text-xl font-semibold text-gray-800 mb-1 flex items-center gap-2 dark:text-gray-200">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              Générer un quiz
            </h2>
            <p className="text-sm text-gray-400 mb-4 dark:text-gray-500">Testez vos connaissances avec des questions à choix multiples et vrai/faux.</p>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedQuizDoc}
                onChange={(e) => setSelectedQuizDoc(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white w-full sm:w-auto sm:min-w-[180px] text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
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
                    onClick={() => { setQuizDifficulty(n); setQuizUseAdaptive(false); setAdaptiveQuizInfo(null); }}
                    className={`px-3 py-1.5 border rounded-full text-sm transition-all ${
                      !quizUseAdaptive && quizDifficulty === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-blue-50 text-gray-700 dark:hover:bg-blue-950/30 dark:text-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => { setQuizUseAdaptive(true); setAdaptiveQuizInfo(null); }}
                  className={`px-3 py-1.5 border rounded-full text-sm transition-all flex items-center gap-1 ${
                    quizUseAdaptive
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'hover:bg-purple-50 text-gray-700 dark:hover:bg-purple-950/30 dark:text-gray-300 border-purple-300 dark:border-purple-700'
                  }`}
                >
                  Adaptatif
                </button>
              </div>
              {adaptiveQuizInfo && (
                <div className="w-full mt-2 px-3 py-2 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    Difficulté recommandée : <strong>{adaptiveQuizInfo.difficulty}</strong>
                    {adaptiveQuizInfo.totalResults > 0 && (
                      <span className="ml-1 text-purple-500">
                        (score moyen : {adaptiveQuizInfo.score}% — {adaptiveQuizInfo.totalResults} résultat{adaptiveQuizInfo.totalResults > 1 ? 's' : ''})
                      </span>
                    )}
                  </p>
                </div>
              )}
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
                      <button
                        onClick={handleContinueQuiz}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-200 dark:shadow-none flex items-center gap-2"
                      >
                        Continuer
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/* VRAI / FAUX */}
          {/* ========================================== */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 dark:bg-gray-900 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-800 mb-1 flex items-center gap-2 dark:text-gray-200">
              <ToggleLeft className="w-5 h-5 text-violet-500" />
              Vrai / Faux
            </h2>
            <p className="text-sm text-gray-400 mb-4 dark:text-gray-500">Affinez votre compréhension avec des affirmations à valider.</p>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedTFDoc}
                onChange={(e) => setSelectedTFDoc(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 bg-white w-full sm:w-auto sm:min-w-[180px] text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
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
                    onClick={() => setTfQuestions(n)}
                    className={`px-3 py-1.5 border rounded-full text-sm transition-all ${
                      tfQuestions === n
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'hover:bg-violet-50 text-gray-700 dark:hover:bg-violet-950/30 dark:text-gray-300'
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
                    onClick={() => { setTfDifficulty(n); setTfUseAdaptive(false); setAdaptiveTFInfo(null); }}
                    className={`px-3 py-1.5 border rounded-full text-sm transition-all ${
                      !tfUseAdaptive && tfDifficulty === n
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'hover:bg-violet-50 text-gray-700 dark:hover:bg-violet-950/30 dark:text-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => { setTfUseAdaptive(true); setAdaptiveTFInfo(null); }}
                  className={`px-3 py-1.5 border rounded-full text-sm transition-all flex items-center gap-1 ${
                    tfUseAdaptive
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'hover:bg-purple-50 text-gray-700 dark:hover:bg-purple-950/30 dark:text-gray-300 border-purple-300 dark:border-purple-700'
                  }`}
                >
                  Adaptatif
                </button>
              </div>
              {adaptiveTFInfo && (
                <div className="w-full mt-2 px-3 py-2 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    Difficulté recommandée : <strong>{adaptiveTFInfo.difficulty}</strong>
                    {adaptiveTFInfo.totalResults > 0 && (
                      <span className="ml-1 text-purple-500">
                        (score moyen : {adaptiveTFInfo.score}% — {adaptiveTFInfo.totalResults} résultat{adaptiveTFInfo.totalResults > 1 ? 's' : ''})
                      </span>
                    )}
                  </p>
                </div>
              )}
              <button
                onClick={handleGenerateTrueFalse}
                disabled={generatingTF}
                className="ml-auto px-8 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-all shadow-md shadow-violet-200 dark:shadow-none disabled:opacity-60 flex items-center gap-2"
              >
                {generatingTF && <Loader2 className="w-4 h-4 animate-spin" />}
                {generatingTF ? 'Génération...' : 'Commencer le quiz'}
              </button>
            </div>

            {showTF && tfData && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2 dark:text-gray-200">
                    <ToggleLeft className="w-4 h-4 text-violet-500" />
                    {tfData.titre}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Object.keys(tfAnswers).length}/{tfData.questions?.length || 0} répondues
                  </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {tfData.questions?.map((q, i) => (
                    <QuizQuestion
                      key={q.id}
                      question={q}
                      index={i}
                      total={tfData.questions.length}
                      selectedAnswer={tfAnswers[q.id]}
                      onSelect={handleSelectTFAnswer}
                      showResult={tfShowResults}
                      isCorrect={tfAnswers[q.id]?.charAt(0) === q.bonne_reponse?.charAt(0)}
                    />
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {!tfShowResults ? (
                    <>
                      <button
                        onClick={handleShowTFResults}
                        disabled={!allAnsweredTF}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Voir les résultats
                      </button>
                      {!allAnsweredTF && (
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
                          Score : <strong className="text-violet-600">{tfScore.correct}/{tfScore.total}</strong>
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({Math.round((tfScore.correct / tfScore.total) * 100)}%)
                        </span>
                      </div>
                      <button
                        onClick={handleReviewTFErrors}
                        className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-all shadow-md shadow-violet-200 dark:shadow-none"
                      >
                        Revoir les erreurs
                      </button>
                      <button
                        onClick={() => {
                          setTfAnswers({});
                          setTfShowResults(false);
                          setTfData(null);
                          setShowTF(false);
                        }}
                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-all dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        Recommencer
                      </button>
                      <button
                        onClick={handleContinueTrueFalse}
                        className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-all shadow-md shadow-violet-200 dark:shadow-none flex items-center gap-2"
                      >
                        Continuer
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
            <h2 className="text-xl font-semibold text-gray-800 mb-1 flex items-center gap-2 dark:text-gray-200">
              <PenTool className="w-5 h-5 text-blue-500" />
              Générer des exercices
            </h2>
            <p className="text-sm text-gray-400 mb-4 dark:text-gray-500">Entraînez-vous avec des QCM, vrai/faux, questions ouvertes et exercices à trous.</p>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedExerciseDoc}
                onChange={(e) => setSelectedExerciseDoc(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white w-full sm:w-auto sm:min-w-[180px] text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
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
                    onClick={() => { setExerciseDifficulty(n); setExerciseUseAdaptive(false); setAdaptiveExerciseInfo(null); }}
                    className={`px-3 py-1.5 border rounded-full text-sm transition-all ${
                      !exerciseUseAdaptive && exerciseDifficulty === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-blue-50 text-gray-700 dark:hover:bg-blue-950/30 dark:text-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => { setExerciseUseAdaptive(true); setAdaptiveExerciseInfo(null); }}
                  className={`px-3 py-1.5 border rounded-full text-sm transition-all flex items-center gap-1 ${
                    exerciseUseAdaptive
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'hover:bg-purple-50 text-gray-700 dark:hover:bg-purple-950/30 dark:text-gray-300 border-purple-300 dark:border-purple-700'
                  }`}
                >
                  Adaptatif
                </button>
              </div>
              {adaptiveExerciseInfo && (
                <div className="w-full mt-2 px-3 py-2 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    Difficulté recommandée : <strong>{adaptiveExerciseInfo.difficulty}</strong>
                    {adaptiveExerciseInfo.totalResults > 0 && (
                      <span className="ml-1 text-purple-500">
                        (score moyen : {adaptiveExerciseInfo.score}% — {adaptiveExerciseInfo.totalResults} résultat{adaptiveExerciseInfo.totalResults > 1 ? 's' : ''})
                      </span>
                    )}
                  </p>
                </div>
              )}
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
                      <div className="flex items-start gap-2">
                        <p className="font-medium text-gray-800 dark:text-gray-200">Exercice {idx + 1}</p>
                        {ex.type === 'true_false' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full dark:bg-violet-950/30 dark:text-violet-400">
                            Vrai / Faux
                          </span>
                        )}
                        {ex.type === 'fill_in_blank' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full dark:bg-amber-950/30 dark:text-amber-400">
                            À trous
                          </span>
                        )}
                        {ex.type === 'qcm' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full dark:bg-blue-950/30 dark:text-blue-400">
                            QCM
                          </span>
                        )}
                        {ex.type === 'ouverte' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full dark:bg-emerald-950/30 dark:text-emerald-400">
                            Ouverte
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 dark:text-gray-400">{ex.question}</p>

                      {/* Zone de réponse */}
                      <div className="mt-2">
                        {ex.type === 'true_false' ? (
                          <div className="flex gap-3">
                            {['A', 'B'].map((letter, i) => {
                              const label = i === 0 ? 'Vrai' : 'Faux';
                              const isSelected = exerciseAnswers[idx] === label;
                              return (
                                <button
                                  key={letter}
                                  onClick={() => {
                                    if (!showCorrection) {
                                      trackExerciseAnswer(idx, label);
                                    }
                                  }}
                                  disabled={showCorrection}
                                  className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        ) : ex.type === 'fill_in_blank' ? (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
                              Complétez le(s) trou(s) marqué(s) par ___ :
                            </p>
                            <input
                              type="text"
                              placeholder="Votre réponse..."
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                              value={exerciseAnswers[idx] || ''}
                              onChange={(e) => {
                                trackExerciseAnswer(idx, e.target.value);
                              }}
                              disabled={showCorrection}
                            />
                          </div>
                        ) : ex.options ? (
                          <div className="space-y-1">
                            {ex.options.map((opt, j) => (
                              <label key={j} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                  type="radio"
                                  name={`exercise-${idx}`}
                                  value={opt}
                                  onChange={(e) => {
                                    trackExerciseAnswer(idx, e.target.value);
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
                              trackExerciseAnswer(idx, e.target.value);
                            }}
                            disabled={showCorrection}
                          />
                        )}
                      </div>

                      {/* Correction */}
                      {showCorrection && exerciseResults[idx] && (
                        <div className={`mt-2 p-2 rounded-lg ${exerciseResults[idx].isCorrect ? 'bg-green-100 border border-green-300 dark:bg-green-950/30 dark:border-green-700' : 'bg-red-100 border border-red-300 dark:bg-red-950/30 dark:border-red-700'}`}>
                          <p className="text-sm font-medium">
                            {exerciseResults[idx].isCorrect ? 'Correct' : 'Incorrect'}
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
                <div className="mt-4 flex flex-wrap gap-3">
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
                      <button
                        onClick={handleContinueExercises}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 dark:shadow-none flex items-center gap-2"
                      >
                        Continuer
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/* FLASHCARDS */}
          {/* ========================================== */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-800 mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-1 flex items-center gap-2 dark:text-gray-200">
              <FlipVertical className="w-5 h-5 text-violet-500" />
              Flashcards
            </h2>
            <p className="text-sm text-gray-400 mb-4 dark:text-gray-500">Mémorisez les concepts clés avec des cartes à réviser.</p>

          <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedFlashcardDoc}
                onChange={(e) => setSelectedFlashcardDoc(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white w-full sm:w-auto sm:min-w-[180px] text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              >
                <option value="">Sélectionner un document</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.nom_fichier}</option>
                ))}
              </select>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-500 mr-1 dark:text-gray-400">Cartes :</span>
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setFlashcardCount(n)}
                    className={`px-3 py-1.5 border rounded-full text-sm transition-all ${
                      flashcardCount === n
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'hover:bg-violet-50 text-gray-700 dark:hover:bg-violet-950/30 dark:text-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerateFlashcards}
                disabled={generatingFlashcards}
                className="ml-auto px-8 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-all shadow-md shadow-violet-200 dark:shadow-none disabled:opacity-60 flex items-center gap-2"
              >
                {generatingFlashcards && <Loader2 className="w-4 h-4 animate-spin" />}
                {generatingFlashcards ? 'Génération...' : 'Générer des flashcards'}
              </button>
            </div>

            {flashcardStats && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-violet-50 dark:bg-violet-950/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-violet-600">{flashcardStats.total || 0}</p>
                  <p className="text-xs text-violet-500">Total</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{flashcardStats.due_today || 0}</p>
                  <p className="text-xs text-amber-500">À réviser</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{flashcardStats.mastered || 0}</p>
                  <p className="text-xs text-emerald-500">Maîtrisées</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{flashcardStats.avg_ease_factor || 2.5}</p>
                  <p className="text-xs text-blue-500">Facilité moy.</p>
                </div>
              </div>
            )}

            {flashcardStats && parseInt(flashcardStats.due_today) > 0 && (
              <button
                onClick={handleStartFlashcardReview}
                className="mt-4 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 dark:shadow-none flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Réviser {flashcardStats.due_today} carte{parseInt(flashcardStats.due_today) > 1 ? 's' : ''}
              </button>
            )}

            {flashcards.length > 0 && !showFlashcardReview && (
              <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {flashcards.map((card) => (
                  <div key={card.id} className="bg-white rounded-xl border border-violet-200 p-4 dark:bg-gray-900 dark:border-violet-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full dark:bg-violet-950/30 dark:text-violet-400">
                            {card.categorie || 'concept'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{card.recto}</p>
                        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">{card.verso}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteFlashcard(card.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RESSOURCES RECOMMANDÉES */}
          {selectedSubject && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 dark:bg-gray-900 dark:border-gray-800">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-purple-500" />
                  Ressources recommandées
                </h2>
                <span className="text-xs text-gray-400 dark:text-gray-500">Basées sur vos documents</span>
              </div>
              {loadingResources ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">L'IA analyse vos documents...</span>
                </div>
              ) : resources.length === 0 ? (
                <div className="text-center py-10">
                  <ExternalLink className="w-8 h-8 text-gray-300 mx-auto mb-2 dark:text-gray-600" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">Aucune ressource recommandée pour l'instant.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Importez des documents pour recevoir des recommandations.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map((r, i) => {
                    const typeConfig = {
                      video: { icon: Play, color: 'bg-red-100 text-red-600 dark:bg-red-900/30', label: 'Vidéo' },
                      cours: { icon: BookOpen, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30', label: 'Cours' },
                      article: { icon: FileText, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30', label: 'Article' },
                      exercice: { icon: ClipboardList, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30', label: 'Exercice' },
                    };
                    const cfg = typeConfig[r.type] || typeConfig.article;
                    const Icon = cfg.icon;
                    return (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800 transition-all group bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${cfg.color} flex-shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{r.titre}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{r.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{r.source}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">{cfg.label}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Modal de révision flashcards */}
          {showFlashcardReview && dueCards.length > 0 && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    Révision — {currentCardIndex + 1}/{dueCards.length}
                  </h3>
                  <button onClick={() => setShowFlashcardReview(false)} className="p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className="relative h-48 sm:h-64 cursor-pointer flashcard-container"
                  style={{ perspective: '1000px' }}
                >
                  <div className={`flashcard-card w-full h-full transition-transform duration-500 ease-in-out ${isCardFlipped ? 'flipped' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
                    <div className="absolute inset-0 bg-blue-50 border-2 border-blue-300 dark:bg-blue-950/30 dark:border-blue-700 rounded-xl flex items-center justify-center p-6" style={{ backfaceVisibility: 'hidden' }}>
                      <div className="text-center">
                        <p className="text-xs text-blue-500 mb-2 font-medium">RECTO</p>
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{dueCards[currentCardIndex]?.recto}</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-violet-50 border-2 border-violet-300 dark:bg-violet-950/30 dark:border-violet-700 rounded-xl flex items-center justify-center p-6" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                      <div className="text-center">
                        <p className="text-xs text-violet-500 mb-2 font-medium">VERSO</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{dueCards[currentCardIndex]?.verso}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-0 right-0 text-center z-10">
                    <span className="text-xs text-gray-400">{isCardFlipped ? 'Cliquez pour retourner' : 'Cliquez pour révéler'}</span>
                  </div>
                </div>
                {isCardFlipped && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button onClick={() => handleReviewCard(0)} className="py-2.5 px-3 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 transition-all dark:bg-red-950/30 dark:text-red-400">Encore</button>
                    <button onClick={() => handleReviewCard(2)} className="py-2.5 px-3 bg-orange-100 text-orange-700 rounded-xl text-sm font-semibold hover:bg-orange-200 transition-all dark:bg-orange-950/30 dark:text-orange-400">Difficile</button>
                    <button onClick={() => handleReviewCard(4)} className="py-2.5 px-3 bg-green-100 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-200 transition-all dark:bg-green-950/30 dark:text-green-400">Bon</button>
                    <button onClick={() => handleReviewCard(5)} className="py-2.5 px-3 bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-200 transition-all dark:bg-blue-950/30 dark:text-blue-400">Facile</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}