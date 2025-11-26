import React, { useState, useEffect } from 'react';
import {
  SIGNAL_TYPES,
  LOGIC_OPERATORS,
  CONDITION_TYPES,
  ACTION_TYPES,
  TIMEFRAME_OPTIONS,
  RULE_STATUS_OPTIONS,
  DEFAULT_MESSAGE_TEMPLATES,
  getOperatorOptions,
  getKeyOptions
} from '../constants/alertRuleOptions';
import './AlertRuleModal.css';

const AlertRuleModal = ({ isOpen, onClose, onSave, stockSymbol, existingRule = null }) => {
  const [formData, setFormData] = useState({
    ruleName: '',
    description: '',
    symbol: stockSymbol || '',
    signalType: 'BUY',
    status: 'ACTIVE',
    priority: 0,
    timeframe: '1d',
    logicOperator: 'AND',
    conditions: [],
    action: {
      type: 'NOTIFY_WEB',
      messageTemplate: DEFAULT_MESSAGE_TEMPLATES.BUY,
      cooldownMinutes: 5
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existingRule) {
      setFormData({
        ruleName: existingRule.ruleName,
        description: existingRule.description || '',
        symbol: existingRule.symbol,
        signalType: existingRule.signalType,
        status: existingRule.status,
        priority: existingRule.priority || 0,
        timeframe: existingRule.timeframe || '1d',
        logicOperator: existingRule.logicOperator,
        conditions: existingRule.conditions || [],
        action: existingRule.action || {
          type: 'NOTIFY_WEB',
          messageTemplate: DEFAULT_MESSAGE_TEMPLATES[existingRule.signalType],
          cooldownMinutes: 5
        }
      });
    } else if (stockSymbol) {
      setFormData(prev => ({ ...prev, symbol: stockSymbol }));
    }
  }, [existingRule, stockSymbol]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-update message template when signal type changes
    if (field === 'signalType') {
      setFormData(prev => ({
        ...prev,
        action: {
          ...prev.action,
          messageTemplate: DEFAULT_MESSAGE_TEMPLATES[value]
        }
      }));
    }
  };

  const handleActionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      action: { ...prev.action, [field]: value }
    }));
  };

  const addCondition = () => {
    const newCondition = {
      type: 'INDICATOR',
      key: 'rsi',
      params: { period: 14 },
      operator: '<',
      value: 30,
      compareWith: null
    };
    
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const updateCondition = (index, field, value) => {
    const updatedConditions = [...formData.conditions];
    
    // When type changes, reset condition
    if (field === 'type') {
      updatedConditions[index] = {
        type: value,
        key: '',
        params: {},
        operator: value === 'PATTERN' ? 'IS_TRUE' : '<',
        value: null,
        compareWith: null
      };
    } else if (field === 'key') {
      // Reset params when key changes
      const keyOption = getKeyOptions(updatedConditions[index].type).find(opt => opt.value === value);
      updatedConditions[index][field] = value;
      
      if (keyOption?.requiresPeriod) {
        updatedConditions[index].params = { period: keyOption.defaultPeriod };
      } else if (keyOption?.requiresMultiplePeriods) {
        updatedConditions[index].params = { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 };
      } else {
        updatedConditions[index].params = {};
      }
    } else {
      updatedConditions[index][field] = value;
    }
    
    setFormData(prev => ({ ...prev, conditions: updatedConditions }));
  };

  const updateConditionParams = (index, paramKey, value) => {
    const updatedConditions = [...formData.conditions];
    updatedConditions[index].params = {
      ...updatedConditions[index].params,
      [paramKey]: value
    };
    setFormData(prev => ({ ...prev, conditions: updatedConditions }));
  };

  const removeCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const toggleCompareWith = (index) => {
    const updatedConditions = [...formData.conditions];
    if (updatedConditions[index].compareWith) {
      updatedConditions[index].compareWith = null;
      updatedConditions[index].value = null;
    } else {
      updatedConditions[index].compareWith = {
        type: 'INDICATOR',
        key: 'sma',
        params: { period: 20 }
      };
      updatedConditions[index].value = null;
    }
    setFormData(prev => ({ ...prev, conditions: updatedConditions }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.ruleName.trim()) {
      newErrors.ruleName = 'Tên quy tắc là bắt buộc';
    }
    
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Mã cổ phiếu là bắt buộc';
    }
    
    if (formData.conditions.length === 0) {
      newErrors.conditions = 'Cần ít nhất một điều kiện';
    }
    
    // Validate each condition
    formData.conditions.forEach((condition, index) => {
      if (!condition.key) {
        newErrors[`condition_${index}_key`] = 'Chọn chỉ báo/mẫu nến';
      }
      
      if (condition.type !== 'PATTERN' && !condition.compareWith && condition.value == null) {
        newErrors[`condition_${index}_value`] = 'Nhập giá trị so sánh';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }
    
    try {
      console.log('Submitting form data:', formData);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving rule:', error);
      setErrors({ submit: error.message || 'Lỗi khi lưu quy tắc. Vui lòng thử lại.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="alert-rule-modal-overlay" onClick={onClose}>
      <div className="alert-rule-modal" onClick={(e) => e.stopPropagation()}>
        <div className="alert-rule-modal-header">
          <h2>{existingRule ? 'Chỉnh sửa quy tắc' : 'Tạo quy tắc mới'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="alert-rule-modal-content">
          {/* Basic Information */}
          <section className="form-section">
            <h3>Thông tin cơ bản</h3>
            
            <div className="form-group">
              <label>Tên quy tắc *</label>
              <input
                type="text"
                value={formData.ruleName}
                onChange={(e) => handleInputChange('ruleName', e.target.value)}
                placeholder="VD: Bắt đáy HPG với Hammer"
                className={errors.ruleName ? 'error' : ''}
              />
              {errors.ruleName && <span className="error-message">{errors.ruleName}</span>}
            </div>

            <div className="form-group">
              <label>Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Mô tả chi tiết về quy tắc này..."
                rows={2}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Mã cổ phiếu *</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                  placeholder="HPG"
                  className={errors.symbol ? 'error' : ''}
                />
                {errors.symbol && <span className="error-message">{errors.symbol}</span>}
              </div>

              <div className="form-group">
                <label>Loại tín hiệu *</label>
                <select
                  value={formData.signalType}
                  onChange={(e) => handleInputChange('signalType', e.target.value)}
                >
                  {SIGNAL_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  {RULE_STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Khung thời gian</label>
                <select
                  value={formData.timeframe}
                  onChange={(e) => handleInputChange('timeframe', e.target.value)}
                >
                  {TIMEFRAME_OPTIONS.map(tf => (
                    <option key={tf.value} value={tf.value}>{tf.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Độ ưu tiên</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </section>

          {/* Conditions */}
          <section className="form-section">
            <div className="section-header">
              <h3>Điều kiện</h3>
              <select
                value={formData.logicOperator}
                onChange={(e) => handleInputChange('logicOperator', e.target.value)}
                className="logic-operator-select"
              >
                {LOGIC_OPERATORS.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>

            {errors.conditions && <span className="error-message">{errors.conditions}</span>}

            <div className="conditions-list">
              {formData.conditions.map((condition, index) => (
                <ConditionEditor
                  key={index}
                  index={index}
                  condition={condition}
                  updateCondition={updateCondition}
                  updateConditionParams={updateConditionParams}
                  removeCondition={removeCondition}
                  toggleCompareWith={toggleCompareWith}
                  errors={errors}
                />
              ))}
            </div>

            <button className="add-condition-button" onClick={addCondition}>
              + Thêm điều kiện
            </button>
          </section>

          {/* Action */}
          <section className="form-section">
            <h3>Hành động khi kích hoạt</h3>

            <div className="form-group">
              <label>Loại thông báo</label>
              <select
                value={formData.action.type}
                onChange={(e) => handleActionChange('type', e.target.value)}
              >
                {ACTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Nội dung thông báo</label>
              <textarea
                value={formData.action.messageTemplate}
                onChange={(e) => handleActionChange('messageTemplate', e.target.value)}
                placeholder="Sử dụng {{symbol}}, {{signalType}}, {{ruleName}}"
                rows={2}
              />
              <small className="hint">Biến: {'{'}{'{'} symbol {'}'}{'}'}, {'{'}{'{'} signalType {'}'}{'}'}, {'{'}{'{'} ruleName {'}'}{'}'}
</small>
            </div>

            <div className="form-group">
              <label>Thời gian chờ (phút)</label>
              <input
                type="number"
                value={formData.action.cooldownMinutes}
                onChange={(e) => handleActionChange('cooldownMinutes', parseInt(e.target.value))}
                min="0"
                max="1440"
              />
              <small className="hint">Tránh spam: Chỉ gửi thông báo một lần trong khoảng thời gian này</small>
            </div>
          </section>

          {errors.submit && <div className="submit-error">{errors.submit}</div>}
        </div>

        <div className="alert-rule-modal-footer">
          <button className="cancel-button" onClick={onClose}>Hủy</button>
          <button className="save-button" onClick={handleSubmit}>
            {existingRule ? 'Cập nhật' : 'Tạo quy tắc'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Condition Editor Component
const ConditionEditor = ({ 
  index, 
  condition, 
  updateCondition, 
  updateConditionParams,
  removeCondition, 
  toggleCompareWith,
  errors 
}) => {
  const keyOptions = getKeyOptions(condition.type);
  const operatorOptions = getOperatorOptions(condition.type, condition.compareWith != null);
  const selectedKeyOption = keyOptions.find(opt => opt.value === condition.key);

  return (
    <div className="condition-card">
      <div className="condition-header">
        <span className="condition-number">Điều kiện {index + 1}</span>
        <button className="remove-condition-button" onClick={() => removeCondition(index)}>
          ×
        </button>
      </div>

      <div className="form-row">
        {/* Condition Type */}
        <div className="form-group">
          <label>Loại</label>
          <select
            value={condition.type}
            onChange={(e) => updateCondition(index, 'type', e.target.value)}
          >
            {CONDITION_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Key Selection */}
        <div className="form-group">
          <label>{condition.type === 'PATTERN' ? 'Mẫu nến' : 'Chỉ báo'}</label>
          <select
            value={condition.key}
            onChange={(e) => updateCondition(index, 'key', e.target.value)}
            className={errors[`condition_${index}_key`] ? 'error' : ''}
          >
            <option value="">-- Chọn --</option>
            {keyOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors[`condition_${index}_key`] && (
            <span className="error-message">{errors[`condition_${index}_key`]}</span>
          )}
        </div>
      </div>

      {/* Parameters (for indicators) */}
      {selectedKeyOption?.requiresPeriod && (
        <div className="form-row">
          <div className="form-group">
            <label>Chu kỳ (Period)</label>
            <input
              type="number"
              value={condition.params?.period || 14}
              onChange={(e) => updateConditionParams(index, 'period', parseInt(e.target.value))}
              min="1"
              max="200"
            />
          </div>
        </div>
      )}

      {selectedKeyOption?.requiresMultiplePeriods && (
        <div className="form-row">
          <div className="form-group">
            <label>Fast Period</label>
            <input
              type="number"
              value={condition.params?.fastPeriod || 12}
              onChange={(e) => updateConditionParams(index, 'fastPeriod', parseInt(e.target.value))}
              min="1"
              max="100"
            />
          </div>
          <div className="form-group">
            <label>Slow Period</label>
            <input
              type="number"
              value={condition.params?.slowPeriod || 26}
              onChange={(e) => updateConditionParams(index, 'slowPeriod', parseInt(e.target.value))}
              min="1"
              max="100"
            />
          </div>
        </div>
      )}

      <div className="form-row">
        {/* Operator */}
        <div className="form-group">
          <label>Toán tử</label>
          <select
            value={condition.operator}
            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
          >
            {operatorOptions.map(op => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>

        {/* Value or Compare With */}
        {condition.type !== 'PATTERN' && (
          <>
            {!condition.compareWith ? (
              <div className="form-group">
                <label>Giá trị</label>
                <input
                  type="number"
                  value={condition.value || ''}
                  onChange={(e) => updateCondition(index, 'value', parseFloat(e.target.value))}
                  placeholder="VD: 30"
                  className={errors[`condition_${index}_value`] ? 'error' : ''}
                />
                {errors[`condition_${index}_value`] && (
                  <span className="error-message">{errors[`condition_${index}_value`]}</span>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label>So sánh với</label>
                <select
                  value={condition.compareWith?.key || ''}
                  onChange={(e) => updateCondition(index, 'compareWith', {
                    ...condition.compareWith,
                    key: e.target.value
                  })}
                >
                  <option value="">-- Chọn chỉ báo --</option>
                  {getKeyOptions('INDICATOR').map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group compare-toggle">
              <button
                className="toggle-compare-button"
                onClick={() => toggleCompareWith(index)}
              >
                {condition.compareWith ? '📊 Dùng giá trị cố định' : '📈 So sánh với chỉ báo'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AlertRuleModal;
