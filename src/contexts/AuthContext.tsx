import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  default_currency: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    if (token) {
      fetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUser() {
    try {
      const { data } = await api.get('/auth/user');
      setUser(data);
    } catch {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
    }
  }

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function register(name: string, email: string, password: string, password_confirmation: string) {
    const { data } = await api.post('/auth/register', { name, email, password, password_confirmation });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
