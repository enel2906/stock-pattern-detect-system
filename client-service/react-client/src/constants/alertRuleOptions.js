// Alert Rule Builder options and configurations

export const SIGNAL_TYPES = [
  { value: 'BUY', label: 'Mua (Buy)' },
  { value: 'SELL', label: 'Bán (Sell)' },
  { value: 'EXIT_BUY', label: 'Thoát Long' },
  { value: 'EXIT_SELL', label: 'Thoát Short' }
];

export const LOGIC_OPERATORS = [
  { value: 'AND', label: 'VÀ (AND) - Tất cả điều kiện phải đúng' },
  { value: 'OR', label: 'HOẶC (OR) - Ít nhất 1 điều kiện đúng' }
];

export const CONDITION_TYPES = [
  { value: 'INDICATOR', label: 'Chỉ báo kỹ thuật (RSI, MACD, SMA...)' },
  { value: 'PATTERN', label: 'Mẫu nến (Hammer, Doji, Engulfing...)' },
  { value: 'PRICE', label: 'Giá (Close, High, Low, Open)' },
  { value: 'VOLUME', label: 'Khối lượng giao dịch' }
];

export const INDICATOR_OPTIONS = [
  { value: 'rsi', label: 'RSI - Relative Strength Index', requiresPeriod: true, defaultPeriod: 14 },
  { value: 'sma', label: 'SMA - Simple Moving Average', requiresPeriod: true, defaultPeriod: 20 },
  { value: 'ema', label: 'EMA - Exponential Moving Average', requiresPeriod: true, defaultPeriod: 20 },
  { value: 'macd', label: 'MACD - Moving Average Convergence Divergence', requiresMultiplePeriods: true },
  { value: 'bollinger_upper', label: 'Bollinger Bands - Upper', requiresPeriod: true, defaultPeriod: 20 },
  { value: 'bollinger_middle', label: 'Bollinger Bands - Middle', requiresPeriod: true, defaultPeriod: 20 },
  { value: 'bollinger_lower', label: 'Bollinger Bands - Lower', requiresPeriod: true, defaultPeriod: 20 }
];

export const PATTERN_OPTIONS = [
  // Single candle patterns
  { value: 'hammer', label: 'Hammer - Nến búa', sentiment: 'bullish' },
  { value: 'inverted_hammer', label: 'Inverted Hammer - Búa ngược', sentiment: 'bullish' },
  { value: 'shooting_star', label: 'Shooting Star - Sao băng', sentiment: 'bearish' },
  { value: 'hanging_man', label: 'Hanging Man - Người treo cổ', sentiment: 'bearish' },
  { value: 'doji', label: 'Doji - Nến doji', sentiment: 'neutral' },
  { value: 'dragonfly_doji', label: 'Dragonfly Doji - Doji chuồn chuồn', sentiment: 'bullish' },
  { value: 'gravestone_doji', label: 'Gravestone Doji - Doji bia mộ', sentiment: 'bearish' },
  { value: 'spinning_top', label: 'Spinning Top - Con quay', sentiment: 'neutral' },
  { value: 'marubozu', label: 'Marubozu - Nến trọc', sentiment: 'neutral' },
  
  // Two candle patterns
  { value: 'bullish_engulfing', label: 'Bullish Engulfing - Nhấn chìm tăng', sentiment: 'bullish' },
  { value: 'bearish_engulfing', label: 'Bearish Engulfing - Nhấn chìm giảm', sentiment: 'bearish' },
  { value: 'bullish_harami', label: 'Bullish Harami - Harami tăng', sentiment: 'bullish' },
  { value: 'bearish_harami', label: 'Bearish Harami - Harami giảm', sentiment: 'bearish' },
  { value: 'piercing_line', label: 'Piercing Line - Đường xuyên thủng', sentiment: 'bullish' },
  { value: 'dark_cloud_cover', label: 'Dark Cloud Cover - Mây đen phủ kín', sentiment: 'bearish' },
  { value: 'tweezer_top', label: 'Tweezer Top - Kẹp đỉnh', sentiment: 'bearish' },
  { value: 'tweezer_bottom', label: 'Tweezer Bottom - Kẹp đáy', sentiment: 'bullish' },
  
  // Three candle patterns
  { value: 'morning_star', label: 'Morning Star - Sao mai', sentiment: 'bullish' },
  { value: 'evening_star', label: 'Evening Star - Sao hôm', sentiment: 'bearish' },
  { value: 'three_white_soldiers', label: 'Three White Soldiers - Ba người lính trắng', sentiment: 'bullish' },
  { value: 'three_black_crows', label: 'Three Black Crows - Ba con quạ đen', sentiment: 'bearish' },
  { value: 'three_inside_up', label: 'Three Inside Up - Ba bên trong tăng', sentiment: 'bullish' },
  { value: 'three_inside_down', label: 'Three Inside Down - Ba bên trong giảm', sentiment: 'bearish' }
];

