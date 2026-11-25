import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('skillswap_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and check user session
  const fetchMe = useCallback(async () => {
    const savedToken = localStorage.getItem('skillswap_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const u = response.data?.user || response.data?.data?.user || response.data?.data;
      if (response.data?.success && u) {
        setUser(u);
        localStorage.setItem('skillswap_user', JSON.stringify(u));
      } else {
        throw new Error('Failed to retrieve user profile');
      }
    } catch (err) {
      console.warn('Session check failed or token expired:', err.message);
      localStorage.removeItem('skillswap_token');
      localStorage.removeItem('skillswap_refreshToken');
      localStorage.removeItem('skillswap_user');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const u = response.data?.user || response.data?.data?.user || response.data?.data;
    const jwtToken = response.data?.token || response.data?.data?.token;
    const refreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;

    if (response.data?.success && u && jwtToken) {
      localStorage.setItem('skillswap_token', jwtToken);
      if (refreshToken) localStorage.setItem('skillswap_refreshToken', refreshToken);
      localStorage.setItem('skillswap_user', JSON.stringify(u));
      setToken(jwtToken);
      setUser(u);
      return u;
    }
    throw new Error(response.data?.message || 'Login failed');
  };

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload);
    const u = response.data?.user || response.data?.data?.user || response.data?.data;
    const jwtToken = response.data?.token || response.data?.data?.token;
    const refreshToken = response.data?.refreshToken || response.data?.data?.refreshToken;

    if (response.data?.success && u && jwtToken) {
      localStorage.setItem('skillswap_token', jwtToken);
      if (refreshToken) localStorage.setItem('skillswap_refreshToken', refreshToken);
      localStorage.setItem('skillswap_user', JSON.stringify(u));
      setToken(jwtToken);
      setUser(u);
      return u;
    }
    throw new Error(response.data?.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('skillswap_token');
    localStorage.removeItem('skillswap_refreshToken');
    localStorage.removeItem('skillswap_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('skillswap_user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      const u = res.data?.user || res.data?.data?.user || res.data?.data;
      if (res.data?.success && u) {
        setUser(u);
        localStorage.setItem('skillswap_user', JSON.stringify(u));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

