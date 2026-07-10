// app/(auth)/register/page.js
'use client';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { 
  User, Mail, Lock, School, BookOpen, GraduationCap, Layers, 
  Loader2, Brain, CheckCircle, Clock, Shield, Sparkles 
} from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    university: '',
    faculty: '',
    studyLevel: '',
    major: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await register(form);
    if (!result?.success) {
      setError(result?.error || 'Une erreur est survenue.');
    }
    setLoading(false);
  };

  const InputIcon = ({ Icon }) => (
    <Icon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
  );

  const field = (name, label, Icon, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <InputIcon Icon={Icon} />
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          onChange={handleChange}
          className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition duration-200"
          required={name === 'fullName' || name === 'email' || name === 'password'}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Partie gauche – Formulaire */}
        <div className="w-full md:w-3/5 px-8 py-12 md:px-12 lg:px-16">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-xl font-bold text-gray-800">AI Study Assistant</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Créer un compte</h1>
          <p className="text-gray-500 mb-8">Rejoignez la communauté et boostez votre apprentissage</p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('fullName', 'Nom complet', User, 'text', 'Jean Dupont')}
            {field('email', 'Adresse e-mail', Mail, 'email', 'vous@exemple.com')}
            {field('password', 'Mot de passe', Lock, 'password', '••••••••')}

            <div className="grid grid-cols-2 gap-4">
              {field('university', 'Université', School, 'text', 'ISITCOM')}
              {field('faculty', 'Faculté', BookOpen, 'text', 'Informatique')}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {field('studyLevel', "Niveau d'études", GraduationCap, 'text', 'Licence 2')}
              {field('major', 'Filière / Branche', Layers, 'text', 'Génie logiciel')}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" required />
              <span>
                J'accepte les <Link href="#" className="text-blue-600 hover:underline">conditions d'utilisation</Link> et la <Link href="#" className="text-blue-600 hover:underline">politique de confidentialité</Link>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-lg disabled:opacity-60 transition duration-300"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Création...' : "S'inscrire"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            Vous avez déjà un compte ?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>

        {/* Partie droite – Illustration & Stats */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">AI Study Assistant</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">L'apprentissage intelligent</h2>
            <p className="text-blue-100 text-sm mb-8">Rejoignez 500+ étudiants déjà inscrits</p>
            
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
                <div className="bg-white/20 rounded-xl p-3">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">150+</p>
                  <p className="text-sm text-blue-100">cours analysés</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
                <div className="bg-white/20 rounded-xl p-3">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">24/7</p>
                  <p className="text-sm text-blue-100">IA disponible</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
                <div className="bg-white/20 rounded-xl p-3">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">95%</p>
                  <p className="text-sm text-blue-100">de satisfaction</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-blue-200 border-t border-white/10 pt-4">
            <div className="font-mono text-xs">
              <span className="font-mono text-xs">
                f = √( (2πσ²) / ae )
              </span>
            </div>
            <p className="text-xs mt-1">Points clés</p>
          </div>
        </div>
      </div>
    </div>
  );
}