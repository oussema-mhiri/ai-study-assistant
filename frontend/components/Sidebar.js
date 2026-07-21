'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Brain, Bell, Settings, LogOut, Home, Layers, MessageSquare, CalendarDays, Menu, X,
} from 'lucide-react';

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

export default function Sidebar({ activePath, onLogout, unreadCount = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const navRef = useRef(null);

  useEffect(() => {
    const allItems = [...navItems, ...navFooterItems];
    const activeIndex = allItems.findIndex(item => item.href === activePath);
    if (navRef.current && activeIndex >= 0) {
      const buttons = navRef.current.querySelectorAll('[data-nav]');
      if (buttons[activeIndex]) {
        const btn = buttons[activeIndex];
        setIndicatorStyle({
          top: btn.offsetTop,
          height: btn.offsetHeight,
          opacity: 1,
        });
      }
    }
  }, [activePath]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-blue-900/40">
            <Brain className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-lg font-bold text-gray-800 dark:text-white tracking-tight">AI Study Assistant</span>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <nav className="flex flex-col gap-1.5 flex-1 relative" ref={navRef}>
        <div
          className="absolute left-0 w-full bg-blue-50 dark:bg-blue-950 rounded-xl transition-all duration-300 ease-out"
          style={{
            top: indicatorStyle.top || 0,
            height: indicatorStyle.height || 0,
            opacity: indicatorStyle.opacity || 0,
          }}
        />
        {navItems.map(({ label, icon: Icon, href }) => {
          const active = activePath === href;
          return (
            <Link
              key={href}
              href={href}
              data-nav
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 z-10 ${
                active
                  ? 'text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] transition-colors duration-200 ${active ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} strokeWidth={1.8} />
              {label}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 dark:bg-blue-400 rounded-r-full transition-all duration-300" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1.5 pt-4 border-t border-gray-100 dark:border-gray-800">
        {navFooterItems.map(({ label, icon: Icon, href }) => {
          const active = activePath === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 z-10 ${
                active
                  ? 'text-blue-700 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-[18px] h-[18px] transition-colors duration-200 ${active ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} strokeWidth={1.8} />
                {label === 'Notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {label}
            </Link>
          );
        })}
        <button
          onClick={() => { setMobileOpen(false); onLogout(); }}
          className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 text-left mt-2"
        >
          <LogOut className="w-[18px] h-[18px] text-gray-400 dark:text-gray-500" strokeWidth={1.8} />
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="hidden lg:block w-64 shrink-0" />

      <aside className={`
        fixed top-0 left-0 h-screen z-50
        w-64 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        flex flex-col px-5 py-7 shadow-sm
        transition-transform duration-300 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {sidebarContent}
      </aside>
    </>
  );
}
