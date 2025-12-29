import { useState, useEffect, useRef } from 'react';
import { stockApi } from '../services/api';
import './StockSearchModal.css';

const StockSearchModal = ({ isOpen, onClose, onSelectStock, currentStock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);

  // Load stocks from database when modal opens
  useEffect(() => {
    const loadStocks = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await stockApi.getAllStocks();
        setStocks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load stocks:', err);
        setError('Không thể tải danh sách cổ phiếu');
      } finally {
        setLoading(false);
      }
    };

    loadStocks();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Auto-focus search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
    
    // Reset search when modal opens
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleStockClick = (stockValue) => {
    onSelectStock(stockValue);
    onClose();
  };

  // Group stocks by market
  const groupedStocks = stocks.reduce((groups, stock) => {
    const market = stock.market || 'OTHER';
    if (!groups[market]) {
      groups[market] = [];
    }
    groups[market].push(stock);
    return groups;
  }, {});

  // Market display names
  const marketLabels = {
    'HOSE': '🇻🇳 HOSE (Ho Chi Minh Stock Exchange)',
    'HNX': '🇻🇳 HNX (Hanoi Stock Exchange)',
    'UPCOM': '🇻🇳 UPCOM (Unlisted Public Company Market)',
    'US': '🌍 International Stocks',
    'OTHER': '📊 Other'
  };

  // Filter stocks based on search query
  const filterStocks = (stocksList) => {
    if (!searchQuery.trim()) return stocksList;
    
    const query = searchQuery.toLowerCase();
    return stocksList.filter(stock => 
      stock.symbol?.toLowerCase().includes(query) || 
      stock.name?.toLowerCase().includes(query)
    );
  };

  if (!isOpen) return null;

  return (
    <div className="stock-search-modal-overlay" onClick={onClose}>
      <div className="stock-search-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="stock-search-modal-header">
          <h2>🔍 Search Stocks</h2>
          <button className="stock-search-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="stock-search-input-container">
          <input
            ref={searchInputRef}
            type="text"
            className="stock-search-input"
            placeholder="Search by symbol or company name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="stock-search-results">
          {loading ? (
            <div className="stock-loading">
              <div className="spinner"></div>
              <p>Đang tải danh sách cổ phiếu...</p>
            </div>
          ) : error ? (
            <div className="stock-error">
              <p>{error}</p>
            </div>
          ) : (
            <>
              {['HOSE', 'HNX', 'UPCOM', 'US', 'OTHER'].map((market) => {
                const marketStocks = groupedStocks[market] || [];
                const filteredOptions = filterStocks(marketStocks);
                
                if (filteredOptions.length === 0) return null;

                return (
                  <div key={market} className="stock-group">
                    <div className="stock-group-header">{marketLabels[market] || market}</div>
                    <div className="stock-options-list">
                      {filteredOptions.map((stock) => (
                        <button
                          key={stock.symbol}
                          className={`stock-option-item ${currentStock === stock.symbol ? 'selected' : ''}`}
                          onClick={() => handleStockClick(stock.symbol)}
                        >
                          <span className="stock-symbol">{stock.symbol}</span>
                          <span className="stock-name" title={stock.name || ''}>
                            {stock.name || `${stock.symbol} - ${stock.market || 'Unknown'}`}
                          </span>
                          {currentStock === stock.symbol && (
                            <span className="stock-check">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {Object.values(groupedStocks).every(group => filterStocks(group).length === 0) && (
                <div className="stock-no-results">
                  {stocks.length === 0 
                    ? 'Chưa có mã cổ phiếu nào. Admin cần thêm cổ phiếu trước.'
                    : `No stocks found matching "${searchQuery}"`}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockSearchModal;
