import React, { useState, useEffect, useMemo } from 'react';
import { getAllComboSignals, getComboSignal } from '../constants/comboSignalDefinitions';
import { runBacktest } from '../services/advanceSignalService';
import './AdvanceSignalModal.css';

const AdvanceSignalModal = ({
  isOpen,
  onClose,
  stockSymbol,
  candleData,
  activeComboSignals,
  onToggleComboSignal,
  onRunBacktest,
  backtestResults,
  onApplyBacktestMarkers
}) => {
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' or 'backtest'
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [lookbackMonths, setLookbackMonths] = useState(3);
  const [isRunningBacktest, setIsRunningBacktest] = useState(false);
  const [currentBacktestResult, setCurrentBacktestResult] = useState(null);

  const allCombos = useMemo(() => getAllComboSignals(), []);
  
  const bullishCombos = useMemo(() => 
    allCombos.filter(c => c.sentiment === 'bullish'), [allCombos]);
  
  const bearishCombos = useMemo(() => 
    allCombos.filter(c => c.sentiment === 'bearish'), [allCombos]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentBacktestResult(null);
      setSelectedCombo(null);
    }
  }, [isOpen]);

  const handleToggleCombo = (comboId) => {
    if (onToggleComboSignal) {
      onToggleComboSignal(comboId);
    }
  };

  const handleRunBacktest = async () => {
    if (!selectedCombo || !candleData || candleData.length === 0) {
      return;
    }

    setIsRunningBacktest(true);
    
    try {
      const result = runBacktest(selectedCombo, candleData, lookbackMonths);
      setCurrentBacktestResult(result);
      
      if (onRunBacktest) {
        onRunBacktest(result);
      }
    } catch (error) {
      console.error('Backtest error:', error);
      setCurrentBacktestResult({ error: error.message });
    } finally {
      setIsRunningBacktest(false);
    }
  };

  const handleApplyToChart = () => {
    if (currentBacktestResult && onApplyBacktestMarkers) {
      onApplyBacktestMarkers(currentBacktestResult);
      onClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'success': return '✓';
      case 'failure': return '✗';
      default: return '○';
    }
  };

  const getResultClass = (result) => {
    switch (result) {
      case 'success': return 'result-success';
      case 'failure': return 'result-failure';
      default: return 'result-neutral';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="advance-signal-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>🎯 Advance Signal</h2>
          <span className="stock-badge">{stockSymbol}</span>
          <button className="close-button" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
          >
            ⚡ Real-time Monitor
            {activeComboSignals?.length > 0 && (
              <span className="badge">{activeComboSignals.length}</span>
            )}
          </button>
          <button
            className={`tab-button ${activeTab === 'backtest' ? 'active' : ''}`}
            onClick={() => setActiveTab('backtest')}
          >
            🧪 Backtest Strategy
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {activeTab === 'monitor' && (
            <div className="monitor-tab">
              <p className="tab-description">
                Kích hoạt các combo tín hiệu để theo dõi real-time. Khi điều kiện được thỏa mãn, 
                hệ thống sẽ hiển thị cảnh báo và đánh dấu trên biểu đồ.
              </p>

              {/* Bullish Combos */}
              <div className="combo-section">
                <h3 className="section-title bullish">📈 Tín hiệu Tăng (Bullish)</h3>
                <div className="combo-list">
                  {bullishCombos.map(combo => (
                    <div 
                      key={combo.id} 
                      className={`combo-item ${activeComboSignals?.includes(combo.id) ? 'active' : ''}`}
                      onClick={() => handleToggleCombo(combo.id)}
                    >
                      <div className="combo-icon">{combo.icon}</div>
                      <div className="combo-info">
                        <div className="combo-name">{combo.name}</div>
                        <div className="combo-desc">{combo.description}</div>
                        <div className="combo-meta">
                          <span className={`reliability ${combo.reliability}`}>
                            {combo.reliability === 'very_high' ? '⭐⭐⭐' : 
                             combo.reliability === 'high' ? '⭐⭐' : '⭐'}
                          </span>
                          <span className="target">
                            Target: +{combo.prediction.targetGain}% / {combo.prediction.timeframe} phiên
                          </span>
                        </div>
                      </div>
                      <div className="combo-toggle">
                        <span className={`toggle ${activeComboSignals?.includes(combo.id) ? 'on' : 'off'}`}>
                          {activeComboSignals?.includes(combo.id) ? '✓ ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bearish Combos */}
              <div className="combo-section">
                <h3 className="section-title bearish">📉 Tín hiệu Giảm (Bearish)</h3>
                <div className="combo-list">
                  {bearishCombos.map(combo => (
                    <div 
                      key={combo.id} 
                      className={`combo-item ${activeComboSignals?.includes(combo.id) ? 'active' : ''}`}
                      onClick={() => handleToggleCombo(combo.id)}
                    >
                      <div className="combo-icon">{combo.icon}</div>
                      <div className="combo-info">
                        <div className="combo-name">{combo.name}</div>
                        <div className="combo-desc">{combo.description}</div>
                        <div className="combo-meta">
                          <span className={`reliability ${combo.reliability}`}>
                            {combo.reliability === 'very_high' ? '⭐⭐⭐' : 
                             combo.reliability === 'high' ? '⭐⭐' : '⭐'}
                          </span>
                          <span className="target">
                            Target: -{combo.prediction.targetGain}% / {combo.prediction.timeframe} phiên
                          </span>
                        </div>
                      </div>
                      <div className="combo-toggle">
                        <span className={`toggle ${activeComboSignals?.includes(combo.id) ? 'on' : 'off'}`}>
                          {activeComboSignals?.includes(combo.id) ? '✓ ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backtest' && (
            <div className="backtest-tab">
              <p className="tab-description">
                Đánh giá hiệu quả của một combo rule với dữ liệu lịch sử của {stockSymbol}.
              </p>

              {/* Backtest Settings */}
              <div className="backtest-settings">
                <div className="setting-group">
                  <label>Chọn Combo:</label>
                  <select 
                    value={selectedCombo || ''} 
                    onChange={(e) => setSelectedCombo(e.target.value)}
                    className="combo-select"
                  >
                    <option value="">-- Chọn combo tín hiệu --</option>
                    <optgroup label="📈 Bullish">
                      {bullishCombos.map(combo => (
                        <option key={combo.id} value={combo.id}>
                          {combo.icon} {combo.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="📉 Bearish">
                      {bearishCombos.map(combo => (
                        <option key={combo.id} value={combo.id}>
                          {combo.icon} {combo.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="setting-group">
                  <label>Khoảng thời gian:</label>
                  <select 
                    value={lookbackMonths} 
                    onChange={(e) => setLookbackMonths(Number(e.target.value))}
                    className="lookback-select"
                  >
                    <option value={1}>1 tháng</option>
                    <option value={3}>3 tháng</option>
                    <option value={6}>6 tháng</option>
                    <option value={12}>12 tháng</option>
                  </select>
                </div>

                <button 
                  className="run-backtest-btn"
                  onClick={handleRunBacktest}
                  disabled={!selectedCombo || isRunningBacktest || !candleData?.length}
                >
                  {isRunningBacktest ? '⏳ Đang phân tích...' : '🚀 Chạy Backtest'}
                </button>
              </div>

              {/* Selected Combo Info */}
              {selectedCombo && (
                <div className="selected-combo-info">
                  {(() => {
                    const combo = getComboSignal(selectedCombo);
                    return combo ? (
                      <>
                        <div className="combo-header">
                          <span className="combo-icon-large">{combo.icon}</span>
                          <div>
                            <h4>{combo.name}</h4>
                            <p>{combo.description}</p>
                          </div>
                        </div>
                        <div className="combo-rules">
                          <div className="rule">
                            <span className="rule-label">Pattern:</span>
                            <span className="rule-value">{combo.pattern.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="rule">
                            <span className="rule-label">Indicator:</span>
                            <span className="rule-value">
                              RSI({combo.indicator.period}) {combo.indicator.condition === 'lessThan' ? '<' : '>'} {combo.indicator.threshold}
                            </span>
                          </div>
                          <div className="rule">
                            <span className="rule-label">Dự báo:</span>
                            <span className="rule-value">
                              {combo.prediction.direction === 'bullish' ? 'Tăng' : 'Giảm'} trong {combo.prediction.timeframe} phiên
                            </span>
                          </div>
                          <div className="rule">
                            <span className="rule-label">Đánh giá:</span>
                            <span className="rule-value">
                              ✓ ĐÚNG nếu đạt {combo.prediction.direction === 'bullish' ? '+' : '-'}{combo.prediction.targetGain}% | 
                              ✗ SAI nếu chạm {combo.prediction.direction === 'bullish' ? '-' : '+'}{combo.prediction.stopLoss}%
                            </span>
                          </div>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Backtest Results */}
              {currentBacktestResult && !currentBacktestResult.error && (
                <div className="backtest-results">
                  <h3>📊 Kết quả Backtest</h3>
                  
                  {/* Statistics */}
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">{currentBacktestResult.totalSignals}</div>
                      <div className="stat-label">Tổng tín hiệu</div>
                    </div>
                    <div className="stat-card success">
                      <div className="stat-value">{currentBacktestResult.successCount}</div>
                      <div className="stat-label">Đúng ({currentBacktestResult.successRate}%)</div>
                    </div>
                    <div className="stat-card failure">
                      <div className="stat-value">{currentBacktestResult.failureCount}</div>
                      <div className="stat-label">Sai ({currentBacktestResult.failureRate}%)</div>
                    </div>
                    <div className="stat-card neutral">
                      <div className="stat-value">{currentBacktestResult.neutralCount}</div>
                      <div className="stat-label">Trung lập ({currentBacktestResult.neutralRate}%)</div>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="performance-info">
                    <span>Avg Max Gain: <strong className="gain">+{currentBacktestResult.avgMaxGain}%</strong></span>
                    <span>Avg Max Loss: <strong className="loss">-{currentBacktestResult.avgMaxLoss}%</strong></span>
                  </div>

                  {/* Signal Details */}
                  {currentBacktestResult.evaluations?.length > 0 && (
                    <div className="signal-details">
                      <h4>Chi tiết các tín hiệu:</h4>
                      <div className="signal-table">
                        <div className="table-header">
                          <span>Ngày</span>
                          <span>Giá vào</span>
                          <span>RSI</span>
                          <span>Kết quả</span>
                          <span>Max Gain</span>
                          <span>Max Loss</span>
                        </div>
                        {currentBacktestResult.evaluations.map((eval_, idx) => (
                          <div key={idx} className={`table-row ${getResultClass(eval_.result)}`}>
                            <span>{formatDate(eval_.signalTime)}</span>
                            <span>{eval_.entryPrice?.toFixed(2)}</span>
                            <span>{eval_.indicatorValue?.toFixed(1)}</span>
                            <span className="result-badge">
                              {getResultIcon(eval_.result)} {eval_.result === 'success' ? 'Đúng' : eval_.result === 'failure' ? 'Sai' : 'Trung lập'}
                            </span>
                            <span className="gain">+{eval_.maxGain}%</span>
                            <span className="loss">-{eval_.maxLoss}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Apply to Chart Button */}
                  <button 
                    className="apply-chart-btn"
                    onClick={handleApplyToChart}
                  >
                    📌 Đánh dấu trên biểu đồ
                  </button>
                </div>
              )}

              {/* Error Message */}
              {currentBacktestResult?.error && (
                <div className="backtest-error">
                  <span>⚠️ {currentBacktestResult.error}</span>
                </div>
              )}

              {/* No Data Message */}
              {!candleData?.length && (
                <div className="no-data-message">
                  <span>⚠️ Không có dữ liệu nến để phân tích. Vui lòng tải dữ liệu trước.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="close-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvanceSignalModal;
