'use client';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Loader2, Brain, CheckCircle, Clock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

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

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    const result = await loginWithGoogle(credentialResponse.credential);
    if (!result?.success) {
      setError(result?.error || 'Connexion Google échouée.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* PARTIE GAUCHE – FORMULAIRE */}
        <div className="w-full md:w-7/12 px-5 sm:px-8 py-8 sm:py-12 md:px-10 lg:px-16">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-xl font-bold text-gray-800">AI Study Assistant</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Bienvenue</h1>
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
                  className="w-full pl-10 pr-4 py-3 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition duration-200"
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
                  className="w-full pl-10 pr-4 py-3 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition duration-200"
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Se souvenir de moi
              </label>
                <Link href="/forgot-password" className="text-blue-600 hover:underline">
                  Mot de passe oublié ?
                </Link>            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-lg disabled:opacity-60 transition duration-300"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Connexion Google échouée.')}
              theme="outline"
              size="large"
              width="100%"
              text="continue_with"
              locale="fr"
            />
          </div>

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

        {/* PARTIE DROITE – IMAGE PLEINE */}
        <div className="hidden md:block w-full md:w-5/12 relative">
          <div className="relative w-full h-full min-h-[350px] md:min-h-[550px]">
            <Image
              src="/image/Login.png"
              alt="Illustration de connexion"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

      </div>
    </div>
  );
}