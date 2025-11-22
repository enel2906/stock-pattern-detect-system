import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

  // Load user on mount
  useEffect(() => {
    const initAuth = async () => {
      if (accessToken) {
        try {
          const userData = await authApi.getCurrentUser(accessToken);
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user:', error.message);
          // Only logout if it's an auth error, not network or CORS error
          if (error.message.includes('Unauthorized') || error.message === 'UNAUTHORIZED') {
            logout();
          } else {
            // For other errors (network, CORS), just clear loading but keep token
            // User can try again later
            console.warn('Could not verify token, but keeping it for retry');
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const data = await authApi.login(credentials);
      
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authApi.register(userData);
      
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const refresh = async () => {
    try {
      const data = await authApi.refreshToken(refreshToken);
      localStorage.setItem('accessToken', data.accessToken);
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const value = {
    user,
    loading,
    accessToken,
    login,
    register,
    logout,
    refresh,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
