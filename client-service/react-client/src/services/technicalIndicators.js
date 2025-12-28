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
 * Calculate Volume Spike
 * Detects when current volume is significantly higher than average volume
 * @param {Array} data - Array of candle data with {time, volume}
 * @param {number} period - Period for volume moving average (default 20)
 * @returns {Array} Array of {time, value, avgVolume, spikeRatio} for volume analysis
 */
export const calculateVolumeSpike = (data, period = 20) => {
  if (!data || data.length < period) {
    console.warn(`Not enough data for Volume Spike(${period}). Need ${period}, got ${data.length}`);
    return [];
  }

  const result = [];

  for (let i = period - 1; i < data.length; i++) {
    // Calculate average volume over the period (excluding current candle for fair comparison)
    let sum = 0;
    for (let j = 1; j <= period; j++) {
      sum += data[i - j]?.volume || 0;
    }
    const avgVolume = sum / period;

    const currentVolume = data[i].volume || 0;
    const spikeRatio = avgVolume > 0 ? currentVolume / avgVolume : 0;

    result.push({
      time: data[i].time,
      value: currentVolume,
      avgVolume: avgVolume,
      spikeRatio: spikeRatio,
      isSpike: spikeRatio >= 2 // Default spike threshold is 2x
    });
  }

  return result;
};

/**
 * Calculate MA Slope (Moving Average Slope)
 * Determines if the moving average is trending up or down
 * @param {Array} data - Array of candle data with {time, close}
 * @param {string} maType - Type of MA ('sma' or 'ema')
 * @param {number} period - Period for moving average
 * @param {number} slopeLookback - Number of periods to check slope (default 5)
 * @returns {Array} Array of {time, value, slope, slopeUp, slopeDown}
 */
export const calculateMASlope = (data, maType = 'sma', period = 50, slopeLookback = 5) => {
  if (!data || data.length < period + slopeLookback) {
    console.warn(`Not enough data for MA Slope(${period}). Need ${period + slopeLookback}, got ${data.length}`);
    return [];
  }

  // Calculate the moving average first
  const maData = maType === 'ema' ? calculateEMA(data, period) : calculateSMA(data, period);
  
  if (maData.length < slopeLookback + 1) {
    return [];
  }

  const result = [];

  for (let i = slopeLookback; i < maData.length; i++) {
    const currentMA = maData[i].value;
    const prevMA = maData[i - slopeLookback].value;
    
    // Calculate slope as percentage change
    const slope = prevMA > 0 ? ((currentMA - prevMA) / prevMA) * 100 : 0;
    
    result.push({
      time: maData[i].time,
      value: currentMA,
      slope: slope,
      slopeUp: slope > 0.1, // MA is trending up (at least 0.1% increase)
      slopeDown: slope < -0.1 // MA is trending down (at least 0.1% decrease)
    });
  }

  return result;
};

/**
 * Calculate Price vs MA relationship
 * Determines how close the price is to a moving average
 * @param {Array} data - Array of candle data with {time, close, low, high}
 * @param {string} maType - Type of MA ('sma' or 'ema')
 * @param {number} period - Period for moving average
 * @returns {Array} Array of {time, close, maValue, distancePercent, isNearMA, isAboveMA, isBelowMA}
 */
export const calculatePriceVsMA = (data, maType = 'sma', period = 20) => {
  if (!data || data.length < period) {
    console.warn(`Not enough data for Price vs MA(${period}). Need ${period}, got ${data.length}`);
    return [];
  }

  // Calculate the moving average
  const maData = maType === 'ema' ? calculateEMA(data, period) : calculateSMA(data, period);

  const result = [];

  for (let i = 0; i < maData.length; i++) {
    const dataIndex = period - 1 + i;
    const candle = data[dataIndex];
    const maValue = maData[i].value;
    
    // Calculate distance from close to MA
    const distancePercent = maValue > 0 ? ((candle.close - maValue) / maValue) * 100 : 0;
    
    // Check if price touched or is near MA (using low/high for touch detection)
    const touchedMA = candle.low <= maValue && candle.high >= maValue;
    
    result.push({
      time: candle.time,
      close: candle.close,
      low: candle.low,
      high: candle.high,
      maValue: maValue,
      distancePercent: distancePercent,
      touchedMA: touchedMA,
      isNearMA: Math.abs(distancePercent) <= 1.0, // Within 1% of MA
      isAboveMA: distancePercent > 0,
      isBelowMA: distancePercent < 0,
      nearOrAbove: distancePercent >= -1.0 // Price is at or above MA (within 1% tolerance below)
    });
  }

  return result;
};

/**
 * Check if an indicator is supported
 */
export const isSupportedIndicator = (indicatorName) => {
  const supported = ['sma', 'ema', 'rsi', 'macd', 'bollinger_bands', 'volume_spike', 'ma_slope', 'price_vs_ma'];
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
    'bollinger_bands',
    'volume_spike',
    'ma_slope',
    'price_vs_ma'
  ];
};

export default {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateVolumeSpike,
  calculateMASlope,
  calculatePriceVsMA,
  isSupportedIndicator,
  getSupportedIndicators
};
