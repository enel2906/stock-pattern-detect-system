import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import StockChart from './components/StockChart';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import './App.css';

function MainApp() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stockSymbol, setStockSymbol] = useState('VIC');
  const [selectedPatterns, setSelectedPatterns] = useState([]);
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [isLight, setIsLight] = useState(false);
  const [status, setStatus] = useState('Sẵn sàng.');
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  // Apply theme to body
  useEffect(() => {
    document.body.classList.toggle('light', isLight);
  }, [isLight]);

  // Clear indicators and patterns when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear all selected indicators and patterns when logged out
      if (selectedPatterns.length > 0 || selectedIndicators.length > 0) {
        setSelectedPatterns([]);
        setSelectedIndicators([]);
        setStatus('Sẵn sàng.');
      }
    }
  }, [isAuthenticated]);

  const handleLoadData = () => {
    // Trigger refresh by clearing patterns and indicators, then reloading
    setSelectedPatterns([]);
    setSelectedIndicators([]);
    setStatus('Đang tải dữ liệu...');
  };

  const handleTogglePattern = (patternValue) => {
    // Check authentication for indicators/patterns
    if (!isAuthenticated) {
      setShowAuthWarning(true);
      setTimeout(() => setShowAuthWarning(false), 3000);
      return;
    }
    
    setSelectedPatterns(prev => {
      if (prev.includes(patternValue)) {
        // Remove pattern
        return prev.filter(p => p !== patternValue);
      } else {
        // Add pattern
        return [...prev, patternValue];
      }
    });
  };

  const handleToggleIndicator = (indicatorValue) => {
    // Check authentication for indicators/patterns
    if (!isAuthenticated) {
      setShowAuthWarning(true);
      setTimeout(() => setShowAuthWarning(false), 3000);
      return;
    }
    
    setSelectedIndicators(prev => {
      if (prev.includes(indicatorValue)) {
        // Remove indicator
        return prev.filter(i => i !== indicatorValue);
      } else {
        // Add indicator
        return [...prev, indicatorValue];
      }
    });
  };

  const handleApplyIndicators = (selections) => {
    // Check authentication for indicators/patterns
    if (!isAuthenticated && (selections.patterns.length > 0 || selections.indicators.length > 0)) {
      setShowAuthWarning(true);
      setTimeout(() => setShowAuthWarning(false), 3000);
      return;
    }
    
    setSelectedPatterns(selections.patterns);
    setSelectedIndicators(selections.indicators);
  };

  const handleToggleTheme = () => {
    setIsLight(!isLight);
  };

  return (
    <div className="App">
      <Header
        stockSymbol={stockSymbol}
        onStockChange={setStockSymbol}
        selectedPatterns={selectedPatterns}
        selectedIndicators={selectedIndicators}
        onTogglePattern={handleTogglePattern}
        onToggleIndicator={handleToggleIndicator}
        onApplyPatterns={handleApplyIndicators}
        onLoadData={handleLoadData}
        onToggleTheme={handleToggleTheme}
        isLight={isLight}
        status={status}
      />
      {showAuthWarning && (
        <div className="auth-warning">
          <span>⚠️ Vui lòng đăng nhập để sử dụng tính năng Indicators và Patterns</span>
          <button onClick={() => navigate('/login')}>Đăng nhập</button>
        </div>
      )}
      <main className="main-content">
        <div className="card layout">
          <StockChart
            stockSymbol={stockSymbol}
            selectedPatterns={selectedPatterns}
            selectedIndicators={selectedIndicators}
            onStatusChange={setStatus}
            isLight={isLight}
          />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/" element={<MainApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
