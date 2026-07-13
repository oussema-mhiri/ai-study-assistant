// frontend/context/AuthContext.js
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (data) => {
    try {
      const res = await api.post('/auth/register', data);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      toast.success('Inscription réussie !');
      router.push('/dashboard');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      toast.success('Connexion réussie !');
      router.push('/dashboard');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const res = await api.post('/auth/google', { credential });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      toast.success('Connexion réussie !');
      router.push('/dashboard');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur de connexion Google');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Déconnexion réussie');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}