import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPriceBoard } from '../services/watchlistApi';
import './WatchlistPage.css';

const WatchlistPage = () => {
  const navigate = useNavigate();
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch price board data
  const fetchPriceBoard = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      const response = await getPriceBoard();
      
      if (response && response.data) {
        setPriceData(response.data);
        setLastUpdate(new Date(response.timestamp));
      }
    } catch (err) {
      console.error('Error fetching price board:', err);
      setError('Không thể tải dữ liệu bảng giá. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPriceBoard();
  }, [fetchPriceBoard]);

  // Auto refresh every 2 seconds (real-time price board)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchPriceBoard();
    }, 3000); // 2 seconds for real-time updates

    return () => clearInterval(interval);
  }, [autoRefresh, fetchPriceBoard]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchPriceBoard();
  };

  // Handle stock click - navigate to chart
  const handleStockClick = (symbol) => {
    navigate(`/?symbol=${symbol}`);
  };

  // Format number with thousands separator
  const formatNumber = (num) => {
    if (!num || num === 0) return '-';
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // Format price
  const formatPrice = (price) => {
    if (!price || price === 0) return '-';
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Get price color class
  const getPriceColorClass = (matchPrice, refPrice) => {
    if (!matchPrice || !refPrice) return 'price-ref';
    if (matchPrice > refPrice) return 'price-up';
    if (matchPrice < refPrice) return 'price-down';
    return 'price-ref';
  };

  // Get change color class
  const getChangeColorClass = (change) => {
    if (change > 0) return 'change-up';
    if (change < 0) return 'change-down';
    return 'change-ref';
  };

  // Format time
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading && priceData.length === 0) {
    return (
      <div className="watchlist-page">
        <div className="loading-overlay">
          <div>⏳ Đang tải dữ liệu bảng giá...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <div className="watchlist-header">
        <h1 className="watchlist-title">⚡ Price Board</h1>
        
        <button 
          className="header-chart-button"
          onClick={() => handleStockClick('VCB')}
          title="Xem biểu đồ VCB"
        >
          <span>📊</span>
          <span>Chart</span>
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="watchlist-table-container">
        {priceData.length === 0 ? (
          <div className="empty-state">
            <h3>Không có dữ liệu</h3>
            <p>Vui lòng thử lại sau</p>
          </div>
        ) : (
          <table className="watchlist-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Giá TC</th>
                <th>Giá</th>
                <th>+/-</th>
                <th>%</th>
                <th>Trần</th>
                <th>Sàn</th>
                <th>Mở</th>
                <th>Cao</th>
                <th>Thấp</th>
                <th>TB</th>
                <th>KL</th>
                <th>Mua 1</th>
                <th>Bán 1</th>
              </tr>
            </thead>
            <tbody>
              {priceData.map((stock) => (
                <tr key={stock.symbol}>
                  <td 
                    className="symbol-cell clickable"
                    onClick={() => handleStockClick(stock.symbol)}
                    title={`Xem biểu đồ ${stock.symbol}`}
                  >
                    {stock.symbol}
                  </td>
                  <td className="price-ref">
                    {formatPrice(stock.refPrice)}
                  </td>
                  <td className={`price-cell ${getPriceColorClass(stock.matchPrice, stock.refPrice)}`}>
                    {formatPrice(stock.matchPrice)}
                  </td>
                  <td className={`change-cell ${getChangeColorClass(stock.change)}`}>
                    <span>{stock.change > 0 ? '+' : ''}{formatPrice(stock.change)}</span>
                  </td>
                  <td className={getChangeColorClass(stock.change)}>
                    {stock.changePercent > 0 ? '+' : ''}{stock.changePercent}%
                  </td>
                  <td className="price-up">
                    {formatPrice(stock.ceilingPrice)}
                  </td>
                  <td className="price-down">
                    {formatPrice(stock.floorPrice)}
                  </td>
                  <td>
                    {formatPrice(stock.openPrice)}
                  </td>
                  <td className="high-value">
                    {formatPrice(stock.highest)}
                  </td>
                  <td className="low-value">
                    {formatPrice(stock.lowest)}
                  </td>
                  <td>
                    {formatPrice(stock.avgPrice)}
                  </td>
                  <td className="volume-cell">
                    {formatNumber(stock.matchVolume)}
                  </td>
                  <td>
                    <div className="bid-ask-cell">
                      <div className="bid-row">
                        <span className="bid-price">{formatPrice(stock.bid1Price)}</span>
                        <span className="bid-volume">({formatNumber(stock.bid1Volume)})</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="bid-ask-cell">
                      <div className="ask-row">
                        <span className="ask-price">{formatPrice(stock.ask1Price)}</span>
                        <span className="ask-volume">({formatNumber(stock.ask1Volume)})</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;
