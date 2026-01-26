// Technical Indicators Options
export const INDICATOR_OPTIONS = [
  {
    group: 'Moving Averages',
    options: [
      { 
        value: 'sma_20', 
        label: 'SMA(20) - Simple Moving Average',
        type: 'sma',
        period: 20,
        color: '#2196F3'
      },
      { 
        value: 'sma_50', 
        label: 'SMA(50) - Simple Moving Average',
        type: 'sma',
        period: 50,
        color: '#FF9800'
      },
      { 
        value: 'sma_100', 
        label: 'SMA(100) - Simple Moving Average',
        type: 'sma',
        period: 100,
        color: '#9C27B0'
      },
      { 
        value: 'sma_200', 
        label: 'SMA(200) - Simple Moving Average',
        type: 'sma',
        period: 200,
        color: '#F44336'
      },
      { 
        value: 'ema_12', 
        label: 'EMA(12) - Exponential Moving Average',
        type: 'ema',
        period: 12,
        color: '#00BCD4'
      },
      { 
        value: 'ema_26', 
        label: 'EMA(26) - Exponential Moving Average',
        type: 'ema',
        period: 26,
        color: '#FF5722'
      },
    ]
  },
  {
    group: 'Momentum Indicators',
    options: [
      { 
        value: 'rsi_14', 
        label: 'RSI(14) - Relative Strength Index',
        type: 'rsi',
        period: 14,
        color: '#9C27B0',
        requiresPane: true,
        paneHeight: 100
      },
      { 
        value: 'macd_12_26_9', 
        label: 'MACD(12,26,9) - Moving Average Convergence Divergence',
        type: 'macd',
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        requiresPane: true,
        paneHeight: 120
      },
    ]
  },
  {
    group: 'Volatility Indicators',
    options: [
      { 
        value: 'bollinger_20_2', 
        label: 'Bollinger Bands(20,2)',
        type: 'bollinger_bands',
        period: 20,
        stdDev: 2,
        colors: {
          upper: 'rgba(33, 150, 243, 0.3)',
          middle: '#2196F3',
          lower: 'rgba(33, 150, 243, 0.3)'
        }
      },
    ]
  }
];

/**
 * Get indicator configuration by value
 */
export const getIndicatorConfig = (indicatorValue) => {
  for (const group of INDICATOR_OPTIONS) {
    const indicator = group.options.find(opt => opt.value === indicatorValue);
    if (indicator) return indicator;
  }
  return null;
};

/**
 * Get indicator display name
 */
export const getIndicatorName = (indicatorValue) => {
  const config = getIndicatorConfig(indicatorValue);
  return config ? config.label : indicatorValue;
};

/**
 * Check if indicator requires separate pane
 */
export const requiresSeparatePane = (indicatorValue) => {
  const config = getIndicatorConfig(indicatorValue);
  return config ? config.requiresPane === true : false;
};
