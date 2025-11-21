import React, { useState, useMemo } from 'react';
import { PATTERN_OPTIONS } from '../constants/patternOptions';
import { INDICATOR_OPTIONS } from '../constants/indicatorOptions';
import './IndicatorsModal.css';

const IndicatorsModal = ({ 
  isOpen, 
  onClose, 
  selectedPatterns, 
  onTogglePattern, 
  selectedIndicators,
  onToggleIndicator,
  onApply 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('patterns'); // 'patterns' or 'indicators'
  const [tempSelectedPatterns, setTempSelectedPatterns] = useState([]);
  const [tempSelectedIndicators, setTempSelectedIndicators] = useState([]);

  // Initialize temp selections when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedPatterns([...selectedPatterns]);
      setTempSelectedIndicators([...selectedIndicators]);
      setSearchTerm('');
    }
  }, [isOpen, selectedPatterns, selectedIndicators]);

  // Flatten all patterns for easier searching
  const allPatterns = useMemo(() => {
    return PATTERN_OPTIONS.flatMap(group => 
      group.options.map(option => ({
        ...option,
        groupName: group.group
      }))
    );
  }, []);

  // Flatten all indicators for easier searching
  const allIndicators = useMemo(() => {
    return INDICATOR_OPTIONS.flatMap(group => 
      group.options.map(option => ({
        ...option,
        groupName: group.group
      }))
    );
  }, []);

  // Filter patterns based on search term
  const filteredPatterns = useMemo(() => {
    if (!searchTerm.trim()) return allPatterns;
    
    const term = searchTerm.toLowerCase();
    return allPatterns.filter(pattern => 
      pattern.label.toLowerCase().includes(term) ||
      pattern.value.toLowerCase().includes(term)
    );
  }, [searchTerm, allPatterns]);

  // Filter indicators based on search term
  const filteredIndicators = useMemo(() => {
    if (!searchTerm.trim()) return allIndicators;
    
    const term = searchTerm.toLowerCase();
    return allIndicators.filter(indicator => 
      indicator.label.toLowerCase().includes(term) ||
      indicator.value.toLowerCase().includes(term)
    );
  }, [searchTerm, allIndicators]);

  // Group filtered patterns
  const groupedFilteredPatterns = useMemo(() => {
    const groups = {};
    filteredPatterns.forEach(pattern => {
      if (!groups[pattern.groupName]) {
        groups[pattern.groupName] = [];
      }
      groups[pattern.groupName].push(pattern);
    });
    return groups;
  }, [filteredPatterns]);

  // Group filtered indicators
  const groupedFilteredIndicators = useMemo(() => {
    const groups = {};
    filteredIndicators.forEach(indicator => {
      if (!groups[indicator.groupName]) {
        groups[indicator.groupName] = [];
      }
      groups[indicator.groupName].push(indicator);
    });
    return groups;
  }, [filteredIndicators]);

  const handleToggle = (patternValue) => {
    setTempSelectedPatterns(prev => {
      if (prev.includes(patternValue)) {
        return prev.filter(p => p !== patternValue);
      } else {
        return [...prev, patternValue];
      }
    });
  };

  const handleToggleIndicator = (indicatorValue) => {
    setTempSelectedIndicators(prev => {
      if (prev.includes(indicatorValue)) {
        return prev.filter(i => i !== indicatorValue);
      } else {
        return [...prev, indicatorValue];
      }
    });
  };

  const handleClearAll = () => {
    if (activeTab === 'patterns') {
      setTempSelectedPatterns([]);
    } else {
      setTempSelectedIndicators([]);
    }
  };

  const handleDone = () => {
    // Apply all changes at once when user clicks Done
    if (onApply) {
      onApply({
        patterns: tempSelectedPatterns,
        indicators: tempSelectedIndicators
      });
    }
    onClose();
  };

  const handleCancel = () => {
    // Discard changes and close
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="indicators-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>📊 Indicators</h2>
          <button className="close-button" onClick={handleCancel} title="Close">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'patterns' ? 'active' : ''}`}
            onClick={() => setActiveTab('patterns')}
          >
            🕯️ Candle Patterns
            {tempSelectedPatterns.length > 0 && (
              <span className="badge">{tempSelectedPatterns.length}</span>
            )}
          </button>
          <button 
            className={`tab-button ${activeTab === 'indicators' ? 'active' : ''}`}
            onClick={() => setActiveTab('indicators')}
          >
            📈 Technical Indicators
            {tempSelectedIndicators.length > 0 && (
              <span className="badge">{tempSelectedIndicators.length}</span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="modal-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search patterns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button 
              className="clear-search" 
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="modal-content">
          {activeTab === 'patterns' && (
            <>
              {/* Action Bar */}
              {tempSelectedPatterns.length > 0 && (
                <div className="action-bar">
                  <span className="selected-count">
                    {tempSelectedPatterns.length} pattern{tempSelectedPatterns.length > 1 ? 's' : ''} selected
                  </span>
                  <button className="clear-all-button" onClick={handleClearAll}>
                    Clear All
                  </button>
                </div>
              )}

              {/* Patterns List */}
              <div className="patterns-list">
                {Object.keys(groupedFilteredPatterns).length === 0 ? (
                  <div className="no-results">
                    <span className="no-results-icon">🔍</span>
                    <p>No patterns found matching "{searchTerm}"</p>
                  </div>
                ) : (
                  Object.entries(groupedFilteredPatterns).map(([groupName, patterns]) => (
                    <div key={groupName} className="pattern-group">
                      <div className="group-header">{groupName}</div>
                      <div className="group-items">
                        {patterns.map(pattern => (
                          <label 
                            key={pattern.value} 
                            className={`pattern-item ${tempSelectedPatterns.includes(pattern.value) ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={tempSelectedPatterns.includes(pattern.value)}
                              onChange={() => handleToggle(pattern.value)}
                            />
                            <span className="checkbox-custom"></span>
                            <span className="pattern-label">{pattern.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'indicators' && (
            <>
              {/* Action Bar */}
              {tempSelectedIndicators.length > 0 && (
                <div className="action-bar">
                  <span className="selected-count">
                    {tempSelectedIndicators.length} indicator{tempSelectedIndicators.length > 1 ? 's' : ''} selected
                  </span>
                  <button className="clear-all-button" onClick={handleClearAll}>
                    Clear All
                  </button>
                </div>
              )}

              {/* Indicators List */}
              <div className="patterns-list">
                {Object.keys(groupedFilteredIndicators).length === 0 ? (
                  <div className="no-results">
                    <span className="no-results-icon">�</span>
                    <p>No indicators found matching "{searchTerm}"</p>
                  </div>
                ) : (
                  Object.entries(groupedFilteredIndicators).map(([groupName, indicators]) => (
                    <div key={groupName} className="pattern-group">
                      <div className="group-header">{groupName}</div>
                      <div className="group-items">
                        {indicators.map(indicator => (
                          <label 
                            key={indicator.value} 
                            className={`pattern-item ${tempSelectedIndicators.includes(indicator.value) ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={tempSelectedIndicators.includes(indicator.value)}
                              onChange={() => handleToggleIndicator(indicator.value)}
                            />
                            <span className="checkbox-custom"></span>
                            <span className="pattern-label">{indicator.label}</span>
                            {indicator.requiresPane && (
                              <span className="indicator-badge">Separate Pane</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
          <button className="done-button" onClick={handleDone}>
            Apply & Scan
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndicatorsModal;
