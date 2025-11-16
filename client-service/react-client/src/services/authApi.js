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
        body: JSON.stringify(userData),
      });

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
        body: JSON.stringify(credentials),
      });

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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error('Failed to get user data');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Google OAuth login
  googleLogin: () => {
    window.location.href = `http://localhost:60/oauth2/authorization/google`;
  },
};
