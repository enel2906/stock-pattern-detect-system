/**
 * Notification API Service
 * Xử lý các request liên quan đến Pattern Notification
 */
import apiInterceptor from './apiInterceptor';
import { API_BASE_URL } from '../config/apiConfig';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const notificationApi = {
  /**
   * Tạo notification mới khi phát hiện mô hình
   * @param {Object} notificationData - { stockSymbol, patternName, patternDisplayName, sentiment, patternDate, closePrice }
   */
  createNotification: async (notificationData) => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(notificationData)
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized - Please login again');
        }
        throw new Error('Failed to create notification');
      }

      const response = await res.json();
      if (response.code !== 0) {
        throw new Error(response.message || 'Failed to create notification');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách notification của user
   * @param {number} page - Số trang (bắt đầu từ 0)
   * @param {number} size - Số lượng mỗi trang
   */
  getNotifications: async (page = 0, size = 50) => {
    try {
      const res = await apiInterceptor.fetch(
        `${API_BASE_URL}/notifications?page=${page}&size=${size}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          return []; // Chưa đăng nhập
        }
        throw new Error('Failed to fetch notifications');
      }

      const response = await res.json();
      if (response.code !== 0) {
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  /**
   * Lấy notification chưa đọc
   */
  getUnreadNotifications: async () => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/notifications/unread`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        if (res.status === 401) {
          return [];
        }
        throw new Error('Failed to fetch unread notifications');
      }

      const response = await res.json();
      return response.data || [];
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }
  },

  /**
   * Đếm số notification chưa đọc
   */
  getUnreadCount: async () => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/notifications/unread/count`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        if (res.status === 401) {
          return { count: 0 };
        }
        throw new Error('Failed to get unread count');
      }

      const response = await res.json();
      return response.data || { count: 0 };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { count: 0 };
    }
  },

  /**
   * Đánh dấu notification đã đọc
   * @param {string} notificationId - ID của notification
   */
  markAsRead: async (notificationId) => {
    try {
      const res = await apiInterceptor.fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: getAuthHeaders()
        }
      );

      if (!res.ok) {
        throw new Error('Failed to mark notification as read');
      }

      const response = await res.json();
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Đánh dấu tất cả notification đã đọc
   */
  markAllAsRead: async () => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        throw new Error('Failed to mark all as read');
      }

      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  /**
   * Xóa một notification
   * @param {string} notificationId - ID của notification
   */
  deleteNotification: async (notificationId) => {
    try {
      const res = await apiInterceptor.fetch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (!res.ok) {
        throw new Error('Failed to delete notification');
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Xóa tất cả notification
   */
  deleteAllNotifications: async () => {
    try {
      const res = await apiInterceptor.fetch(`${API_BASE_URL}/notifications/all`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        throw new Error('Failed to delete all notifications');
      }

      return true;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  },

  /**
   * Lấy notification theo mã cổ phiếu
   * @param {string} stockSymbol - Mã cổ phiếu (VD: ACB, VNM)
   */
  getNotificationsByStock: async (stockSymbol) => {
    try {
      const res = await apiInterceptor.fetch(
        `${API_BASE_URL}/notifications/stock/${stockSymbol}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      if (!res.ok) {
        return [];
      }

      const response = await res.json();
      return response.data || [];
    } catch (error) {
      console.error('Error fetching notifications by stock:', error);
      return [];
    }
  }
};

export default notificationApi;
