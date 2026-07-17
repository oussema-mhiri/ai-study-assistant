'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  Brain, Search, Plus, Upload, FileText, Sparkles, ChevronRight, X, Loader2,
  BookOpen, Bot, CalendarDays, Bell, Settings, LogOut, Home, Layers, MessageSquare,
  Award, Zap, CheckCircle, ClipboardList, PenTool, ListChecks, AlertCircle
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
// COMPOSANTS RÉUTILISABLES
// ============================================

function SubjectTag({ subject, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
        selected
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span>{subject.nom}</span>
      <span className={`text-xs ${selected ? 'text-blue-100' : 'text-gray-400'}`}>
        ({subject.documents_count || 0})
      </span>
    </button>
  );
}

function ResultCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-blue-50 rounded-xl">
          <Icon className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {typeof description === 'string' ? (
            <p className="text-sm text-gray-500 mt-1 leading-relaxed whitespace-pre-line">{description}</p>
          ) : (
            <div className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPOSANT QUIZ – AVEC AFFICHAGE DES RÉSULTATS (VRAI/FAUX)
// ============================================

function QuizQuestion({ question, index, total, selectedAnswer, onSelect, showResult, isCorrect }) {
  const optionLabels = ['A', 'B', 'C', 'D'];

  const getOptionClass = (index) => {
    if (!showResult) return 'hover:bg-gray-50';
    const letter = optionLabels[index];
    const isSelected = selectedAnswer === letter;
    const isCorrectAnswer = question.bonne_reponse?.charAt(0) === letter;

    if (isSelected && isCorrectAnswer) return 'bg-green-100 border-green-400';
    if (isSelected && !isCorrectAnswer) return 'bg-red-100 border-red-400';
    if (isCorrectAnswer && showResult) return 'bg-green-50 border-green-300';
    return 'hover:bg-gray-50';
  };

  return (
    <div className={`bg-white rounded-xl border p-4 mb-4 ${
      showResult
        ? isCorrect
          ? 'border-green-300 shadow-sm shadow-green-100'
          : 'border-red-300 shadow-sm shadow-red-100'
        : 'border-gray-200'
    }`}>
      <div className="flex items-start gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-500 min-w-[60px]">
          Q{index + 1}/{total}
        </span>
        <p className="text-sm font-medium text-gray-800">{question.contenu}</p>
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
              <span className={`text-sm ${showResult && isSelected && !isCorrectAnswer ? 'text-red-700' : 'text-gray-700'}`}>
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

  // ================================
  // CORRECTION PRINCIPALE : COMPARAISON ROBUSTE
  // ================================
  const handleShowResults = () => {
    if (!quizData?.questions) return;
    let correct = 0;
    const total = quizData.questions.length;

    quizData.questions.forEach((q) => {
      const userAnswer = userAnswers[q.id];
      const correctAnswer = q.bonne_reponse;

      // Extraire la première lettre (A-D) avec une regex
      const userMatch = String(userAnswer || '').match(/[A-D]/i);
      const correctMatch = String(correctAnswer || '').match(/[A-D]/i);

      const normalizedUser = userMatch ? userMatch[0].toUpperCase() : '';
      const normalizedCorrect = correctMatch ? correctMatch[0].toUpperCase() : '';

      // DEBUG : afficher les valeurs normalisées
      console.log(`🔍 Question ${q.id}: user="${userAnswer}" -> ${normalizedUser}, correct="${correctAnswer}" -> ${normalizedCorrect}`);

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const allAnswered = quizData?.questions?.every((q) => userAnswers[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar activePath="/matieres" onLogout={logout} />

      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-6 h-6 text-blue-600" />
                Gestion des matières
              </h1>
              <p className="text-gray-500 mt-0.5">Gérez vos matières et importez vos documents pour l'analyse IA.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher une matière..."
                  className="pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-gray-900"
                />
              </div>
              <button className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">3</span>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md shadow-blue-200">
                {user.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>

          {/* AJOUT / SÉLECTION MATIÈRE */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Plus className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nouvelle matière (ex: Intelligence Artificielle)"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm transition-all text-gray-900"
                />
              </div>
              <button
                onClick={handleAddSubject}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Ajouter
              </button>
              <button className="px-6 py-2.5 border border-blue-600 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 transition-all">
                Sélectionner
              </button>
            </div>
          </div>

          {/* LISTE DES MATIÈRES */}
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-2.5 mb-8">
              {subjects.map((s) => (
                <SubjectTag
                  key={s.id}
                  subject={s}
                  selected={selectedSubject?.id === s.id}
                  onClick={() => handleSelectSubject(s)}
                />
              ))}
            </div>
          )}

          {/* UPLOAD DE DOCUMENTS */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-blue-300 p-8 text-center mb-8 transition-all hover:border-blue-400 hover:bg-blue-50/30">
            <Upload className="w-14 h-14 text-blue-500 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-gray-700 font-medium">Glissez-déposez votre document ici</p>
            <p className="text-sm text-gray-400 mb-4">ou cliquez pour sélectionner un fichier</p>
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
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
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
            <div className="mt-3 text-xs text-gray-400">
              PDF, DOCX, PPTX, JPG, PNG – Max 50 Mo
            </div>
            {!selectedSubject && (
              <p className="mt-4 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-full inline-block">
                ⚠️ Veuillez sélectionner une matière avant d'importer.
              </p>
            )}
          </div>

          {/* RÉSULTATS IA */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Résultats de l'analyse IA
            </h2>
            {analysisResult ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResultCard
                  icon={FileText}
                  title="Résumé court"
                  description={analysisResult.summaryShort}
                />
                <ResultCard
                  icon={BookOpen}
                  title="Résumé détaillé"
                  description={analysisResult.summaryLong}
                />
                <ResultCard
                  icon={Award}
                  title="Points clés"
                  description={analysisResult.keyPoints.map((p, i) => (
                    <div key={i}>• {p}</div>
                  ))}
                />
                <ResultCard
                  icon={CheckCircle}
                  title="Définitions importantes"
                  description={analysisResult.definitions.map((d, i) => (
                    <div key={i}><strong>{d.terme}</strong> : {d.definition}</div>
                  ))}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResultCard
                  icon={FileText}
                  title="Résumé court"
                  description="Importez un document pour générer un résumé IA."
                />
                <ResultCard
                  icon={BookOpen}
                  title="Résumé détaillé"
                  description="Importez un document pour générer un résumé détaillé."
                />
                <ResultCard
                  icon={Award}
                  title="Points clés"
                  description="Importez un document pour extraire les points clés."
                />
                <ResultCard
                  icon={CheckCircle}
                  title="Définitions importantes"
                  description="Importez un document pour extraire les définitions."
                />
              </div>
            )}
          </div>

          {/* QUIZ */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              Générer un quiz
            </h2>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedQuizDoc}
                onChange={(e) => setSelectedQuizDoc(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white min-w-[180px] text-gray-900"
              >
                <option value="">Sélectionner un document</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.nom_fichier}</option>
                ))}
              </select>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-500 mr-1">Questions :</span>
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuizQuestions(n)}
                    className={`px-3 py-1.5 border rounded-full text-sm transition-all ${
                      quizQuestions === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-500 mr-1">Niveau :</span>
                {['Facile', 'Moyen', 'Difficile'].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuizDifficulty(n)}
                    className={`px-3 py-1.5 border rounded-full text-sm transition-all ${
                      quizDifficulty === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerateQuiz}
                disabled={generatingQuiz}
                className="ml-auto px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-60 flex items-center gap-2"
              >
                {generatingQuiz && <Loader2 className="w-4 h-4 animate-spin" />}
                {generatingQuiz ? 'Génération...' : 'Commencer le quiz'}
              </button>
            </div>

            {showQuiz && quizData && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-blue-500" />
                    {quizData.titre}
                  </h3>
                  <span className="text-sm text-gray-500">
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

                <div className="mt-6 flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
                  {!showResults ? (
                    <>
                      <button
                        onClick={handleShowResults}
                        disabled={!allAnswered}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Voir les résultats
                      </button>
                      {!allAnswered && (
                        <span className="text-sm text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Répondez à toutes les questions
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">
                          Score : <strong className="text-blue-600">{score.correct}/{score.total}</strong>
                        </span>
                        <span className="text-sm text-gray-500">
                          ({Math.round((score.correct / score.total) * 100)}%)
                        </span>
                      </div>
                      <button
                        onClick={handleReviewErrors}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
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
                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-all"
                      >
                        Recommencer
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* EXERCICES */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-blue-500" />
              Générer des exercices
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedExerciseDoc}
                onChange={(e) => setSelectedExerciseDoc(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white min-w-[180px] text-gray-900"
              >
                <option value="">Sélectionner un document</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.nom_fichier}</option>
                ))}
              </select>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-500 mr-1">Exercices :</span>
                {[3, 5, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => setExerciseCount(n)}
                    className={`px-3 py-1.5 border rounded-full text-sm transition-all ${
                      exerciseCount === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-500 mr-1">Niveau :</span>
                {['Facile', 'Moyen', 'Difficile'].map((n) => (
                  <button
                    key={n}
                    onClick={() => setExerciseDifficulty(n)}
                    className={`px-3 py-1.5 border rounded-full text-sm transition-all ${
                      exerciseDifficulty === n
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerateExercise}
                disabled={generatingExercise}
                className="ml-auto px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 disabled:opacity-60 flex items-center gap-2"
              >
                {generatingExercise && <Loader2 className="w-4 h-4 animate-spin" />}
                {generatingExercise ? 'Génération...' : 'Générer des exercices'}
              </button>
            </div>

            {showExercise && exerciseData && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-emerald-500" />
                  Exercices générés
                </h3>
                <div className="space-y-3">
                  {exerciseData.exercises?.map((ex, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100">
                      <p className="font-medium text-gray-800">Exercice {i + 1}</p>
                      <p className="text-sm text-gray-600 mt-1">{ex.question}</p>
                      {ex.options && (
                        <div className="mt-2 space-y-1">
                          {ex.options.map((opt, j) => (
                            <div key={j} className="text-sm text-gray-500">• {opt}</div>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-emerald-600 mt-2 font-medium">✓ Réponse : {ex.correctAnswer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}