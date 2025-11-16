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
  const [patternType, setPatternType] = useState('reset');
  const [isLight, setIsLight] = useState(false);
  const [status, setStatus] = useState('Sẵn sàng.');

  // Apply theme to body
  useEffect(() => {
    document.body.classList.toggle('light', isLight);
  }, [isLight]);

  const handleLoadData = () => {
    // Trigger refresh by updating key values
    setPatternType('reset');
    setStatus('Đang tải dữ liệu...');
  };

  const handleToggleTheme = () => {
    setIsLight(!isLight);
  };

  return (
    <div className="App">
      <Header
        stockSymbol={stockSymbol}
        onStockChange={setStockSymbol}
        patternType={patternType}
        onPatternChange={setPatternType}
        onLoadData={handleLoadData}
        onToggleTheme={handleToggleTheme}
        isLight={isLight}
        status={status}
      />
      <main className="main-content">
        <div className="card layout">
          <StockChart
            stockSymbol={stockSymbol}
            patternType={patternType}
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
