// app/(auth)/register/page.js
'use client';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import {
  User, Mail, Lock, School, BookOpen, GraduationCap, Layers,
  Loader2, Brain, CheckCircle, Clock
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
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <InputIcon Icon={Icon} />
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          onChange={handleChange}
          className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition duration-200"
          required={name === 'fullName' || name === 'email' || name === 'password'}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      {/* Conteneur principal */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row items-stretch">

        {/* PARTIE GAUCHE – FORMULAIRE */}
        <div className="w-full md:w-7/12 px-8 py-8 md:px-10 lg:px-12 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Brain className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="text-lg font-bold text-gray-800">AI Study Assistant</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Créer un compte</h1>
          <p className="text-sm text-gray-500 mb-5">Rejoignez la communauté et boostez votre apprentissage</p>

          {error && (
            <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {field('fullName', 'Nom complet', User, 'text', '')}
            {field('email', 'Adresse e-mail', Mail, 'email', 'vous@exemple.com')}
            {field('password', 'Mot de passe', Lock, 'password', '••••••••')}

            <div className="grid grid-cols-2 gap-3">
              {field('university', 'Université', School, 'text', '')}
              {field('faculty', 'Faculté', BookOpen, 'text', '')}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {field('studyLevel', "Niveau", GraduationCap, 'text', '')}
              {field('major', 'Filière', Layers, 'text', '')}
            </div>

            <div className="flex items-start gap-2 text-xs text-gray-600">
              <input type="checkbox" className="w-3.5 h-3.5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" required />
              <span>
                J'accepte les <span className="text-blue-600">conditions d'utilisation</span> et la <span className="text-blue-600">politique de confidentialité</span>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-lg disabled:opacity-60 transition duration-300"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Création...' : "S'inscrire"}
            </button>
          </form>

          <p className="text-center mt-4 text-xs text-gray-500">
            Vous avez déjà un compte ?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>

          <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-100 pt-4">
            <div className="flex justify-center gap-4">
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" /> Sécurisé
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" /> 24/7
              </span>
            </div>
          </div>
        </div>

        {/* PARTIE DROITE – IMAGE (PLEINE HAUTEUR, SANS MARGE) */}
        <div className="hidden lg:flex w-[55%] bg-white items-stretch">
          <div className="relative w-full h-full min-h-[500px]">
            <Image
              src="/image/register.png"
              alt="Illustration d'inscription"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>

      </div>
    </div>
  );
}