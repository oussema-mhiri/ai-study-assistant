// app/(auth)/login/page.js
'use client';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { Mail, Lock, Loader2, Brain, GraduationCap, Clock, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result?.success) {
      setError(result?.error || 'Email ou mot de passe incorrect.');
    }
    setLoading(false);
  };

  // Icônes réutilisables
  const InputIcon = ({ Icon, ...props }) => (
    <Icon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Partie gauche – Formulaire */}
        <div className="w-full md:w-1/2 px-8 py-12 md:px-12 lg:px-16">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-xl font-bold text-gray-800">AI Study Assistant</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">Bienvenue</h1>
          <p className="text-gray-500 mb-8">Connectez-vous pour continuer votre apprentissage</p>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse e-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition duration-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition duration-200"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                Se souvenir de moi
              </label>
              <Link href="#" className="text-blue-600 hover:underline">Mot de passe oublié ?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-lg disabled:opacity-60 transition duration-300"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            Vous n'avez pas encore de compte ?{' '}
            <Link href="/register" className="text-blue-600 font-semibold hover:underline">
              Créer un compte
            </Link>
          </p>

          <div className="mt-8 text-center text-xs text-gray-400 border-t border-gray-100 pt-6">
            <div className="flex justify-center gap-6">
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" /> Sécurisé
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" /> 24/7
              </span>
            </div>
          </div>
        </div>

        {/* Partie droite – Illustration & Stats */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">AI Study Assistant</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Votre compagnon intelligent</h2>
            <p className="text-blue-100 text-sm mb-8">Apprenez plus efficacement avec l'intelligence artificielle</p>
            
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