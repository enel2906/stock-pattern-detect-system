import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/notificationApi';
import './NotificationBell.css';

/**
 * NotificationBell Component
 * Hiển thị icon chuông thông báo với badge số lượng chưa đọc
 * Khi click sẽ hiển thị dropdown list các thông báo
 */
const NotificationBell = ({ onNotificationClick }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications từ server
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const [notifs, countData] = await Promise.all([
        notificationApi.getNotifications(0, 20),
        notificationApi.getUnreadCount()
      ]);
      setNotifications(notifs);
      setUnreadCount(countData.count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch notifications khi user đăng nhập
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Polling mỗi 30 giây để cập nhật notifications
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications]);

  // Listen for new pattern notifications (from realtime detection)
  useEffect(() => {
    const handleNewPatternNotification = (event) => {
      const notification = event.detail;
      // Add to the beginning of the list
      setNotifications(prev => [{
        id: `local-${Date.now()}`,
        ...notification,
        isRead: false,
        createdAt: new Date().toISOString()
      }, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener('new-pattern-notification', handleNewPatternNotification);
    return () => window.removeEventListener('new-pattern-notification', handleNewPatternNotification);
  }, []);

  // Close dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Refresh notifications khi mở dropdown
      fetchNotifications();
    }
  };

  // Đánh dấu notification đã đọc
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Xóa notification
  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(notificationId);
      const deletedNotif = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Click vào notification
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    setIsOpen(false);
  };

  // Format thời gian
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  // Get sentiment icon
  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish': return '🟢';
      case 'bearish': return '🔴';
      default: return '⚪';
    }
  };

  // Không hiển thị nếu chưa đăng nhập
  if (!user) return null;

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className={`notification-bell-btn ${unreadCount > 0 ? 'has-notifications' : ''}`}
        onClick={toggleDropdown}
        title="Thông báo"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Thông báo</h3>
            {notifications.length > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                title="Đánh dấu tất cả đã đọc"
              >
                ✓ Đọc tất cả
              </button>
            )}
          </div>

          <div className="notification-list">
            {isLoading ? (
              <div className="notification-loading">
                <span className="loading-spinner"></span>
                Đang tải...
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="empty-icon">📭</span>
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getSentimentIcon(notification.sentiment)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">
                      <span className="stock-symbol">{notification.stockSymbol}</span>
                      <span className="pattern-name">{notification.patternDisplayName}</span>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">{formatTime(notification.createdAt)}</span>
                  </div>
                  <button
                    className="notification-delete-btn"
                    onClick={(e) => handleDelete(notification.id, e)}
                    title="Xóa thông báo"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-btn"
                onClick={() => {
                  // Có thể navigate đến trang notifications đầy đủ
                  setIsOpen(false);
                }}
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Thêm function để add notification từ bên ngoài (dùng khi phát hiện pattern)
export const addLocalNotification = (notification) => {
  // Dispatch custom event để NotificationBell có thể listen
  window.dispatchEvent(new CustomEvent('new-pattern-notification', { detail: notification }));
};

export default NotificationBell;
