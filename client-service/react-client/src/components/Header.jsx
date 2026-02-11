import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import IndicatorsModal from './IndicatorsModal';
import StockSearchModal from './StockSearchModal';
import AdvanceSignalModal from './AdvanceSignalModal';
import NotificationBell from './NotificationBell';
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
  onShowFinancial,
  // Advance Signal props
  candleData,
  activeComboSignals,
  onToggleComboSignal,
  onRunBacktest,
  backtestResults,
  onApplyBacktestMarkers
}) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [isStockSearchModalOpen, setIsStockSearchModalOpen] = useState(false);
  const [isAdvanceSignalModalOpen, setIsAdvanceSignalModalOpen] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  const handleAdvanceSignalClick = () => {
    if (!user) {
      setShowAuthWarning(true);
    } else {
      setIsAdvanceSignalModalOpen(true);
    }
  };

  const isWatchlistPage = location.pathname === '/watchlist';
  const isAboutPage = location.pathname === '/about';

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <div className="brand" onClick={() => navigate('/about')} style={{ cursor: 'pointer' }} title="About Us">
            <div className="header-brand-name">SignalScope</div>
          </div>
          
          {!isWatchlistPage && !isAboutPage && <div className="status">{status}</div>}
        </div>
        
        <div className="controls">
          <button 
            className={`nav-button ${isWatchlistPage ? 'active' : ''}`}
            onClick={() => navigate('/watchlist')}
            title="Real-time Price Board"
          >
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
                <span className="label">Tin tức</span>
              </button>
              
              <button 
                className="financial-button" 
                onClick={onShowFinancial}
                title="Financial Report"
              >
                <span className="label">Hồ Sơ</span>
              </button>
              
              <button 
                className="indicators-button" 
                onClick={() => setIsIndicatorsModalOpen(true)}
                title="Open Indicators"
              >
                <span className="label">Indicators</span>
                {(selectedPatterns.length + selectedIndicators.length) > 0 && (
                  <span className="badge">{selectedPatterns.length + selectedIndicators.length}</span>
                )}
              </button>
              
              <button 
                className="advance-signal-button" 
                onClick={handleAdvanceSignalClick}
                title="Advance Signal - Combo Patterns + Indicators"
              >
                <span className="label">Advance Signal</span>
                {activeComboSignals?.length > 0 && (
                  <span className="badge active-signal">{activeComboSignals.length}</span>
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

          {/* Notification Bell - chỉ hiển thị khi đã đăng nhập */}
          <NotificationBell 
            onNotificationClick={(notification) => {
              // Navigate to chart with the stock symbol if clicked
              if (notification.stockSymbol && onStockChange) {
                onStockChange(notification.stockSymbol);
              }
            }}
          />

          {user ? (
            <div className="user-menu">
              <div className="user-info">
                <span className="user-name">{user.fullName || user.username}</span>
              </div>
              {isAdmin && (
                <button 
                  className="admin-button" 
                  onClick={() => navigate('/admin')}
                  title="Quản trị"
                >
                  🛡️
                </button>
              )}
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
              Đăng nhập
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

      <AdvanceSignalModal
        isOpen={isAdvanceSignalModalOpen}
        onClose={() => setIsAdvanceSignalModalOpen(false)}
        stockSymbol={stockSymbol}
        candleData={candleData}
        activeComboSignals={activeComboSignals}
        onToggleComboSignal={onToggleComboSignal}
        onRunBacktest={onRunBacktest}
        backtestResults={backtestResults}
        onApplyBacktestMarkers={onApplyBacktestMarkers}
      />

      {/* Auth Warning Modal */}
      {showAuthWarning && (
        <div className="modal-overlay" onClick={() => setShowAuthWarning(false)}>
          <div className="auth-warning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-warning-header">
              <h3>Yêu cầu đăng nhập</h3>
              <button className="close-button" onClick={() => setShowAuthWarning(false)}>✕</button>
            </div>
            <div className="auth-warning-content">
              <p>Bạn cần đăng nhập để sử dụng tính năng <strong>Advance Signal</strong>.</p>
              <p>Tính năng này cho phép bạn theo dõi các tín hiệu kết hợp real-time và backtest chiến lược giao dịch.</p>
            </div>
            <div className="auth-warning-footer">
              <button className="cancel-btn" onClick={() => setShowAuthWarning(false)}>Đóng</button>
              <button className="login-btn" onClick={() => { setShowAuthWarning(false); navigate('/login'); }}>Đăng nhập</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
