/**
 * Combo Signal Definitions
 * Định nghĩa các combo tín hiệu kết hợp mô hình nến với chỉ báo kỹ thuật
 */

export const COMBO_SIGNALS = {
  // ===== COMBO 1: Hammer + RSI < 30 (Bullish Reversal) =====
  'hammer_rsi_oversold': {
    id: 'hammer_rsi_oversold',
    name: 'Hammer + RSI Oversold',
    description: 'Kết hợp mô hình nến Hammer với RSI(14) < 30, báo hiệu khả năng đảo chiều tăng trong 3-7 phiên.',
    pattern: 'hammer',
    indicators: [
      {
        type: 'rsi',
        period: 14,
        condition: 'lessThan',
        threshold: 30
      }
    ],
    prediction: {
      direction: 'bullish',
      timeframe: 7, // Đánh giá trong 7 phiên
      targetGain: 3, // +3%
      stopLoss: 2 // -2%
    },
    sentiment: 'bullish',
    reliability: 'high',
    icon: '🔨📉',
    color: '#00E396'
  },

  // ===== COMBO 2: Bullish Engulfing + MACD cắt lên Signal =====
  'bullish_engulfing_macd_crossover': {
    id: 'bullish_engulfing_macd_crossover',
    name: 'Bullish Engulfing + MACD Crossover',
    description: 'Mô hình Bullish Engulfing kết hợp MACD cắt lên Signal, tín hiệu đảo chiều tăng trong 5-10 phiên.',
    pattern: 'bullish_engulfing',
    indicators: [
      {
        type: 'macd_crossover',
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        condition: 'crossUp' // MACD cắt lên Signal
      }
    ],
    prediction: {
      direction: 'bullish',
      timeframe: 10, // Đánh giá trong 10 phiên
      targetGain: 4, // +4%
      stopLoss: 2.5 // -2.5%
    },
    sentiment: 'bullish',
    reliability: 'high',
    icon: '📈🔀',
    color: '#00E396'
  },

  // ===== COMBO 3: Shooting Star + RSI > 70 + MACD cắt xuống =====
  'shooting_star_rsi_macd': {
    id: 'shooting_star_rsi_macd',
    name: 'Shooting Star + RSI Overbought + MACD Crossdown',
    description: 'Mô hình Shooting Star kết hợp RSI > 70 và MACD cắt xuống Signal, tín hiệu đảo chiều giảm mạnh trong 3-6 phiên.',
    pattern: 'shooting_star',
    indicators: [
      {
        type: 'rsi',
        period: 14,
        condition: 'greaterThan',
        threshold: 70
      },
      {
        type: 'macd_crossover',
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        condition: 'crossDown' // MACD cắt xuống Signal
      }
    ],
    prediction: {
      direction: 'bearish',
      timeframe: 6, // Đánh giá trong 6 phiên
      targetGain: 3, // Kỳ vọng giảm 3%
      stopLoss: 2 // +2% là stop loss
    },
    sentiment: 'bearish',
    reliability: 'very_high',
    icon: '⭐📉🔻',
    color: '#FF4560'
  },

  // ===== COMBO 4: Doji + Bollinger Bands bó hẹp =====
  'doji_bollinger_squeeze': {
    id: 'doji_bollinger_squeeze',
    name: 'Doji + Bollinger Squeeze',
    description: 'Mô hình Doji kết hợp Bollinger Bands bó hẹp (độ rộng ≤ 5%), báo hiệu sắp có biến động mạnh (breakout) trong 5-10 phiên.',
    pattern: 'doji',
    indicators: [
      {
        type: 'bollinger_squeeze',
        period: 20,
        stdDev: 2,
        condition: 'squeeze',
        threshold: 5 // (Upper - Lower) / MA <= 5%
      }
    ],
    prediction: {
      direction: 'neutral', // Có thể tăng hoặc giảm mạnh
      timeframe: 10, // Đánh giá trong 10 phiên
      targetGain: 3, // ±3% là breakout thành công
      stopLoss: 2 // ±2% là không có breakout
    },
    sentiment: 'neutral',
    reliability: 'high',
    icon: '⚪🎯',
    color: '#FEB019'
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
