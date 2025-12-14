import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import StockChart from './components/StockChart';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import WatchlistPage from './pages/WatchlistPage';
import AboutPage from './pages/AboutPage';
import NewsModal from './components/NewsModal';
import FinancialReportModal from './components/FinancialReportModal';
import './App.css';

function MainApp() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL param or localStorage or defaults
  const [stockSymbol, setStockSymbol] = useState(() => {
    const urlSymbol = searchParams.get('symbol');
    if (urlSymbol) {
      return urlSymbol.toUpperCase();
    }
    return localStorage.getItem('stockSymbol') || 'VIC';
  });
  const [selectedPatterns, setSelectedPatterns] = useState(() => {
    const saved = localStorage.getItem('selectedPatterns');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedIndicators, setSelectedIndicators] = useState(() => {
    const saved = localStorage.getItem('selectedIndicators');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLight, setIsLight] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light';
  });
  const [status, setStatus] = useState('Sẵn sàng.');
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);

  // Listen to URL parameter changes and update stockSymbol
  useEffect(() => {
    const urlSymbol = searchParams.get('symbol');
    if (urlSymbol) {
      const upperSymbol = urlSymbol.toUpperCase();
      if (upperSymbol !== stockSymbol) {
        setStockSymbol(upperSymbol);
      }
    }
  }, [searchParams]);

  // Save stockSymbol to localStorage and update URL
  useEffect(() => {
    localStorage.setItem('stockSymbol', stockSymbol);
    // Update URL with current symbol
    const currentSymbol = searchParams.get('symbol');
    if (currentSymbol !== stockSymbol) {
      setSearchParams({ symbol: stockSymbol }, { replace: true });
    }
  }, [stockSymbol]);

  // Save selectedPatterns to localStorage
  useEffect(() => {
    localStorage.setItem('selectedPatterns', JSON.stringify(selectedPatterns));
  }, [selectedPatterns]);

  // Save selectedIndicators to localStorage
  useEffect(() => {
    localStorage.setItem('selectedIndicators', JSON.stringify(selectedIndicators));
  }, [selectedIndicators]);

  // Apply theme to body and save to localStorage
  useEffect(() => {
    document.body.classList.toggle('light', isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }, [isLight]);

  // Track previous auth state to detect logout events (but not initial load)
  const prevAuthStateRef = useRef(null);
  
  useEffect(() => {
    // On first mount, just record the auth state
    if (prevAuthStateRef.current === null) {
      prevAuthStateRef.current = isAuthenticated;
      return;
    }

    // Only clear when user actively logs out (transition from true to false)
    if (prevAuthStateRef.current === true && isAuthenticated === false) {
      // Clear all selected indicators and patterns when logged out
      if (selectedPatterns.length > 0 || selectedIndicators.length > 0) {
        setSelectedPatterns([]);
        setSelectedIndicators([]);
        setStatus('Sẵn sàng.');
        // Also clear from localStorage
        localStorage.removeItem('selectedPatterns');
        localStorage.removeItem('selectedIndicators');
      }
    }
    
    // Update previous auth state
    prevAuthStateRef.current = isAuthenticated;
  }, [isAuthenticated, selectedPatterns.length, selectedIndicators.length]);

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
        onShowNews={() => setShowNewsModal(true)}
        onShowFinancial={() => setShowFinancialModal(true)}
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

      {/* News Modal */}
      <NewsModal
        isOpen={showNewsModal}
        onClose={() => setShowNewsModal(false)}
        stockSymbol={stockSymbol}
      />

      {/* Financial Report Modal */}
      <FinancialReportModal
        isOpen={showFinancialModal}
        onClose={() => setShowFinancialModal(false)}
        stockSymbol={stockSymbol}
      />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/watchlist" element={<WatchlistPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/" element={<MainApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
