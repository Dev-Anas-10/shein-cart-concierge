'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  ShoppingBag,
  ShieldCheck,
  User,
  LogOut,
  Sparkles,
  ArrowRightLeft,
  LogIn,
  Layers,
  ChevronRight,
} from 'lucide-react';

export function Navbar({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const pathname = usePathname();
  const { user, logout, switchRole } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top Luxury Announcement Bar */}
      <div className="bg-gradient-to-r from-neutral-950 via-zinc-900 to-neutral-950 text-white text-[11px] py-2 px-4 border-b border-white/10 font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-neutral-300">
              SHEIN Cart Concierge • Cairo Hub
            </span>
            <span className="hidden sm:inline text-neutral-500">|</span>
            <span className="hidden sm:inline text-neutral-400">
              Instant Extraction, 20% Dynamic Markup & Direct InstaPay / Vodafone Cash Settlements
            </span>
          </div>

          <div className="flex items-center gap-4 text-neutral-400 text-[11px]">
            <span className="hidden md:inline font-mono">1 EGP = Official Base</span>
            <span className="text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              ⚡ Same-Day Admin Approvals
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Glass Header */}
      <div className="glass-panel border-b border-neutral-200/80 shadow-sm backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-neutral-900 to-black text-white flex items-center justify-center font-black tracking-tighter text-xl shadow-lg shadow-black/20 group-hover:scale-105 transition-all duration-300 border border-white/15">
                S
              </div>
              <div>
                <div className="font-black text-neutral-950 tracking-tighter text-xl flex items-center gap-1.5 leading-none">
                  SHEIN <span className="text-rose-600 font-extrabold">CONCIERGE</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md border border-rose-200/60 ml-1">
                    EGYPT
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-medium tracking-tight mt-1">
                  Cart Extraction & Financial Gateway
                </p>
              </div>
            </Link>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 p-1 bg-neutral-100/80 rounded-2xl border border-neutral-200/60">
              <Link
                href="/"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  pathname === '/'
                    ? 'bg-white text-neutral-900 shadow-sm shadow-black/5 font-extrabold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
                Extract Cart
              </Link>

              <Link
                href="/orders"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  pathname.startsWith('/orders')
                    ? 'bg-white text-neutral-900 shadow-sm shadow-black/5 font-extrabold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                My Orders
              </Link>

              <Link
                href="/admin"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  pathname.startsWith('/admin')
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 font-extrabold'
                    : 'text-neutral-600 hover:text-rose-600 hover:bg-rose-50/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Dashboard
                {user?.role === 'admin' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                )}
              </Link>
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-4">
            {/* Quick Role Switcher for instant testing */}
            <div className="hidden sm:flex items-center bg-neutral-100 p-1 rounded-2xl border border-neutral-200">
              <button
                onClick={() => switchRole('user')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  user?.role === 'user'
                    ? 'bg-white text-neutral-900 shadow-xs font-extrabold'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Customer
              </button>

              <button
                onClick={() => switchRole('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  user?.role === 'admin'
                    ? 'bg-rose-600 text-white shadow-xs font-extrabold'
                    : 'text-neutral-500 hover:text-rose-600'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-200">
                  <div className="relative">
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                      alt={user.name}
                      className="w-9 h-9 rounded-xl border border-neutral-200 object-cover shadow-xs"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-extrabold text-neutral-900 leading-tight">{user.name}</p>
                    <p className="text-neutral-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">
                      {user.role === 'admin' ? 'Supervisor' : 'Verified Buyer'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-neutral-950 text-white hover:bg-neutral-800 transition-all shadow-md active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
