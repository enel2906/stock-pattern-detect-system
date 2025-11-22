// Auth API Service
const API_BASE_URL = 'http://localhost:60/api';

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
      const res = await fetch(`${API_BASE_URL}/user/me`, {
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
  googleLogin: () => {
    window.location.href = `http://localhost:60/oauth2/authorization/google`;
  },
};