export const PRICE_OPTIONS = [
  { value: 'close', label: 'Giá đóng cửa (Close)' },
  { value: 'high', label: 'Giá cao nhất (High)' },
  { value: 'low', label: 'Giá thấp nhất (Low)' },
  { value: 'open', label: 'Giá mở cửa (Open)' }
];

export const COMPARISON_OPERATORS = [
  { value: '<', label: '< (Nhỏ hơn)' },
  { value: '>', label: '> (Lớn hơn)' },
  { value: '<=', label: '<= (Nhỏ hơn hoặc bằng)' },
  { value: '>=', label: '>= (Lớn hơn hoặc bằng)' },
  { value: '==', label: '== (Bằng)' },
  { value: '!=', label: '!= (Khác)' }
];

export const CROSS_OPERATORS = [
  { value: 'CROSS_UP', label: 'Cắt lên (Cross Up)' },
  { value: 'CROSS_DOWN', label: 'Cắt xuống (Cross Down)' }
];

export const PATTERN_OPERATORS = [
  { value: 'IS_TRUE', label: 'Xuất hiện (Is True)' },
  { value: 'IS_FALSE', label: 'Không xuất hiện (Is False)' }
];

export const RULE_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Kích hoạt', color: 'success' },
  { value: 'PAUSED', label: 'Tạm dừng', color: 'warning' },
  { value: 'DISABLED', label: 'Vô hiệu hóa', color: 'error' }
];

export const ACTION_TYPES = [
  { value: 'NOTIFY_WEB', label: 'Thông báo Web' },
  { value: 'NOTIFY_EMAIL', label: 'Thông báo Email' },
  { value: 'NOTIFY_TELEGRAM', label: 'Thông báo Telegram' },
  { value: 'WEBHOOK', label: 'Webhook' }
];

export const TIMEFRAME_OPTIONS = [
  { value: '1m', label: '1 phút' },
  { value: '5m', label: '5 phút' },
  { value: '15m', label: '15 phút' },
  { value: '1h', label: '1 giờ' },
  { value: '4h', label: '4 giờ' },
  { value: '1d', label: '1 ngày' }
];

// Default message templates
export const DEFAULT_MESSAGE_TEMPLATES = {
  BUY: 'Tín hiệu MUA: {{symbol}} - {{ruleName}}',
  SELL: 'Tín hiệu BÁN: {{symbol}} - {{ruleName}}',
  EXIT_BUY: 'Tín hiệu THOÁT LONG: {{symbol}} - {{ruleName}}',
  EXIT_SELL: 'Tín hiệu THOÁT SHORT: {{symbol}} - {{ruleName}}'
};

// Helper function to get operator options based on condition type
export const getOperatorOptions = (conditionType, hasCompareWith = false) => {
  if (conditionType === 'PATTERN') {
    return PATTERN_OPERATORS;
  }
  
  if (hasCompareWith) {
    return [...COMPARISON_OPERATORS, ...CROSS_OPERATORS];
  }
  
  return COMPARISON_OPERATORS;
};

// Helper function to get key options based on condition type
export const getKeyOptions = (conditionType) => {
  switch (conditionType) {
    case 'INDICATOR':
      return INDICATOR_OPTIONS;
    case 'PATTERN':
      return PATTERN_OPTIONS;
    case 'PRICE':
      return PRICE_OPTIONS;
    case 'VOLUME':
      return [{ value: 'volume', label: 'Khối lượng (Volume)' }];
    default:
      return [];
  }
};
