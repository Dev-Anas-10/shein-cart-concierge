'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useThemeLang } from '@/lib/theme-lang-context';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, login, isLoading: authLoading } = useAuth();
  const { dir, lang } = useThemeLang();
  const isRtl = dir === 'rtl';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated as admin, jump straight to the dashboard
  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      router.replace('/admin');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isRtl ? 'بيانات الدخول غير صحيحة' : 'Invalid login credentials'));
      }

      login(data.data);
      window.location.href = '/admin';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#0A0713]">
      {/* Editorial Luxury Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2074&auto=format&fit=crop')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-black via-[#0c0914]/95 to-[#1c0e29]/90 pointer-events-none" />

      {/* Atmospheric Ambient Glows */}
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-rose-600/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 right-1/3 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl pointer-events-none animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md bg-white/95 dark:bg-[#14101e]/90 backdrop-blur-3xl rounded-[32px] shadow-[0_30px_90px_rgba(0,0,0,0.65)] border border-white/60 dark:border-purple-500/25 p-7 sm:p-9 text-neutral-900 dark:text-white"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-5 border-b border-neutral-100 dark:border-[#262035]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-rose-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-neutral-950 dark:text-white text-sm tracking-tight leading-none">
                SHEIN <span className="text-[#8B5CF6]">Concierge</span>
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium mt-0.5">
                {isRtl ? 'بوابة إدارة المنصة والمشرفين' : 'Admin & Staff Management'}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase tracking-wider">
            <span>Admin</span>
          </div>
        </div>

        {/* Headline */}
        <div className="pt-6 pb-4 text-start">
          <h2 className="text-2xl font-black text-neutral-950 dark:text-white tracking-tight">
            {isRtl ? 'تسجيل دخول لوحة التحكم' : 'Admin Console Sign In'}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
            {isRtl
              ? 'مخصص فقط للمشرفين وفريق إدارة الطلبات والشحنات.'
              : 'Authorized personnel only. Enter supervisor credentials.'}
          </p>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="text-start">
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              {isRtl ? 'البريد الإلكتروني للمشرف' : 'Admin Email'}
            </label>
            <div className="relative">
              <Mail className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-neutral-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className={`w-full py-2.5 text-xs bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200/80 dark:border-[#2f2742] rounded-xl focus:bg-white dark:focus:bg-[#201a2e] focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'
                }`}
              />
            </div>
          </div>

          <div className="text-start">
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              {isRtl ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-neutral-400 ${isRtl ? 'right-3.5' : 'left-3.5'}`} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full py-2.5 text-xs bg-neutral-50 dark:bg-[#1a1626] border border-neutral-200/80 dark:border-[#2f2742] rounded-xl focus:bg-white dark:focus:bg-[#201a2e] focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'
                }`}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-rose-600 via-purple-600 to-[#7C3AED] hover:from-rose-500 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isRtl ? 'جاري التحقق من الصلاحيات...' : 'Authenticating...'}</span>
              </>
            ) : (
              <span>{isRtl ? 'دخول لوحة التحكم الآن' : 'Access Admin Dashboard'}</span>
            )}
          </motion.button>
        </form>

        {/* Back to Customer Store */}
        <div className="mt-5 pt-3.5 border-t border-neutral-100 dark:border-[#201b2d] text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors"
          >
            {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isRtl ? 'الرجوع للمتجر واستخراج السلات' : 'Back to Store & Cart Extractor'}</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
