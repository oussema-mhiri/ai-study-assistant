'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Key, Loader2, Brain, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email) {
      router.push('/forgot-password');
    }
  }, [email, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/verify-reset-code', {
        email,
        code,
      });

      sessionStorage.setItem('resetTempToken', res.data.tempToken);
      router.push('/reset-password');
    } catch (err) {
      setError(err.response?.data?.message || 'Code invalide.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800">AI Study Assistant</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Vérification</h1>
        <p className="text-gray-500 mb-2">
          Un code à 6 chiffres a été envoyé à :
        </p>
        <p className="text-sm font-medium text-blue-600 mb-6 break-all">{email}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Code de vérification</label>
            <div className="relative">
              <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                className="w-full pl-10 pr-4 py-3 text-black border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition text-center tracking-[4px] sm:tracking-[6px] md:tracking-[10px] font-bold text-base sm:text-lg overflow-hidden"
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
            {loading ? 'Vérification...' : 'Vérifier le code'}
          </button>
        </form>

        <Link
          href="/forgot-password"
          className="flex items-center justify-center gap-1 mt-4 text-sm text-gray-500 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Renvoyer un nouveau code
        </Link>
      </div>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    }>
      <VerifyCodeContent />
    </Suspense>
  );
}
