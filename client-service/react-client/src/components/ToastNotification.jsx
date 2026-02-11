import React, { useState, useEffect, useCallback } from 'react';
import './ToastNotification.css';

/**
 * Toast Notification Component
 * Hiển thị toast popup khi phát hiện mô hình nến mới
 */
const ToastNotification = () => {
  const [toasts, setToasts] = useState([]);

  // Listen for new toast events
  useEffect(() => {
    const handleNewToast = (event) => {
      const notification = event.detail;
      const id = Date.now() + Math.random();
      
      setToasts(prev => [...prev, { ...notification, id }]);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };

    window.addEventListener('show-pattern-toast', handleNewToast);
    return () => window.removeEventListener('show-pattern-toast', handleNewToast);
  }, []);

  // Remove toast manually
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Get sentiment styling
  const getSentimentClass = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish': return 'toast-bullish';
      case 'bearish': return 'toast-bearish';
      default: return 'toast-neutral';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish': return '📈';
      case 'bearish': return '📉';
      default: return '📊';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`toast-notification ${getSentimentClass(toast.sentiment)}`}
        >
          <div className="toast-icon">{getSentimentIcon(toast.sentiment)}</div>
          <div className="toast-content">
            <div className="toast-title">
              <span className="toast-stock">{toast.stockSymbol}</span>
              <span className="toast-pattern">{toast.patternDisplayName}</span>
            </div>
            <p className="toast-message">{toast.message}</p>
            <span className="toast-time">{toast.patternDate}</span>
          </div>
          <button 
            className="toast-close"
            onClick={() => removeToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

/**
 * Show a toast notification
 * @param {Object} notification - { stockSymbol, patternName, patternDisplayName, sentiment, patternDate, closePrice, message }
 */
export const showPatternToast = (notification) => {
  window.dispatchEvent(new CustomEvent('show-pattern-toast', { detail: notification }));
};

export default ToastNotification;
