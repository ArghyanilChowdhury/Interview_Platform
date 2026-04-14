import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef(localStorage.getItem('auth_token'));

  const getAuthHeaders = useCallback(() => {
    const t = tokenRef.current || localStorage.getItem('auth_token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, []);

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('auth_token');
    const authType = localStorage.getItem('auth_type');
    
    // For JWT auth, require token
    // For Google auth, cookies are used (withCredentials handles it)
    if (!storedToken && authType !== 'google') {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const headers = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};
      const res = await axios.get(`${API}/auth/me`, {
        headers,
        withCredentials: true
      });
      setUser(res.data);
    } catch {
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_type');
      tokenRef.current = null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const res = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
    if (res.data.token) {
      localStorage.setItem('auth_token', res.data.token);
      tokenRef.current = res.data.token;
    }
    setUser(res.data);
    return res.data;
  };

  const register = async (email, otp, password, name) => {
    const res = await axios.post(`${API}/auth/register`, { email, otp, password, name }, { withCredentials: true });
    if (res.data.token) {
      localStorage.setItem('auth_token', res.data.token);
      tokenRef.current = res.data.token;
    }
    setUser(res.data);
    return res.data;
  };

  const loginWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const exchangeSession = async (sessionId) => {
    const res = await axios.get(`${API}/auth/session`, {
      headers: { 'X-Session-ID': sessionId },
      withCredentials: true
    });
    // Store session token for persistence
    if (res.data.user_id) {
      // For Google auth, we rely on httpOnly cookie, but also store a flag
      localStorage.setItem('auth_type', 'google');
    }
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
    } catch { /* ignore */ }
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_type');
    tokenRef.current = null;
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, { headers: getAuthHeaders(), withCredentials: true });
      setUser(res.data);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, loginWithGoogle,
      exchangeSession, logout, checkAuth, getAuthHeaders, refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
