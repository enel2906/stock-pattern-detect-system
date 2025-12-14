import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import IndicatorsModal from './IndicatorsModal';
import StockSearchModal from './StockSearchModal';
import './Header.css';

const Header = ({ 
  stockSymbol, 
  onStockChange, 
  selectedPatterns,
  selectedIndicators,
  onTogglePattern,
  onToggleIndicator,
  onApplyPatterns,
  onLoadData, 
  onToggleTheme, 
  isLight, 
  status,
  onShowNews,
  onShowFinancial
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [isStockSearchModalOpen, setIsStockSearchModalOpen] = useState(false);

  const isWatchlistPage = location.pathname === '/watchlist';
  const isAboutPage = location.pathname === '/about';

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="header-logo-icon">📡</div>
            <div className="header-brand-name">SignalScope</div>
          </div>
          
          <button 
            className={`about-link ${isAboutPage ? 'active' : ''}`}
            onClick={() => navigate('/about')}
            title="About Us"
          >
            <span className="icon">ℹ️</span>
            <span className="label">About Us</span>
          </button>
          
          {!isWatchlistPage && !isAboutPage && <div className="status">{status}</div>}
        </div>
        
        <div className="controls">
          <button 
            className={`nav-button ${isWatchlistPage ? 'active' : ''}`}
            onClick={() => navigate('/watchlist')}
            title="Real-time Price Board"
          >
            <span className="icon">⚡</span>
            <span className="label">Price Board</span>
          </button>
          
          {!isWatchlistPage && !isAboutPage && (
            <>
              <button 
                className="stock-selector-button" 
                onClick={() => setIsStockSearchModalOpen(true)}
                title="Search Stocks"
              >
                <span className="icon">🔍</span>
                <span className="stock-symbol">{stockSymbol}</span>
              </button>
              
              <button 
                className="news-button" 
                onClick={onShowNews}
                title="Company News"
              >
                <span className="icon">📰</span>
                <span className="label">Tin tức</span>
              </button>
              
              <button 
                className="financial-button" 
                onClick={onShowFinancial}
                title="Financial Report"
              >
                <span className="icon">📈</span>
                <span className="label">BCTC</span>
              </button>
              
              <button 
                className="indicators-button" 
                onClick={() => setIsIndicatorsModalOpen(true)}
                title="Open Indicators"
              >
                <span className="icon">ƒₓ</span>
                <span className="label">Indicators</span>
                {(selectedPatterns.length + selectedIndicators.length) > 0 && (
                  <span className="badge">{selectedPatterns.length + selectedIndicators.length}</span>
                )}
              </button>
            </>
          )}
          
          {/* <button className="primary" onClick={onLoadData}>
            Tải dữ liệu
          </button> */}
          
          <button 
            id="toggle-theme" 
            title="Chuyển chế độ" 
            onClick={onToggleTheme}
          >
            {isLight ? '☀️' : '🌙'}
          </button>

          {user ? (
            <div className="user-menu">
              <div className="user-info">
                <span className="user-name">{user.fullName || user.username}</span>
              </div>
              <button className="logout-button" onClick={logout} title="Đăng xuất">
                🚦
              </button>
            </div>
          ) : (
            <button 
              className="login-button" 
              onClick={() => window.location.href = '/login'}
              title="Đăng nhập"
            >
              🔑 Đăng nhập
            </button>
          )}
        </div>
      </header>

      <StockSearchModal
        isOpen={isStockSearchModalOpen}
        onClose={() => setIsStockSearchModalOpen(false)}
        onSelectStock={onStockChange}
        currentStock={stockSymbol}
      />

      <IndicatorsModal
        isOpen={isIndicatorsModalOpen}
        onClose={() => setIsIndicatorsModalOpen(false)}
        selectedPatterns={selectedPatterns}
        selectedIndicators={selectedIndicators}
        onTogglePattern={onTogglePattern}
        onToggleIndicator={onToggleIndicator}
        onApply={onApplyPatterns}
      />
    </>
  );
};

export default Header;
