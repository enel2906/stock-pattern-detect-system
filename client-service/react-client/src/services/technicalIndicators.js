/**
 * Technical Indicators Calculation Service
 * Implements common technical indicators for stock analysis
 */

/**
 * Simple Moving Average (SMA)
 * @param {Array} data - Array of candle data with {time, close}
 * @param {number} period - Period for moving average
 * @returns {Array} Array of {time, value} for the indicator line
 */
export const calculateSMA = (data, period) => {
  if (!data || data.length < period) {
    console.warn(`Not enough data for SMA(${period}). Need ${period}, got ${data.length}`);
    return [];
  }

  const result = [];
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const average = sum / period;
    
    result.push({
      time: data[i].time,
      value: average
    });
  }

  return result;
};

/**
 * Exponential Moving Average (EMA)
 * @param {Array} data - Array of candle data with {time, close}
 * @param {number} period - Period for moving average
 * @returns {Array} Array of {time, value} for the indicator line
 */
export const calculateEMA = (data, period) => {
  if (!data || data.length < period) {
    console.warn(`Not enough data for EMA(${period}). Need ${period}, got ${data.length}`);
    return [];
  }

  const result = [];
  const multiplier = 2 / (period + 1);

  // Calculate first SMA as the starting point
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let ema = sum / period;

  result.push({
    time: data[period - 1].time,
    value: ema
  });

  // Calculate EMA for remaining data points
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({
      time: data[i].time,
      value: ema
    });
  }

  return result;
};

/**
 * Relative Strength Index (RSI)
 * @param {Array} data - Array of candle data with {time, close}
 * @param {number} period - Period for RSI calculation (default 14)
 * @returns {Array} Array of {time, value} for the RSI line
 */
export const calculateRSI = (data, period = 14) => {
  if (!data || data.length < period + 1) {
    console.warn(`Not enough data for RSI(${period}). Need ${period + 1}, got ${data.length}`);
    return [];
  }

  const result = [];
  const gains = [];
  const losses = [];

  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Calculate first RSI
  let rs = avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));

  result.push({
    time: data[period].time,
    value: rsi
  });

  // Calculate RSI for remaining data points using smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    
    rs = avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));

    result.push({
      time: data[i + 1].time,
      value: rsi
    });
  }

  return result;
};

/**
 * Moving Average Convergence Divergence (MACD)
 * @param {Array} data - Array of candle data with {time, close}
 * @param {number} fastPeriod - Fast EMA period (default 12)
 * @param {number} slowPeriod - Slow EMA period (default 26)
 * @param {number} signalPeriod - Signal line period (default 9)
 * @returns {Object} Object with macd, signal, and histogram arrays
 */
export const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (!data || data.length < slowPeriod + signalPeriod) {
    console.warn(`Not enough data for MACD. Need ${slowPeriod + signalPeriod}, got ${data.length}`);
    return { macd: [], signal: [], histogram: [] };
  }

  // Calculate fast and slow EMAs
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // Calculate MACD line (fast EMA - slow EMA)
  const macdLine = [];
  const startIndex = slowPeriod - fastPeriod;

  for (let i = 0; i < slowEMA.length; i++) {
    const fastValue = fastEMA[i + startIndex]?.value;
    const slowValue = slowEMA[i]?.value;
    
    if (fastValue !== undefined && slowValue !== undefined) {
      macdLine.push({
        time: slowEMA[i].time,
        value: fastValue - slowValue
      });
    }
  }

  // Calculate signal line (EMA of MACD line)
  const multiplier = 2 / (signalPeriod + 1);
  const signalLine = [];
  const histogram = [];

  if (macdLine.length < signalPeriod) {
    return { macd: macdLine, signal: [], histogram: [] };
  }

  // Calculate first signal value (SMA of first signalPeriod MACD values)
  let sum = 0;
  for (let i = 0; i < signalPeriod; i++) {
    sum += macdLine[i].value;
  }
  let signal = sum / signalPeriod;

  signalLine.push({
    time: macdLine[signalPeriod - 1].time,
    value: signal
  });

  histogram.push({
    time: macdLine[signalPeriod - 1].time,
    value: macdLine[signalPeriod - 1].value - signal,
    color: macdLine[signalPeriod - 1].value - signal >= 0 ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
  });

  // Calculate signal line for remaining points
  for (let i = signalPeriod; i < macdLine.length; i++) {
    signal = (macdLine[i].value - signal) * multiplier + signal;
    
    signalLine.push({
      time: macdLine[i].time,
      value: signal
    });

    const histValue = macdLine[i].value - signal;
    histogram.push({
      time: macdLine[i].time,
      value: histValue,
      color: histValue >= 0 ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
    });
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram
  };
};

/**
 * Bollinger Bands
 * @param {Array} data - Array of candle data with {time, close}
 * @param {number} period - Period for moving average (default 20)
 * @param {number} stdDev - Standard deviation multiplier (default 2)
 * @returns {Object} Object with upper, middle, and lower bands
 */
export const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
  if (!data || data.length < period) {
    console.warn(`Not enough data for Bollinger Bands(${period}). Need ${period}, got ${data.length}`);
    return { upper: [], middle: [], lower: [] };
  }

  const middle = [];
  const upper = [];
  const lower = [];

  for (let i = period - 1; i < data.length; i++) {
    // Calculate SMA
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const sma = sum / period;

    // Calculate standard deviation
    let variance = 0;
    for (let j = 0; j < period; j++) {
      variance += Math.pow(data[i - j].close - sma, 2);
    }
    const sd = Math.sqrt(variance / period);

    middle.push({ time: data[i].time, value: sma });
    upper.push({ time: data[i].time, value: sma + (stdDev * sd) });
    lower.push({ time: data[i].time, value: sma - (stdDev * sd) });
  }

  return { upper, middle, lower };
};

/**
 * Check if an indicator is supported
 */
export const isSupportedIndicator = (indicatorName) => {
  const supported = ['sma', 'ema', 'rsi', 'macd', 'bollinger_bands'];
  return supported.includes(indicatorName.toLowerCase());
};

/**
 * Get all supported indicators
 */
export const getSupportedIndicators = () => {
  return [
    'sma',
    'ema', 
    'rsi',
    'macd',
    'bollinger_bands'
  ];
};

export default {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  isSupportedIndicator,
  getSupportedIndicators
};
