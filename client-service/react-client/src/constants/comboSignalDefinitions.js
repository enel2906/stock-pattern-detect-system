/**
 * Combo Signal Definitions
 * Định nghĩa các combo tín hiệu kết hợp mô hình nến với chỉ báo kỹ thuật
 */

export const COMBO_SIGNALS = {
  // ===== COMBO 1: Hammer + RSI < 30 (Bullish Reversal) =====
  'hammer_rsi_oversold': {
    id: 'hammer_rsi_oversold',
    name: 'Hammer + RSI Oversold',
    description: 'Kết hợp mô hình nến Hammer với RSI dưới 30, báo hiệu khả năng đảo chiều tăng mạnh.',
    pattern: 'hammer',
    indicator: {
      type: 'rsi',
      period: 14,
      condition: 'lessThan',
      threshold: 30
    },
    prediction: {
      direction: 'bullish',
      timeframe: 5, // 5 phiên sau
      targetGain: 3, // +3%
      stopLoss: 2 // -2%
    },
    sentiment: 'bullish',
    reliability: 'high',
    icon: '🔨📉',
    color: '#00E396'
  },

  // ===== COMBO 2: Bullish Engulfing + RSI < 40 =====
  'bullish_engulfing_rsi': {
    id: 'bullish_engulfing_rsi',
    name: 'Bullish Engulfing + RSI Oversold',
    description: 'Mô hình nến nhấn chìm tăng kết hợp RSI thấp, tín hiệu đảo chiều tăng mạnh.',
    pattern: 'bullish_engulfing',
    indicator: {
      type: 'rsi',
      period: 14,
      condition: 'lessThan',
      threshold: 40
    },
    prediction: {
      direction: 'bullish',
      timeframe: 5,
      targetGain: 3,
      stopLoss: 2
    },
    sentiment: 'bullish',
    reliability: 'high',
    icon: '�📉',
    color: '#00E396'
  },

  // ===== COMBO 3: Shooting Star + RSI > 70 =====
  'shooting_star_rsi_overbought': {
    id: 'shooting_star_rsi_overbought',
    name: 'Shooting Star + RSI Overbought',
    description: 'Mô hình Shooting Star kết hợp RSI trên 70, báo hiệu khả năng đảo chiều giảm.',
    pattern: 'shooting_star',
    indicator: {
      type: 'rsi',
      period: 14,
      condition: 'greaterThan',
      threshold: 70
    },
    prediction: {
      direction: 'bearish',
      timeframe: 5,
      targetGain: 3, // Kỳ vọng giảm 3%
      stopLoss: 2
    },
    sentiment: 'bearish',
    reliability: 'high',
    icon: '⭐📈',
    color: '#FF4560'
  },

  // ===== COMBO 4: Bearish Engulfing + RSI > 60 =====
  'bearish_engulfing_rsi': {
    id: 'bearish_engulfing_rsi',
    name: 'Bearish Engulfing + RSI Overbought',
    description: 'Mô hình nến nhấn chìm giảm kết hợp RSI cao, tín hiệu đảo chiều giảm.',
    pattern: 'bearish_engulfing',
    indicator: {
      type: 'rsi',
      period: 14,
      condition: 'greaterThan',
      threshold: 60
    },
    prediction: {
      direction: 'bearish',
      timeframe: 5,
      targetGain: 3,
      stopLoss: 2
    },
    sentiment: 'bearish',
    reliability: 'high',
    icon: '🔴�',
    color: '#FF4560'
  },

  // ===== COMBO 5: Morning Star + RSI < 35 =====
  'morning_star_rsi': {
    id: 'morning_star_rsi',
    name: 'Morning Star + RSI Low',
    description: 'Mô hình Morning Star kết hợp RSI thấp, tín hiệu đảo chiều tăng rất mạnh.',
    pattern: 'morning_star',
    indicator: {
      type: 'rsi',
      period: 14,
      condition: 'lessThan',
      threshold: 35
    },
    prediction: {
      direction: 'bullish',
      timeframe: 5,
      targetGain: 4,
      stopLoss: 2
    },
    sentiment: 'bullish',
    reliability: 'very_high',
    icon: '🌟📉',
    color: '#00E396'
  },

  // ===== COMBO 6: Evening Star + RSI > 65 =====
  'evening_star_rsi': {
    id: 'evening_star_rsi',
    name: 'Evening Star + RSI High',
    description: 'Mô hình Evening Star kết hợp RSI cao, tín hiệu đảo chiều giảm rất mạnh.',
    pattern: 'evening_star',
    indicator: {
      type: 'rsi',
      period: 14,
      condition: 'greaterThan',
      threshold: 65
    },
    prediction: {
      direction: 'bearish',
      timeframe: 5,
      targetGain: 4,
      stopLoss: 2
    },
    sentiment: 'bearish',
    reliability: 'very_high',
    icon: '🌙📈',
    color: '#FF4560'
  },

  // ===== COMBO 7: Dragonfly Doji + RSI < 30 =====
  'dragonfly_doji_rsi': {
    id: 'dragonfly_doji_rsi',
    name: 'Dragonfly Doji + RSI Oversold',
    description: 'Mô hình Dragonfly Doji kết hợp RSI rất thấp, tín hiệu đảo chiều tăng.',
    pattern: 'dragonfly_doji',
    indicator: {
      type: 'rsi',
      period: 14,
      condition: 'lessThan',
      threshold: 30
    },
    prediction: {
      direction: 'bullish',
      timeframe: 5,
      targetGain: 3,
      stopLoss: 2
    },
    sentiment: 'bullish',
    reliability: 'medium',
    icon: '🐉📉',
    color: '#00E396'
  },

  // ===== COMBO 8: Gravestone Doji + RSI > 70 =====
  'gravestone_doji_rsi': {
    id: 'gravestone_doji_rsi',
    name: 'Gravestone Doji + RSI Overbought',
    description: 'Mô hình Gravestone Doji kết hợp RSI rất cao, tín hiệu đảo chiều giảm.',
    pattern: 'gravestone_doji',
    indicator: {
      type: 'rsi',
      period: 14,
      condition: 'greaterThan',
      threshold: 70
    },
    prediction: {
      direction: 'bearish',
      timeframe: 5,
      targetGain: 3,
      stopLoss: 2
    },
    sentiment: 'bearish',
    reliability: 'medium',
    icon: '⚰️📈',
    color: '#FF4560'
  }
};

/**
 * Get combo signal by ID
 */
export const getComboSignal = (comboId) => {
  return COMBO_SIGNALS[comboId] || null;
};

/**
 * Get all combo signals as array
 */
export const getAllComboSignals = () => {
  return Object.values(COMBO_SIGNALS);
};

/**
 * Get combo signals by sentiment (bullish/bearish)
 */
export const getComboSignalsBySentiment = (sentiment) => {
  return Object.values(COMBO_SIGNALS).filter(combo => combo.sentiment === sentiment);
};

/**
 * Get combo signals by reliability level
 */
export const getComboSignalsByReliability = (reliability) => {
  return Object.values(COMBO_SIGNALS).filter(combo => combo.reliability === reliability);
};

export default COMBO_SIGNALS;
