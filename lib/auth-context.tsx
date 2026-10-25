'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';

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
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate stored session has required fields
        if (parsed?.id && parsed?.email && parsed?.role) {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
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
