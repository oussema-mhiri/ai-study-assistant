'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Mail, Loader2, Brain, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/request-reset-code', { email });
      // Rediriger vers la page de vérification
      router.push(`/verify-code?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800">AI Study Assistant</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mot de passe oublié</h1>
        <p className="text-gray-500 mb-6">
          Saisissez votre email pour recevoir un code de réinitialisation à 6 chiffres.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg disabled:opacity-60 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Envoi...' : 'Envoyer le code'}
          </button>
        </form>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1 mt-4 text-sm text-gray-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}