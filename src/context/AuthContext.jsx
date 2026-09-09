import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('soems_user');
      const savedSession = localStorage.getItem('soems_session');
      return (savedUser && savedSession) ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    localStorage.setItem('soems_user', JSON.stringify(data.user));
    localStorage.setItem('soems_session', JSON.stringify(data.session));
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, role = 'student') => {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: { name, email, password, role },
    });
    return data;
  };

  const logout = async () => {
    localStorage.removeItem('soems_user');
    localStorage.removeItem('soems_session');
    setUser(null);
    try {
      await supabase.auth.signOut();
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
    if (!loading && user && role && user.role !== role) {
      navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
    }
  }, [user, loading, role, navigate]);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  if (!user) return null;
  if (role && user.role !== role) return null;

  return children;
}
