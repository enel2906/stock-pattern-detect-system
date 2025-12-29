import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getPriceBoard } from '../services/watchlistApi';
import './WatchlistPage.css';

// WebSocket server URL (alert-service)
const WS_URL = 'http://localhost:60/ws';

const WatchlistPage = () => {
  const navigate = useNavigate();
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Đang kết nối...');
  const stompClientRef = useRef(null);

  // Connect to WebSocket and subscribe to price board updates
  const connectWebSocket = useCallback(() => {
    try {
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        debug: (str) => {
          console.log('Price Board STOMP Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = () => {
        console.log('Price Board WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('Đã kết nối');
        setError(null);

        // Subscribe to price board topic
        client.subscribe('/topic/price-board', (message) => {
          try {
            const priceBoardDTO = JSON.parse(message.body);
            if (priceBoardDTO && priceBoardDTO.data) {
              setPriceData(priceBoardDTO.data);
              setLastUpdate(new Date(priceBoardDTO.timestamp));
              setLoading(false);
            }
          } catch (err) {
            console.error('Error parsing price board message:', err);
          }
        });
      };

      client.onStompError = (frame) => {
        console.error('Price Board STOMP error:', frame);
        setIsConnected(false);
        setConnectionStatus('Lỗi kết nối');
        setError('Lỗi kết nối STOMP. Đang thử kết nối lại...');
      };

      client.onWebSocketError = (event) => {
        console.error('Price Board WebSocket error:', event);
        setIsConnected(false);
        setConnectionStatus('Lỗi WebSocket');
      };

      client.onDisconnect = () => {
        console.log('Price Board WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('Đã ngắt kết nối');
      };

      client.activate();
      stompClientRef.current = client;
    } catch (err) {
      console.error('Error creating WebSocket client:', err);
      setError('Không thể kết nối WebSocket. Chuyển sang chế độ polling...');
      // Fallback to polling if WebSocket fails
      fetchPriceBoardFallback();
    }
  }, []);

  // Fallback: Fetch price board via API (used when WebSocket not available)
  const fetchPriceBoardFallback = useCallback(async () => {
    try {
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
    }
  }, []);

  // Initial load - fetch data first, then connect WebSocket
  useEffect(() => {
    // Fetch initial data via API
    fetchPriceBoardFallback();
    
    // Then connect to WebSocket for real-time updates
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [connectWebSocket, fetchPriceBoardFallback]);

  // Handle manual refresh (fallback fetch)
  const handleRefresh = () => {
    fetchPriceBoardFallback();
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
        
        <div className="header-status">
          <span 
            className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
            title={connectionStatus}
          >
            {isConnected ? '🟢' : '🔴'} {connectionStatus}
          </span>
          {lastUpdate && (
            <span className="last-update">
              Cập nhật: {formatTime(lastUpdate)}
            </span>
          )}
          <button 
            className="refresh-button"
            onClick={handleRefresh}
            title="Làm mới dữ liệu"
          >
            🔄
          </button>
        </div>
        
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
