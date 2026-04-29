import { createContext, useEffect, useMemo, useState } from 'react';
import api, { extractApiError } from '../services/api';

export const AuthContext = createContext(null);

export const getDefaultRouteByRole = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'staff') return '/staff/tables';
  if (role === 'cuisine') return '/cuisine/tickets';
  return '/login';
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('tsaralaza_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('tsaralaza_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('tsaralaza_token', token);
    } else {
      localStorage.removeItem('tsaralaza_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('tsaralaza_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tsaralaza_user');
    }
  }, [user]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', credentials);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw new Error(extractApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // noop
    }
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      logout
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
