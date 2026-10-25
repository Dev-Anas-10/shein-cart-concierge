'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';
import { getSupabase } from './supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

const SESSION_KEY = 'shein_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. First restore from local storage for instant UI responsiveness
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id && parsed?.email && parsed?.role) {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }

    // 2. Sync with Supabase Auth (for official Google OAuth redirects)
    const sb = getSupabase();
    if (sb) {
      const handleSupabaseSession = (sessionUser: any) => {
        if (!sessionUser) return;
        const meta = sessionUser.user_metadata || {};
        const email = sessionUser.email || '';
        const detectedName = meta.full_name || meta.name || email.split('@')[0] || 'Customer';
        const detectedAvatar =
          meta.avatar_url ||
          meta.picture ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(detectedName)}`;

        const mapped: User = {
          id: sessionUser.id,
          name: detectedName,
          email,
          role: 'user',
          avatar: detectedAvatar,
          phone: sessionUser.phone || meta.phone || '',
          createdAt: sessionUser.created_at || new Date().toISOString(),
        };

        setUser(mapped);
        localStorage.setItem(SESSION_KEY, JSON.stringify(mapped));

        // Sync to public.users table in Supabase
        fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name: detectedName,
            avatar: detectedAvatar,
            phone: mapped.phone,
          }),
        }).catch(() => {});
      };

      // Check current session
      sb.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          handleSupabaseSession(session.user);
        }
      });

      // Listen for OAuth redirect return
      const { data: authListener } = sb.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          handleSupabaseSession(session.user);
        }
      });

      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.clear();
    } catch {}
    const sb = getSupabase();
    if (sb) {
      sb.auth.signOut().catch(() => {});
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
