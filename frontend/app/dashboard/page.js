'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <div className="text-center mt-20">Chargement...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>
      <p>Bienvenue, {user?.full_name} !</p>
      <button onClick={logout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
        Se déconnecter
      </button>
    </div>
  );
}