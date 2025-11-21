import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import StockChart from './components/StockChart';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

function MainApp() {
  const [stockSymbol, setStockSymbol] = useState('VIC');
  const [selectedPatterns, setSelectedPatterns] = useState([]);
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [isLight, setIsLight] = useState(false);
  const [status, setStatus] = useState('Sẵn sàng.');

  // Apply theme to body
  useEffect(() => {
    document.body.classList.toggle('light', isLight);
  }, [isLight]);

  const handleLoadData = () => {
    // Trigger refresh by clearing patterns and indicators, then reloading
    setSelectedPatterns([]);
    setSelectedIndicators([]);
    setStatus('Đang tải dữ liệu...');
  };

  const handleTogglePattern = (patternValue) => {
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
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
