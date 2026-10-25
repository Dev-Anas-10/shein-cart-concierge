'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useThemeLang } from '@/lib/theme-lang-context';
import { SupportModal } from './SupportModal';
import {
  ShoppingBag,
  ShieldCheck,
  LogOut,
  LogIn,
  Plus,
  Headphones,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';

export function Navbar({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, lang, toggleLang, theme, toggleTheme } = useThemeLang();
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#121018]/90 backdrop-blur-md border-b border-neutral-100 dark:border-[#2a2538] transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9061F9] to-[#C084FC] text-white flex items-center justify-center font-black text-lg shadow-sm shadow-purple-500/20 group-hover:scale-105 transition-transform duration-200">
              S
            </div>
            <div>
              <div className="font-extrabold text-neutral-900 dark:text-white tracking-tight text-base flex items-center gap-1.5 leading-none">
                SHEIN <span className="text-[#8B5CF6] font-bold">Concierge</span>
              </div>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium tracking-tight mt-0.5">
                {t.brandSubtitle}
              </p>
            </div>
          </Link>

          {/* Center Pill Nav */}
          <nav className="hidden sm:flex items-center gap-1 p-1 bg-neutral-100/70 dark:bg-[#1e1a29] rounded-full border border-neutral-200/50 dark:border-[#2a2538]">
            <Link
              href="/"
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                pathname === '/'
                  ? 'bg-white dark:bg-[#2b243b] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {t.extractCart}
            </Link>

            <Link
              href="/orders"
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                pathname.startsWith('/orders')
                  ? 'bg-white dark:bg-[#2b243b] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {t.myOrders}
            </Link>

            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  pathname.startsWith('/admin')
                    ? 'bg-[#8B5CF6] text-white shadow-xs'
                    : 'text-[#8B5CF6] hover:bg-purple-50 dark:hover:bg-purple-950/40'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {t.admin}
              </Link>
            )}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switcher (Ar / En) */}
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-neutral-100 dark:bg-[#221e2d] hover:bg-neutral-200 dark:hover:bg-[#2e293d] text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer border border-neutral-200/60 dark:border-[#2a2538]"
              title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
            >
              <Globe className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
            </button>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#221e2d] hover:bg-neutral-200 dark:hover:bg-[#2e293d] text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition-colors cursor-pointer border border-neutral-200/60 dark:border-[#2a2538]"
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-700" />
              )}
            </button>

            {/* New Order Button */}
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F5EDFF] dark:bg-purple-950/40 hover:bg-[#E9D5FF] text-[#7C3AED] dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.newOrder}</span>
            </Link>

            {/* Support Contact Button */}
            <button
              onClick={() => setSupportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-neutral-50 dark:bg-[#1a1722] hover:bg-neutral-100 dark:hover:bg-[#221e2d] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#2a2538] transition-all active:scale-95 cursor-pointer"
              title={t.support}
            >
              <Headphones className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span className="hidden lg:inline">{t.support}</span>
            </button>

            {/* User Session */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 bg-neutral-50 dark:bg-[#1a1722] rounded-full border border-neutral-200/60 dark:border-[#2a2538]">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-purple-300"
                  />
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 hidden sm:inline">
                    {user.name.split(' ')[0]}
                  </span>
                  {user.role === 'admin' && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED] dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>

                <button
                  onClick={logout}
                  className="w-8 h-8 rounded-full border border-neutral-200 dark:border-[#2a2538] flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#221e2d] transition-colors cursor-pointer"
                  title={t.signOut}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-full text-xs font-extrabold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all shadow-sm shadow-purple-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.signIn}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Support Contact Modal */}
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </>
  );
}
