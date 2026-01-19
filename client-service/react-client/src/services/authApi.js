// Auth API Service
import apiInterceptor from './apiInterceptor';
import { API_BASE_URL, OAUTH2_URL, isNgrok, isPrivateIP, useProxy } from '../config/apiConfig';

export const authApi = {
  // Register new user
  register: async (userData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Registration failed');
      }

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error(response.data || 'Registration failed');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Login failed');
      }

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error(response.data || 'Login failed');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh?refreshToken=${refreshToken}`, {
        method: 'POST',
      });

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error('Token refresh failed');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async (token) => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/user/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies if any
      });

      // Check if response is redirect (302/301) or unauthorized (401)
      if (res.status === 401 || res.status === 302 || res.status === 301) {
        throw new Error('UNAUTHORIZED');
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('INVALID_RESPONSE_TYPE');
      }

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error('Failed to get user data');
      }

      return response.data;
    } catch (error) {
      // Don't log full error to avoid exposing redirect URLs
      if (error.message === 'UNAUTHORIZED') {
        throw new Error('Unauthorized - Please login again');
      }
      throw error;
    }
  },

  // Google OAuth login
  // Works on: localhost, ngrok (via proxy), public domains
  // NOT on: private IPs without proxy
  googleLogin: () => {
    // Check if accessing from private IP (LAN) without proxy
    if (!useProxy && isPrivateIP) {
      alert(
        '⚠️ Google OAuth không hỗ trợ private IP!\n\n' +
        'Để đăng nhập bằng Google, vui lòng:\n' +
        '1. Truy cập từ máy chủ: http://localhost:5173\n' +
        '2. Hoặc sử dụng ngrok tunnel (xem NGROK_SETUP.md)\n' +
        '3. Hoặc sử dụng đăng nhập thường (username/password)\n\n' +
        'Lý do: Google chặn OAuth redirect đến IP nội bộ (192.168.x.x) vì lý do bảo mật.'
      );
      return;
    }
    
    window.location.href = OAUTH2_URL;
  },

  // Check if Google OAuth is available
  // Available on: localhost, ngrok/external domains (via proxy)
  // NOT available on: private IPs without proxy
  isGoogleOAuthAvailable: () => {
    if (useProxy) return true;  // Proxy mode always supports OAuth
    const currentHost = window.location.hostname;
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') return true;
    return !isPrivateIP;
  },
};
