// Admin API Service
import apiInterceptor from './apiInterceptor';

const API_BASE_URL = 'http://localhost:60/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const adminApi = {
  /**
   * Get all users (Admin only)
   */
  getAllUsers: async () => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/admin/users`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.status === 403) {
        throw new Error('ACCESS_DENIED');
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error(response.data || 'Failed to get users');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user by ID (Admin only)
   */
  getUserById: async (userId) => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.status === 403) {
        throw new Error('ACCESS_DENIED');
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error(response.data || 'Failed to get user');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete user by ID (Admin only)
   */
  deleteUser: async (userId) => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.status === 403) {
        throw new Error('ACCESS_DENIED');
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error(response.data || 'Failed to delete user');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update user role (Admin only)
   */
  updateUserRole: async (userId, newRole) => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });

      if (res.status === 403) {
        throw new Error('ACCESS_DENIED');
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error(response.data || 'Failed to update user role');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get admin dashboard statistics (Admin only)
   */
  getStats: async () => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/admin/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.status === 403) {
        throw new Error('ACCESS_DENIED');
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error(response.data || 'Failed to get stats');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==================== STOCK MANAGEMENT APIs ====================

  /**
   * Get all managed stocks (Admin only)
   */
  getAllStocks: async () => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/admin/stocks`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.status === 403) {
        throw new Error('ACCESS_DENIED');
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error(response.data || 'Failed to get stocks');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get available stocks from vnstock (Admin only)
   */
  getAvailableStocks: async (exchange = null, search = null) => {
    try {
      let url = `${API_BASE_URL}/admin/stocks/available`;
      const params = new URLSearchParams();
      
      if (exchange) params.append('exchange', exchange);
      if (search) params.append('search', search);
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const res = await apiInterceptor.fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.status === 403) {
        throw new Error('ACCESS_DENIED');
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error(response.data || 'Failed to get available stocks');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add new stock (Admin only)
   */
  addStock: async (stockData) => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/admin/stocks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(stockData),
      });

      if (res.status === 403) {
        throw new Error('ACCESS_DENIED');
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error(response.data || 'Failed to add stock');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete stock (Admin only)
   */
  deleteStock: async (stockId) => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/admin/stocks/${stockId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.status === 403) {
        throw new Error('ACCESS_DENIED');
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error(response.data || 'Failed to delete stock');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get stocks statistics (Admin only)
   */
  getStocksStats: async () => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/admin/stocks/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.status === 403) {
        throw new Error('ACCESS_DENIED');
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const response = await res.json();
      
      if (response.code !== 0) {
        throw new Error(response.data || 'Failed to get stocks stats');
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default adminApi;
