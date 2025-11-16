import React from 'react';
import { STOCK_OPTIONS } from '../constants/stockOptions';
import { PATTERN_OPTIONS } from '../constants/patternOptions';
import './Header.css';

const Header = ({ 
  stockSymbol, 
  onStockChange, 
  patternType, 
  onPatternChange, 
  onLoadData, 
  onToggleTheme, 
  isLight, 
  status 
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand">
          <div className="dot"></div>
          <div>Stock Pattern Detection - ChungKhoanNT.com</div>
        </div>
        <div className="status">{status}</div>
      </div>
      
      <div className="controls">
        <div className="control-row">
          <label htmlFor="stockSelector">Mã CP</label>
          <select 
            id="stockSelector" 
            value={stockSymbol} 
            onChange={(e) => onStockChange(e.target.value)}
          >
            {STOCK_OPTIONS.map((group, idx) => (
              <optgroup key={idx} label={group.group}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        
        <div className="control-row">
          <label htmlFor="patternSelector">Mô hình</label>
          <select 
            id="patternSelector" 
            value={patternType} 
            onChange={(e) => onPatternChange(e.target.value)}
          >
            <option value="reset">🔄 Default / Reset All Patterns</option>
            {PATTERN_OPTIONS.map((group, idx) => (
              <optgroup key={idx} label={group.group}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        
        <button className="primary" onClick={onLoadData}>
          Tải dữ liệu
        </button>
        
        <button 
          id="toggle-theme" 
          title="Chuyển chế độ" 
          onClick={onToggleTheme}
        >
          {isLight ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
};

export default Header;
