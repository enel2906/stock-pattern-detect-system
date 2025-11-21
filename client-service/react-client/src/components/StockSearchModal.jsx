import { useState, useEffect, useRef } from 'react';
import { STOCK_OPTIONS } from '../constants/stockOptions';
import './StockSearchModal.css';

const StockSearchModal = ({ isOpen, onClose, onSelectStock, currentStock }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

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

  // Filter stocks based on search query
  const filterStocks = (options) => {
    if (!searchQuery.trim()) return options;
    
    const query = searchQuery.toLowerCase();
    return options.filter(stock => 
      stock.value.toLowerCase().includes(query) || 
      stock.label.toLowerCase().includes(query)
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
          {STOCK_OPTIONS.map((group, groupIndex) => {
            const filteredOptions = filterStocks(group.options);
            
            if (filteredOptions.length === 0) return null;

            return (
              <div key={groupIndex} className="stock-group">
                <div className="stock-group-header">{group.group}</div>
                <div className="stock-options-list">
                  {filteredOptions.map((stock) => (
                    <button
                      key={stock.value}
                      className={`stock-option-item ${currentStock === stock.value ? 'selected' : ''}`}
                      onClick={() => handleStockClick(stock.value)}
                    >
                      <span className="stock-symbol">{stock.value}</span>
                      <span className="stock-name">{stock.label.split(' - ')[1]}</span>
                      {currentStock === stock.value && (
                        <span className="stock-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          
          {STOCK_OPTIONS.every(group => filterStocks(group.options).length === 0) && (
            <div className="stock-no-results">
              No stocks found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockSearchModal;
