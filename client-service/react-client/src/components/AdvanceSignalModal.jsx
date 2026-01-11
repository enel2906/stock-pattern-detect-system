import React, { useState, useEffect, useMemo } from 'react';
import { getAllComboSignals, getComboSignal } from '../constants/comboSignalDefinitions';
import { fetchAllComboSignals, convertAllToLocalFormat, convertToLocalFormat } from '../services/comboSignalApi';
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
  const [serverCombos, setServerCombos] = useState([]);
  const [isLoadingCombos, setIsLoadingCombos] = useState(false);

  // Fetch combo signals from server when modal opens
  useEffect(() => {
    const loadComboSignals = async () => {
      if (!isOpen) return;
      
      setIsLoadingCombos(true);
      try {
        const apiCombos = await fetchAllComboSignals();
        const localFormatCombos = convertAllToLocalFormat(apiCombos);
        setServerCombos(localFormatCombos);
      } catch (error) {
        console.error('Failed to load combo signals from server, using local fallback:', error);
        // Fallback to local definitions
        setServerCombos(getAllComboSignals());
      } finally {
        setIsLoadingCombos(false);
      }
    };
    
    loadComboSignals();
  }, [isOpen]);

  // Use server combos if available, otherwise fallback to local
  const allCombos = useMemo(() => {
    return serverCombos.length > 0 ? serverCombos : getAllComboSignals();
  }, [serverCombos]);
  
  const bullishCombos = useMemo(() => 
    allCombos.filter(c => c.sentiment === 'bullish'), [allCombos]);
  
  const bearishCombos = useMemo(() => 
    allCombos.filter(c => c.sentiment === 'bearish'), [allCombos]);
  
  const neutralCombos = useMemo(() => 
    allCombos.filter(c => c.sentiment === 'neutral'), [allCombos]);

  // Helper to get combo by id (from server or local)
  const getComboById = (comboId) => {
    const fromServer = allCombos.find(c => c.id === comboId);
    return fromServer || getComboSignal(comboId);
  };

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
      // Get combo object to pass to runBacktest (supports server-fetched combos)
      const comboObj = getComboById(selectedCombo);
      if (!comboObj) {
        throw new Error('Combo signal not found');
      }
      
      const result = runBacktest(comboObj, candleData, lookbackMonths);
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
                            🎯 ATR-based R/R 1:2 | {combo.prediction.timeframe} phiên
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
                            🎯 ATR-based R/R 1:2 | {combo.prediction.timeframe} phiên
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

              {/* Neutral Combos (Breakout) */}
              {neutralCombos.length > 0 && (
                <div className="combo-section">
                  <h3 className="section-title neutral">⚡ Tín hiệu Breakout (Neutral)</h3>
                  <div className="combo-list">
                    {neutralCombos.map(combo => (
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
                            ⚡ Breakout ±{combo.prediction.targetGain}% | {combo.prediction.timeframe} phiên
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
              )}
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
                    {neutralCombos.length > 0 && (
                      <optgroup label="⚡ Breakout">
                        {neutralCombos.map(combo => (
                          <option key={combo.id} value={combo.id}>
                            {combo.icon} {combo.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
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
                    <option value={12}>1 năm</option>
                    <option value={24}>2 năm</option>
                    <option value={36}>3 năm</option>
                    <option value={60}>5 năm</option>
                    <option value={84}>7 năm</option>
                    <option value={120}>10 năm</option>
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
                    const combo = getComboById(selectedCombo);
                    if (!combo) return null;
                    
                    // Helper function to format indicator display
                    const formatIndicator = (indicator) => {
                      if (indicator.type === 'rsi') {
                        const conditionSymbol = indicator.condition === 'lessThan' ? '<' : 
                                                indicator.condition === 'greaterThan' ? '>' : '=';
                        return `RSI(${indicator.period}) ${conditionSymbol} ${indicator.threshold}`;
                      } else if (indicator.type === 'macd_crossover') {
                        return indicator.condition === 'crossUp' 
                          ? `MACD(${indicator.fastPeriod},${indicator.slowPeriod},${indicator.signalPeriod}) cắt lên Signal`
                          : `MACD(${indicator.fastPeriod},${indicator.slowPeriod},${indicator.signalPeriod}) cắt xuống Signal`;
                      } else if (indicator.type === 'bollinger_squeeze') {
                        return `Bollinger Bands(${indicator.period},${indicator.stdDev}) bó hẹp ≤ ${indicator.threshold}%`;
                      }
                      return indicator.type;
                    };
                    
                    // Format prediction direction
                    const formatDirection = (direction) => {
                      if (direction === 'bullish') return 'Tăng';
                      if (direction === 'bearish') return 'Giảm';
                      return 'Breakout (tăng hoặc giảm mạnh)';
                    };
                    
                    // Format evaluation criteria
                    const formatEvaluation = (prediction) => {
                      if (prediction.direction === 'neutral') {
                        return `✓ ĐÚNG nếu giá biến động ≥ ±${prediction.targetGain}% | ✗ SAI nếu biên động chỉ trong ±${prediction.stopLoss}%`;
                      }
                      // ATR-based for bullish/bearish
                      const direction = prediction.direction === 'bullish' ? 'TĂNG' : 'GIẢM';
                      return (
                        <>
                          <div>📈 <strong>ATR-based Risk Management (R/R = 1:2)</strong></div>
                          <div>✓ ĐÚNGnếu đạt Target (Entry ± 2×ATR) | ✗ SAI nếu chạm Stop (Entry ± 1×ATR)</div>
                          <div className="fallback-note">📌 Fallback: Target {prediction.direction === 'bullish' ? '+' : '-'}{prediction.targetGain}% / Stop {prediction.direction === 'bullish' ? '-' : '+'}{prediction.stopLoss}%</div>
                        </>
                      );
                    };
                    
                    return (
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
                            <span className="rule-label">Chỉ báo:</span>
                            <span className="rule-value">
                              {combo.indicators.map((ind, idx) => (
                                <span key={idx}>
                                  {formatIndicator(ind)}
                                  {idx < combo.indicators.length - 1 && ' + '}
                                </span>
                              ))}
                            </span>
                          </div>
                          <div className="rule">
                            <span className="rule-label">Dự báo:</span>
                            <span className="rule-value">
                              {formatDirection(combo.prediction.direction)} trong {combo.prediction.timeframe} phiên
                            </span>
                          </div>
                          <div className="rule">
                            <span className="rule-label">Đánh giá:</span>
                            <span className="rule-value">
                              {formatEvaluation(combo.prediction)}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Backtest Results */}
              {currentBacktestResult && !currentBacktestResult.error && (
                <div className="backtest-results">
                  <h3>📊 Kết quả Backtest</h3>
                  
                  {/* Warning: No signals found */}
                  {currentBacktestResult.totalSignals === 0 && (
                    <div className="no-signals-warning">
                      <span className="warning-icon">⚠️</span>
                      <div className="warning-content">
                        <strong>Không tìm thấy tín hiệu nào thỏa mãn điều kiện!</strong>
                        <p>
                          Trong khoảng thời gian {currentBacktestResult.lookbackMonths >= 12 
                            ? `${Math.floor(currentBacktestResult.lookbackMonths / 12)} năm` 
                            : `${currentBacktestResult.lookbackMonths} tháng`} với {currentBacktestResult.totalCandles} phiên giao dịch, 
                          không có thời điểm nào đồng thời xuất hiện mô hình nến và các điều kiện chỉ báo kỹ thuật được yêu cầu.
                        </p>
                        <p className="suggestion">
                          💡 Gợi ý: Thử mở rộng khoảng thời gian hoặc chọn combo tín hiệu khác.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Statistics - only show if there are signals */}
                  {currentBacktestResult.totalSignals > 0 && (
                    <>
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
                        {currentBacktestResult.riskManagement && (
                          <>
                            <span className="atr-info">
                              📈 ATR Model: <strong>{currentBacktestResult.riskManagement.atrUsedCount}</strong> signals
                            </span>
                            {currentBacktestResult.riskManagement.avgATR && (
                              <span className="atr-info">
                                Avg ATR: <strong>{currentBacktestResult.riskManagement.avgATR}</strong>
                              </span>
                            )}
                            {currentBacktestResult.riskManagement.avgRiskReward && (
                              <span className="atr-info">
                                R/R: <strong>{currentBacktestResult.riskManagement.avgRiskReward}:1</strong>
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {/* Signal Details */}
                  {currentBacktestResult.evaluations?.length > 0 && (
                    <div className="signal-details">
                      <h4>Chi tiết các tín hiệu:</h4>
                      <div className="signal-table">
                        <div className="table-header">
                          <span>Ngày</span>
                          <span>Entry</span>
                          <span>Stop/Target</span>
                          <span>Kết quả</span>
                          <span>Model</span>
                        </div>
                        {currentBacktestResult.evaluations.map((eval_, idx) => {
                          // Format stop/target display
                          const formatStopTarget = (evaluation) => {
                            if (evaluation.usedRiskModel === 'ATR' && evaluation.atrValue) {
                              return (
                                <span className="atr-values">
                                  <span className="stop">S: {evaluation.stopPrice}</span>
                                  <span className="target">T: {evaluation.targetPrice}</span>
                                </span>
                              );
                            }
                            return (
                              <span className="percent-values">
                                <span className="stop">S: {evaluation.stopPriceDown || evaluation.stopPriceUp}</span>
                                <span className="target">T: {evaluation.targetPriceUp || evaluation.targetPriceDown}</span>
                              </span>
                            );
                          };
                          
                          return (
                            <div key={idx} className={`table-row ${getResultClass(eval_.result)}`}>
                              <span>{formatDate(eval_.signalTime)}</span>
                              <span>{eval_.entryPrice?.toFixed(2)}</span>
                              <span>{formatStopTarget(eval_)}</span>
                              <span className="result-badge">
                                {getResultIcon(eval_.result)} {eval_.result === 'success' ? 'Đúng' : eval_.result === 'failure' ? 'Sai' : 'Trung lập'}
                              </span>
                              <span className={`model-badge ${eval_.usedRiskModel?.toLowerCase()}`}>
                                {eval_.usedRiskModel === 'ATR' ? '📈 ATR' : '📊 %'}
                              </span>
                            </div>
                          );
                        })}
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
