import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { authApi } from '../services/authApi';
import { isTokenExpired, getTokenExpirationTime } from '../utils/tokenUtils';
import apiInterceptor from '../services/apiInterceptor';

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
  const refreshTimerRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // Load user on mount
  useEffect(() => {
    const initAuth = async () => {
      if (accessToken) {
        // Check if token is expired
        if (isTokenExpired(accessToken) && refreshToken) {
          console.log('Access token expired on load, attempting refresh...');
          try {
            const newToken = await refresh();
            if (newToken) {
              const userData = await authApi.getCurrentUser(newToken);
              setUser(userData);
            }
          } catch (error) {
            console.error('Failed to refresh token on load:', error);
            logout();
          }
        } else {
          try {
            const userData = await authApi.getCurrentUser(accessToken);
            setUser(userData);
            // Schedule refresh for valid token
            scheduleTokenRefresh(accessToken);
          } catch (error) {
            console.error('Failed to load user:', error.message);
            // Only logout if it's an auth error, not network or CORS error
            if (error.message.includes('Unauthorized') || error.message === 'UNAUTHORIZED') {
              // Try to refresh token before logging out
              if (refreshToken) {
                try {
                  const newToken = await refresh();
                  const userData = await authApi.getCurrentUser(newToken);
                  setUser(userData);
                } catch (refreshError) {
                  console.error('Failed to refresh after auth error:', refreshError);
                  logout();
                }
              } else {
                logout();
              }
            } else {
              // For other errors (network, CORS), just clear loading but keep token
              console.warn('Could not verify token, but keeping it for retry');
            }
          }
        }
      }
      setLoading(false);
    };

    initAuth();

    // Cleanup timer on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const login = async (credentials) => {
    try {
      const data = await authApi.login(credentials);
      
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      
      // Schedule automatic token refresh
      scheduleTokenRefresh(data.accessToken);
      
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
      
      // Schedule automatic token refresh
      scheduleTokenRefresh(data.accessToken);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    // Clear refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const refresh = async () => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshingRef.current) {
      console.log('Token refresh already in progress, skipping...');
      return accessToken;
    }

    try {
      isRefreshingRef.current = true;
      console.log('Refreshing access token...');
      
      const data = await authApi.refreshToken(refreshToken);
      localStorage.setItem('accessToken', data.accessToken);
      setAccessToken(data.accessToken);
      
      // Schedule next refresh
      scheduleTokenRefresh(data.accessToken);
      
      console.log('Access token refreshed successfully');
      return data.accessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
      throw error;
    } finally {
      isRefreshingRef.current = false;
    }
  };

  // Schedule automatic token refresh
  const scheduleTokenRefresh = (token) => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!token) return;

    const timeRemaining = getTokenExpirationTime(token);
    if (timeRemaining <= 0) {
      console.log('Token already expired, refreshing immediately');
      refresh();
      return;
    }

    // Refresh 1 minute before expiration (or halfway if token expires in less than 2 minutes)
    const refreshBuffer = Math.min(60 * 1000, timeRemaining / 2);
    const refreshTime = timeRemaining - refreshBuffer;

    console.log(`Scheduling token refresh in ${Math.floor(refreshTime / 1000)} seconds`);

    refreshTimerRef.current = setTimeout(() => {
      refresh();
    }, refreshTime);
  };

  // Check and refresh token if needed
  const ensureValidToken = async () => {
    if (!accessToken) return null;

    if (isTokenExpired(accessToken)) {
      console.log('Access token expired, refreshing...');
      try {
        return await refresh();
      } catch (error) {
        return null;
      }
    }

    return accessToken;
  };

  const value = {
    user,
    loading,
    accessToken,
    login,
    register,
    logout,
    refresh,
    ensureValidToken,
    isAuthenticated: !!user,
  };

  // Inject auth context into API interceptor
  useEffect(() => {
    apiInterceptor.setAuthContext(value);
  }, [accessToken, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
