/**
 * Combo Signal Definitions
 * Định nghĩa các combo tín hiệu kết hợp mô hình nến với chỉ báo kỹ thuật
 * 
 * 🎯 ATR-Based Risk Management (v2.0):
 * - Stop/Target giờ được tính động dựa trên ATR(14) thay vì % cố định
 * - Bullish: Stop = Entry - 1×ATR, Target = Entry + 2×ATR (R/R = 1:2)
 * - Bearish: Stop = Entry + 1×ATR, Target = Entry - 2×ATR (R/R = 1:2)
 * - targetGain/stopLoss chỉ dùng làm fallback khi không đủ dữ liệu tính ATR
 */

// Default ATR multipliers (có thể customize trong từng combo)
export const DEFAULT_ATR_CONFIG = {
  stopMultiplier: 1.0,    // Stop = Entry ± 1.0×ATR
  targetMultiplier: 2.0,  // Target = Entry ± 2.0×ATR
  period: 14              // ATR(14)
};

export const COMBO_SIGNALS = {
  // ===== COMBO 1: Hammer + RSI < 30 (Bullish Reversal) =====
  'hammer_rsi_oversold': {
    id: 'hammer_rsi_oversold',
    name: 'Hammer + RSI Oversold',
    description: 'Kết hợp mô hình nến Hammer với RSI(14) < 30, báo hiệu khả năng đảo chiều tăng trong 3-7 phiên. Stop/Target tự động theo ATR.',
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
      targetGain: 3, // Fallback: +3%
      stopLoss: 2,   // Fallback: -2%
      // ATR-based (mặc định): Stop = Entry - 1×ATR, Target = Entry + 2×ATR
      atrStopMultiplier: 1.0,
      atrTargetMultiplier: 2.0
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
    description: 'Mô hình Bullish Engulfing kết hợp MACD cắt lên Signal, tín hiệu đảo chiều tăng trong 5-10 phiên. Stop/Target tự động theo ATR.',
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
      targetGain: 4, // Fallback: +4%
      stopLoss: 2.5, // Fallback: -2.5%
      atrStopMultiplier: 1.0,
      atrTargetMultiplier: 2.0
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
    description: 'Mô hình Shooting Star kết hợp RSI > 70 và MACD cắt xuống Signal, tín hiệu đảo chiều giảm mạnh trong 3-6 phiên. Stop/Target tự động theo ATR.',
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
      targetGain: 3, // Fallback: giảm 3%
      stopLoss: 2,   // Fallback: +2% là stop loss
      atrStopMultiplier: 1.0,
      atrTargetMultiplier: 2.0
    },
    sentiment: 'bearish',
    reliability: 'very_high',
    icon: '⭐📉🔻',
    color: '#FF4560'
  },

  // ===== COMBO 4: Doji + Bollinger Bands bó hẹp =====
  // Note: Neutral/Breakout signals vẫn dùng % cố định vì không xác định được hướng
  'doji_bollinger_squeeze': {
    id: 'doji_bollinger_squeeze',
    name: 'Doji + Bollinger Squeeze',
    description: 'Mô hình Doji kết hợp Bollinger Bands bó hẹp (độ rộng ≤ 5%), báo hiệu sắp có biến động mạnh (breakout) trong 5-10 phiên. Dùng % cố định do không xác định hướng.',
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
      targetGain: 3, // ±3% là breakout thành công (% cố định cho neutral)
      stopLoss: 2    // ±2% là không có breakout
      // Note: Neutral không dùng ATR vì không biết hướng
    },
    sentiment: 'neutral',
    reliability: 'high',
    icon: '⚪🎯',
    color: '#FEB019'
  },

  // ===== COMBO 5: Bullish Engulfing + RSI < 40 (Context Filter) =====
  // Nguồn ý tưởng: combo RSI + Engulfing được đánh giá hiệu quả trong file tổng hợp.
  'bullish_engulfing_rsi_filter': {
    id: 'bullish_engulfing_rsi_filter',
    name: 'Bullish Engulfing + RSI Filter',
    description: 'Bullish Engulfing kết hợp RSI(14) < 40 để lọc bối cảnh quá bán nhẹ/đà giảm suy yếu, kỳ vọng đảo chiều tăng trong 5-10 phiên. Stop/Target tự động theo ATR.',
    pattern: 'bullish_engulfing',
    indicators: [
      {
        type: 'rsi',
        period: 14,
        condition: 'lessThan',
        threshold: 40
      }
    ],
    prediction: {
      direction: 'bullish',
      timeframe: 10,
      targetGain: 4,   // Fallback: +4%
      stopLoss: 2.5,   // Fallback: -2.5%
      atrStopMultiplier: 1.0,
      atrTargetMultiplier: 2.0
    },
    sentiment: 'bullish',
    reliability: 'high',
    icon: '📈🟣',
    color: '#00E396'
  },

  // ===== COMBO 6: Hammer + Uptrend MA Filter (MA20/MA50) =====
  // Nguồn ý tưởng: Hammer tại MA quan trọng (tài liệu nói đa khung; ở daily ta dùng MA làm "hỗ trợ động").
  'hammer_ma_uptrend_filter': {
    id: 'hammer_ma_uptrend_filter',
    name: 'Hammer + MA Uptrend Filter',
    description: 'Hammer xuất hiện khi giá chạm/ở ngay trên MA20 hoặc MA50 và MA đang dốc lên, báo hiệu kết thúc nhịp điều chỉnh trong xu hướng tăng (5-12 phiên). Stop/Target tự động theo ATR.',
    pattern: 'hammer',
    indicators: [
      {
        type: 'ma_slope',
        maType: 'sma',
        period: 50,
        condition: 'slopeUp' // MA dốc lên (filter xu hướng)
      },
      {
        type: 'price_vs_ma',
        maType: 'sma',
        period: 20,
        condition: 'nearOrAbove', // giá gần MA hoặc trên MA (hỗ trợ động)
        threshold: 1.0 // trong vòng 1% quanh MA (gợi ý)
      }
    ],
    prediction: {
      direction: 'bullish',
      timeframe: 12,
      targetGain: 5,   // Fallback: +5%
      stopLoss: 2.5,   // Fallback: -2.5%
      atrStopMultiplier: 1.0,
      atrTargetMultiplier: 2.0
    },
    sentiment: 'bullish',
    reliability: 'high',
    icon: '🔨📏',
    color: '#00E396'
  },

  // ===== COMBO 7: Hammer + Volume Spike Confirmation =====
  // Nguồn ý tưởng: volume spike (gấp 2-3 lần trung bình) xác nhận đảo chiều giúp giảm nhiễu.
  'hammer_volume_spike_reversal': {
    id: 'hammer_volume_spike_reversal',
    name: 'Hammer + Volume Spike Confirmation',
    description: 'Hammer kèm Volume Spike (Vol hôm nay ≥ 2x SMA20 Vol) để xác nhận dòng tiền đảo chiều, kỳ vọng tăng trong 3-8 phiên. Stop/Target tự động theo ATR.',
    pattern: 'hammer',
    indicators: [
      {
        type: 'volume_spike',
        period: 20,
        condition: 'greaterThanMultiple',
        threshold: 2 // Vol >= 2 * SMA20(Vol)
      }
    ],
    prediction: {
      direction: 'bullish',
      timeframe: 8,
      targetGain: 3.5, // Fallback: +3.5%
      stopLoss: 2.0,   // Fallback: -2%
      atrStopMultiplier: 1.0,
      atrTargetMultiplier: 2.0
    },
    sentiment: 'bullish',
    reliability: 'very_high',
    icon: '🔨📊',
    color: '#00E396'
  },

  // ===== COMBO 8: Three White Soldiers + RSI < 35 (Oversold Context) =====
  // Nguồn ý tưởng: mô hình nến + RSI filter (ví dụ Three White Soldiers & RSI<35) cho tỷ lệ thắng cao trong file.
  'three_white_soldiers_rsi_oversold': {
    id: 'three_white_soldiers_rsi_oversold',
    name: 'Three White Soldiers + RSI Oversold',
    description: 'Three White Soldiers xuất hiện sau khi RSI(14) < 35 (bối cảnh quá bán), báo hiệu lực mua quay lại mạnh, kỳ vọng tăng 7-15 phiên. Stop/Target tự động theo ATR.',
    pattern: 'three_white_soldiers',
    indicators: [
      {
        type: 'rsi',
        period: 14,
        condition: 'lessThan',
        threshold: 35
      }
    ],
    prediction: {
      direction: 'bullish',
      timeframe: 15,
      targetGain: 6,  // Fallback: +6%
      stopLoss: 3,    // Fallback: -3%
      atrStopMultiplier: 1.0,
      atrTargetMultiplier: 2.0
    },
    sentiment: 'bullish',
    reliability: 'high',
    icon: '🪖🪖🪖📈',
    color: '#00E396'
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
