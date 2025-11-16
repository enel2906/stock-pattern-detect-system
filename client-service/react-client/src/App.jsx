import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StockChart from './components/StockChart';
import './App.css';

function App() {
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

export default App;
