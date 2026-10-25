'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  switchRole: (role: 'user' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  switchRole: () => {},
});

const DEFAULT_USER: User = {
  id: 'user-sara',
  name: 'Sara Ahmed',
  email: 'sara@example.com',
  role: 'user',
  phone: '01019283746',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  createdAt: new Date().toISOString(),
};

const DEFAULT_ADMIN: User = {
  id: 'user-admin',
  name: 'Admin Supervisor',
  email: 'admin@sheinextract.com',
  role: 'admin',
  phone: '+20 100 000 0000',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('shein_user_session');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Default to demo user for smooth testing
        setUser(DEFAULT_USER);
        localStorage.setItem('shein_user_session', JSON.stringify(DEFAULT_USER));
      }
    } catch (e) {
      setUser(DEFAULT_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('shein_user_session', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shein_user_session');
  };

  const switchRole = (role: 'user' | 'admin') => {
    const target = role === 'admin' ? DEFAULT_ADMIN : DEFAULT_USER;
    login(target);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
