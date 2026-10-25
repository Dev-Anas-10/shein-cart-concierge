'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  ShoppingBag,
  ShieldCheck,
  LogOut,
  LogIn,
  Layers,
  Sparkles,
} from 'lucide-react';

export function Navbar({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-neutral-100 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo - Minimalist & Elegant */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9061F9] to-[#C084FC] text-white flex items-center justify-center font-black text-lg shadow-sm shadow-purple-500/20 group-hover:scale-105 transition-transform duration-200">
            S
          </div>
          <div>
            <div className="font-extrabold text-neutral-900 tracking-tight text-base flex items-center gap-1.5 leading-none">
              SHEIN <span className="text-[#8B5CF6] font-bold">Concierge</span>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium tracking-tight mt-0.5">
              Cairo Hub • Egypt
            </p>
          </div>
        </Link>

        {/* Center Pill Nav */}
        <nav className="hidden sm:flex items-center gap-1 p-1 bg-neutral-100/70 rounded-full border border-neutral-200/50">
          <Link
            href="/"
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              pathname === '/'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Extract Cart
          </Link>

          <Link
            href="/orders"
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              pathname.startsWith('/orders')
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            My Orders
          </Link>

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                pathname.startsWith('/admin')
                  ? 'bg-[#8B5CF6] text-white shadow-xs'
                  : 'text-[#8B5CF6] hover:bg-purple-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-neutral-50 rounded-full border border-neutral-200/60">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-300"
                />
                <span className="text-xs font-bold text-neutral-800 hidden md:inline">
                  {user.name.split(' ')[0]}
                </span>
                {user.role === 'admin' && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED] bg-purple-100 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </div>

              <button
                onClick={logout}
                className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-5 py-2 rounded-full text-xs font-extrabold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all shadow-sm shadow-purple-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
