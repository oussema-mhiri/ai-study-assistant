'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import {
  Bell, Settings, Clock, Mail, BellRing, CheckCircle,
  BookOpen, Calendar, Loader2, Trash2, AlertTriangle, Brain
} from 'lucide-react';

function Toggle({ enabled, onChange, label }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</span>
      <div
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
          enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </div>
    </label>
  );
}

const TYPE_CONFIG = {
  planning: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/50' },
  rappel_session: { icon: BellRing, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/50' },
  rappel_exam_3j: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/50' },
  rappel_exam_1j: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/50' },
  rappel: { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
};

function NotificationCard({ notif, onMarkRead }) {
  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.rappel;
  const Icon = config.icon;
  const timeAgo = getTimeAgo(notif.created_at);

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${
        notif.lue
          ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
          : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/50 shadow-sm dark:shadow-none'
      }`}
    >
      <div className={`p-2.5 rounded-xl ${notif.lue ? 'bg-gray-100 dark:bg-gray-800' : config.bg}`}>
        <Icon className={`w-5 h-5 ${notif.lue ? 'text-gray-500 dark:text-gray-400' : config.color}`} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className={`text-sm font-semibold ${notif.lue ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>{notif.titre}</h4>
          <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
            notif.lue ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-blue-500 text-white'
          }`}>
            {notif.lue ? 'Lue' : 'Non lue'}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 block">{timeAgo}</span>
      </div>
      {!notif.lue && (
        <button
          onClick={() => onMarkRead(notif.id)}
          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0"
          title="Marquer comme lu"
        >
          <CheckCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  // Preferences
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [reminderHour, setReminderHour] = useState('18:00');
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/planning/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread || 0);
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  // Fetch user preferences
  const fetchPreferences = async () => {
    try {
      const res = await api.get('/auth/me');
      setPushEnabled(res.data.notif_push !== false);
      setEmailEnabled(res.data.notif_email !== false);
      setReminderHour(res.data.notif_hour || '18:00');
    } catch (err) {
      console.error('Erreur chargement préférences:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [user]);

  // Save preferences
  const savePreferences = async (overrides = {}) => {
    setSavingPrefs(true);
    try {
      await api.put('/auth/notif-preferences', {
        notifPush: overrides.notifPush ?? pushEnabled,
        notifEmail: overrides.notifEmail ?? emailEnabled,
        notifHour: overrides.notifHour ?? reminderHour,
      });
    } catch (err) {
      console.error('Erreur sauvegarde préférences:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleTogglePush = (val) => {
    setPushEnabled(val);
    savePreferences({ notifPush: val });
  };

  const handleToggleEmail = (val) => {
    setEmailEnabled(val);
    savePreferences({ notifEmail: val });
  };

  const handleHourChange = (val) => {
    setReminderHour(val);
    savePreferences({ notifHour: val });
  };

  // Mark single as read
  const handleMarkRead = async (notifId) => {
    try {
      await api.patch(`/planning/notifications/${notifId}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, lue: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur marquer lu:', err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await api.patch('/planning/notifications/all/read');
      setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Erreur marquer tout lu:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar activePath="/notifications" onLogout={logout} />

      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-4xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-blue-600" />
                Centre de notifications
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">Gérez vos alertes, rappels et notifications.</p>
            </div>
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* PARAMÈTRES */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-5">
              <Settings className="w-5 h-5 text-blue-500" />
              Paramètres des notifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-blue-500" />
                  Notifications in-app
                </h3>
                <div className="space-y-3">
                  <Toggle label="Activer les notifications" enabled={pushEnabled} onChange={handleTogglePush} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  Notifications par email
                </h3>
                <div className="space-y-3">
                  <Toggle label="Activer les emails de rappel" enabled={emailEnabled} onChange={handleToggleEmail} />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Heure des rappels
              </h3>
              <input
                type="time"
                value={reminderHour}
                onChange={(e) => handleHourChange(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
              {savingPrefs && <span className="ml-3 text-xs text-gray-400">Sauvegarde...</span>}
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" />
                Notifications récentes
              </h2>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {loadingNotifs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Aucune notification pour le moment.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Les rappels de sessions et d'examens apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <NotificationCard key={notif.id} notif={notif} onMarkRead={handleMarkRead} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
