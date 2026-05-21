import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, username: string, password: string, publicKey?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USERS: { email: string; password: string; user: User }[] = [
  {
    email: 'demo@deping.xyz',
    password: 'demo1234',
    user: {
      id: 'usr_01HX9DEMO',
      email: 'demo@deping.xyz',
      username: 'demo_operator',
      createdAt: '2025-01-15T09:00:00Z',
    },
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('dp_jwt');
    const storedUser = localStorage.getItem('dp_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('dp_jwt');
        localStorage.removeItem('dp_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 900));

    const match = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (!match) {
      setIsLoading(false);
      return { success: false, error: 'Invalid credentials. Please check your email and password.' };
    }

    const fakeToken = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ sub: match.user.id, exp: Date.now() + 86400000 }))}.sig`;
    setToken(fakeToken);
    setUser(match.user);
    localStorage.setItem('dp_jwt', fakeToken);
    localStorage.setItem('dp_user', JSON.stringify(match.user));
    setIsLoading(false);
    return { success: true };
  }, []);

  const signup = useCallback(async (email: string, username: string, _password: string, _publicKey?: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1100));

    const exists = MOCK_USERS.find((u) => u.email === email);
    if (exists) {
      setIsLoading(false);
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser: User = {
      id: `usr_${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      email,
      username,
      createdAt: new Date().toISOString(),
    };

    const fakeToken = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ sub: newUser.id, exp: Date.now() + 86400000 }))}.sig`;
    setToken(fakeToken);
    setUser(newUser);
    localStorage.setItem('dp_jwt', fakeToken);
    localStorage.setItem('dp_user', JSON.stringify(newUser));
    setIsLoading(false);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('dp_jwt');
    localStorage.removeItem('dp_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
