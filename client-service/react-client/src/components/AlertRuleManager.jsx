import React, { useState, useEffect } from 'react';
import AlertRuleModal from './AlertRuleModal';
import alertRuleApi from '../services/alertRuleApi';
import './AlertRuleManager.css';

const AlertRuleManager = ({ stockSymbol, onSignalsUpdate }) => {
  const [rules, setRules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load rules for current symbol
  useEffect(() => {
    if (stockSymbol) {
      loadRules();
    }
  }, [stockSymbol]);

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await alertRuleApi.getAlertRulesBySymbol(stockSymbol);
      
      if (response.success) {
        setRules(response.data || []);
      } else {
        setError(response.message || 'Không thể tải quy tắc');
      }
    } catch (err) {
      console.error('Error loading rules:', err);
      setError('Lỗi khi tải danh sách quy tắc');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleSaveRule = async (ruleData) => {
    try {
      let response;
      
      if (editingRule) {
        // Update existing rule
        response = await alertRuleApi.updateAlertRule(editingRule.id, ruleData);
      } else {
        // Create new rule
        response = await alertRuleApi.createAlertRule(ruleData);
      }

      if (response.success) {
        await loadRules(); // Reload rules
        setIsModalOpen(false);
        setEditingRule(null);
        
        // Show success notification (you can add toast notification here)
        console.log('Rule saved successfully:', response.data);
      } else {
        throw new Error(response.message || 'Không thể lưu quy tắc');
      }
    } catch (err) {
      console.error('Error saving rule:', err);
      throw err; // Let modal handle the error
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Bạn có chắc muốn xóa quy tắc này?')) {
      return;
    }

    try {
      const response = await alertRuleApi.deleteAlertRule(ruleId);
      
      if (response.success) {
        await loadRules();
        console.log('Rule deleted successfully');
      } else {
        alert(response.message || 'Không thể xóa quy tắc');
      }
    } catch (err) {
      console.error('Error deleting rule:', err);
      alert('Lỗi khi xóa quy tắc');
    }
  };

  const handleToggleStatus = async (ruleId) => {
    try {
      const response = await alertRuleApi.toggleAlertRuleStatus(ruleId);
      
      if (response.success) {
        await loadRules();
        console.log('Rule status toggled:', response.data);
      } else {
        alert(response.message || 'Không thể thay đổi trạng thái');
      }
    } catch (err) {
      console.error('Error toggling rule status:', err);
      alert('Lỗi khi thay đổi trạng thái');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'status-badge status-active';
      case 'PAUSED':
        return 'status-badge status-paused';
      case 'DISABLED':
        return 'status-badge status-disabled';
      default:
        return 'status-badge';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang hoạt động';
      case 'PAUSED':
        return 'Tạm dừng';
      case 'DISABLED':
        return 'Vô hiệu hóa';
      default:
        return status;
    }
  };

  const getSignalTypeIcon = (signalType) => {
    switch (signalType) {
      case 'BUY':
        return '📈';
      case 'SELL':
        return '📉';
      case 'EXIT_BUY':
        return '🔼';
      case 'EXIT_SELL':
        return '🔽';
      default:
        return '📊';
    }
  };

  if (loading && rules.length === 0) {
    return <div className="alert-rule-manager loading">Đang tải...</div>;
  }

  return (
    <div className="alert-rule-manager">
      <div className="manager-header">
        <div className="header-info">
          <h3>Quy tắc cảnh báo</h3>
          {rules.length > 0 && (
            <span className="rule-count">{rules.length} quy tắc</span>
          )}
        </div>
        <button className="create-rule-button" onClick={handleCreateRule}>
          + Tạo quy tắc
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadRules}>Thử lại</button>
        </div>
      )}

      <div className="rules-list">
        {rules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <p>Chưa có quy tắc nào</p>
            <button className="create-first-rule" onClick={handleCreateRule}>
              Tạo quy tắc đầu tiên
            </button>
          </div>
        ) : (
          rules.map(rule => (
            <div key={rule.id} className="rule-card">
              <div className="rule-header">
                <div className="rule-title">
                  <span className="signal-icon">{getSignalTypeIcon(rule.signalType)}</span>
                  <h4>{rule.ruleName}</h4>
                  <span className={getStatusBadgeClass(rule.status)}>
                    {getStatusText(rule.status)}
                  </span>
                </div>
                <div className="rule-actions">
                  <button
                    className="icon-button"
                    onClick={() => handleToggleStatus(rule.id)}
                    title={rule.status === 'ACTIVE' ? 'Tạm dừng' : 'Kích hoạt'}
                  >
                    {rule.status === 'ACTIVE' ? '⏸️' : '▶️'}
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => handleEditRule(rule)}
                    title="Chỉnh sửa"
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-button delete"
                    onClick={() => handleDeleteRule(rule.id)}
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {rule.description && (
                <p className="rule-description">{rule.description}</p>
              )}

              <div className="rule-details">
                <div className="detail-item">
                  <span className="detail-label">Điều kiện:</span>
                  <span className="detail-value">
                    {rule.conditions?.length || 0} điều kiện ({rule.logicOperator})
                  </span>
                </div>
                
                {rule.statistics && (
                  <div className="detail-item">
                    <span className="detail-label">Đã kích hoạt:</span>
                    <span className="detail-value">
                      {rule.statistics.triggeredCount || 0} lần
                    </span>
                  </div>
                )}
              </div>

              <div className="rule-conditions-preview">
                {rule.conditions?.slice(0, 2).map((condition, idx) => (
                  <div key={idx} className="condition-chip">
                    {condition.key} {condition.operator} {condition.value || '...'}
                  </div>
                ))}
                {rule.conditions?.length > 2 && (
                  <span className="more-conditions">
                    +{rule.conditions.length - 2} điều kiện khác
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <AlertRuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(null);
        }}
        onSave={handleSaveRule}
        stockSymbol={stockSymbol}
        existingRule={editingRule}
      />
    </div>
  );
};

export default AlertRuleManager;
