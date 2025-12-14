import { useState, useEffect } from 'react';
import { stockApi } from '../services/api';
import './NewsModal.css';

const NewsModal = ({ isOpen, onClose, stockSymbol }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && stockSymbol) {
      fetchNews();
    }
  }, [isOpen, stockSymbol]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await stockApi.getCompanyNews(stockSymbol, 20);
      
      if (data.error) {
        setError(data.error);
        setNews([]);
      } else {
        setNews(data.news || []);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Không thể tải tin tức. Vui lòng thử lại sau.');
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleNewsClick = (url) => {
    if (url && url !== 'null') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="news-modal-overlay" onClick={onClose}>
      <div className="news-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="news-modal-header">
          <div className="news-modal-title">
            <span className="news-icon">📰</span>
            <h2>Tin Tức - {stockSymbol}</h2>
          </div>
          <button className="news-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="news-modal-body">
          {loading && (
            <div className="news-loading">
              <div className="news-spinner"></div>
              <p>Đang tải tin tức...</p>
            </div>
          )}

          {error && (
            <div className="news-error">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button className="retry-btn" onClick={fetchNews}>
                🔄 Thử lại
              </button>
            </div>
          )}

          {!loading && !error && news.length === 0 && (
            <div className="news-empty">
              <span className="empty-icon">📭</span>
              <p>Không có tin tức cho {stockSymbol}</p>
            </div>
          )}

          {!loading && !error && news.length > 0 && (
            <div className="news-list">
              {news.map((item) => (
                <div
                  key={item.id}
                  className="news-item"
                  onClick={() => handleNewsClick(item.url)}
                >
                  {item.imageUrl && item.imageUrl !== 'null' && (
                    <div className="news-image-wrapper">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="news-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="news-content">
                    <h3 className="news-title">{item.title}</h3>
                    
                    {item.subTitle && item.subTitle !== 'null' && (
                      <p className="news-subtitle">{item.subTitle}</p>
                    )}
                    
                    {item.summary && item.summary !== 'null' && (
                      <p className="news-summary">
                        {stripHtml(item.summary).substring(0, 200)}
                        {stripHtml(item.summary).length > 200 ? '...' : ''}
                      </p>
                    )}
                    
                    <div className="news-meta">
                      <span className="news-date">
                        📅 {formatDate(item.publishTime)}
                      </span>
                      
                      {item.priceChange !== 0 && (
                        <span className={`news-price-change ${item.priceChange > 0 ? 'positive' : 'negative'}`}>
                          {item.priceChange > 0 ? '📈' : '📉'} {item.priceChange > 0 ? '+' : ''}
                          {item.priceChange.toFixed(2)}%
                        </span>
                      )}
                      
                      {item.url && item.url !== 'null' && (
                        <span className="news-link-icon">🔗 Xem chi tiết</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="news-modal-footer">
          <button className="news-close-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsModal;
