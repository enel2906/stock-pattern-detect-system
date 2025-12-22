/**
 * Advance Signal Service
 * Service xử lý logic phát hiện combo tín hiệu và backtest
 */

import { calculateRSI } from './technicalIndicators';
import { 
  detectHammer, 
  detectInvertedHammer, 
  detectShootingStar, 
  detectHangingMan,
  detectBullishEngulfing,
  detectBearishEngulfing,
  detectDragonflyDoji,
  detectGravestoneDoji
} from './candlePatternDetector';
import { detectMorningStar, detectEveningStar } from './candlePatternDetectorPart2';
import { getComboSignal, getAllComboSignals } from '../constants/comboSignalDefinitions';

// Pattern detector mapping
const PATTERN_DETECTORS = {
  'hammer': detectHammer,
  'inverted_hammer': detectInvertedHammer,
  'shooting_star': detectShootingStar,
  'hanging_man': detectHangingMan,
  'bullish_engulfing': detectBullishEngulfing,
  'bearish_engulfing': detectBearishEngulfing,
  'morning_star': detectMorningStar,
  'evening_star': detectEveningStar,
  'dragonfly_doji': detectDragonflyDoji,
  'gravestone_doji': detectGravestoneDoji,
};

/**
 * Detect patterns using the appropriate detector
 * @param {string} patternName - Name of the pattern
 * @param {Array} candles - Candle data array
 * @returns {Array} Array of detected patterns
 */
const detectPattern = (patternName, candles) => {
  const detector = PATTERN_DETECTORS[patternName];
  if (!detector) {
    console.warn(`No detector found for pattern: ${patternName}`);
    return [];
  }
  
  try {
    return detector(candles) || [];
  } catch (error) {
    console.error(`Error detecting pattern ${patternName}:`, error);
    return [];
  }
};

/**
 * Get indicator value at a specific index
 * @param {string} indicatorType - Type of indicator (rsi, macd, etc.)
 * @param {Array} candles - Candle data
 * @param {number} period - Indicator period
 * @param {number} targetIndex - Index to get value at
 * @returns {number|null} Indicator value or null
 */
const getIndicatorValueAtIndex = (indicatorType, candles, period, targetIndex) => {
  if (indicatorType === 'rsi') {
    const rsiData = calculateRSI(candles, period);
    // RSI data starts from index = period
    const rsiIndex = targetIndex - period;
    if (rsiIndex >= 0 && rsiIndex < rsiData.length) {
      return rsiData[rsiIndex].value;
    }
  }
  return null;
};

/**
 * Check if indicator condition is met
 * @param {number} value - Indicator value
 * @param {string} condition - Condition type (lessThan, greaterThan, etc.)
 * @param {number} threshold - Threshold value
 * @returns {boolean}
 */
const checkIndicatorCondition = (value, condition, threshold) => {
  if (value === null || value === undefined) return false;
  
  switch (condition) {
    case 'lessThan':
      return value < threshold;
    case 'greaterThan':
      return value > threshold;
    case 'equals':
      return Math.abs(value - threshold) < 0.01;
    case 'lessThanOrEqual':
      return value <= threshold;
    case 'greaterThanOrEqual':
      return value >= threshold;
    default:
      return false;
  }
};

/**
 * Detect combo signals in candle data
 * @param {string} comboId - Combo signal ID
 * @param {Array} candles - Candle data array
 * @returns {Array} Array of detected combo signals with time, price, and indicator values
 */
export const detectComboSignal = (comboId, candles) => {
  const combo = getComboSignal(comboId);
  if (!combo) {
    console.warn(`Combo signal not found: ${comboId}`);
    return [];
  }

  const { pattern, indicator } = combo;
  const signals = [];

  // Detect all patterns
  const detectedPatterns = detectPattern(pattern, candles);
  
  console.log(`Detected ${detectedPatterns.length} ${pattern} patterns`);

  // For each pattern, check if indicator condition is met
  detectedPatterns.forEach(patternData => {
    const patternIndex = patternData.index;
    if (patternIndex === undefined) return;

    // Get indicator value at pattern index
    const indicatorValue = getIndicatorValueAtIndex(
      indicator.type,
      candles,
      indicator.period,
      patternIndex
    );

    console.log(`Pattern at index ${patternIndex}, ${indicator.type} = ${indicatorValue}`);

    // Check if indicator condition is met
    if (checkIndicatorCondition(indicatorValue, indicator.condition, indicator.threshold)) {
      signals.push({
        comboId,
        time: patternData.time,
        index: patternIndex,
        patternName: pattern,
        indicatorType: indicator.type,
        indicatorValue: indicatorValue,
        indicatorThreshold: indicator.threshold,
        price: patternData.close,
        candle: candles[patternIndex]
      });
      console.log(`✅ Combo signal found at ${patternData.time}, RSI=${indicatorValue}`);
    }
  });

  return signals;
};

/**
 * Detect all active combo signals
 * @param {Array} activeComboIds - Array of active combo IDs
 * @param {Array} candles - Candle data array
 * @returns {Object} Map of comboId -> signals
 */
export const detectAllActiveComboSignals = (activeComboIds, candles) => {
  const results = {};
  
  activeComboIds.forEach(comboId => {
    results[comboId] = detectComboSignal(comboId, candles);
  });
  
  return results;
};

/**
 * Evaluate a single signal for backtest
 * @param {Object} signal - Signal object
 * @param {Array} candles - All candle data
 * @param {Object} prediction - Prediction settings
 * @returns {Object} Evaluation result
 */
const evaluateSignal = (signal, candles, prediction) => {
  const { index, time, price, candle } = signal;
  const { direction, timeframe, targetGain, stopLoss } = prediction;
  
  const entryPrice = candle.close;
  const targetPrice = direction === 'bullish' 
    ? entryPrice * (1 + targetGain / 100)
    : entryPrice * (1 - targetGain / 100);
  const stopPrice = direction === 'bullish'
    ? entryPrice * (1 - stopLoss / 100)
    : entryPrice * (1 + stopLoss / 100);

  let result = 'neutral'; // neutral, success, failure
  let exitIndex = null;
  let exitPrice = null;
  let exitTime = null;
  let maxGain = 0;
  let maxLoss = 0;

  // Evaluate next N candles
  for (let i = 1; i <= timeframe && (index + i) < candles.length; i++) {
    const futureCandle = candles[index + i];
    const currentHigh = futureCandle.high;
    const currentLow = futureCandle.low;
    const currentClose = futureCandle.close;

    if (direction === 'bullish') {
      // Track max gain
      const gain = ((currentHigh - entryPrice) / entryPrice) * 100;
      const loss = ((entryPrice - currentLow) / entryPrice) * 100;
      maxGain = Math.max(maxGain, gain);
      maxLoss = Math.max(maxLoss, loss);

      // Check stop loss first
      if (currentLow <= stopPrice) {
        result = 'failure';
        exitIndex = index + i;
        exitPrice = stopPrice;
        exitTime = futureCandle.time;
        break;
      }
      // Check target
      if (currentHigh >= targetPrice) {
        result = 'success';
        exitIndex = index + i;
        exitPrice = targetPrice;
        exitTime = futureCandle.time;
        break;
      }
    } else {
      // Bearish direction
      const gain = ((entryPrice - currentLow) / entryPrice) * 100;
      const loss = ((currentHigh - entryPrice) / entryPrice) * 100;
      maxGain = Math.max(maxGain, gain);
      maxLoss = Math.max(maxLoss, loss);

      // Check stop loss first
      if (currentHigh >= stopPrice) {
        result = 'failure';
        exitIndex = index + i;
        exitPrice = stopPrice;
        exitTime = futureCandle.time;
        break;
      }
      // Check target
      if (currentLow <= targetPrice) {
        result = 'success';
        exitIndex = index + i;
        exitPrice = targetPrice;
        exitTime = futureCandle.time;
        break;
      }
    }
  }

  return {
    signalTime: time,
    signalIndex: index,
    entryPrice,
    targetPrice,
    stopPrice,
    result,
    exitTime,
    exitIndex,
    exitPrice,
    maxGain: maxGain.toFixed(2),
    maxLoss: maxLoss.toFixed(2),
    indicatorValue: signal.indicatorValue,
    daysHeld: exitIndex ? exitIndex - index : timeframe
  };
};

/**
 * Run backtest for a combo signal
 * @param {string} comboId - Combo signal ID
 * @param {Array} candles - Candle data array
 * @param {number} lookbackMonths - Number of months to lookback (default 3)
 * @returns {Object} Backtest results
 */
export const runBacktest = (comboId, candles, lookbackMonths = 3) => {
  const combo = getComboSignal(comboId);
  if (!combo) {
    return { error: 'Combo signal not found' };
  }

  // Calculate lookback start date
  const now = new Date();
  const lookbackDate = new Date(now.setMonth(now.getMonth() - lookbackMonths));
  const lookbackDateStr = lookbackDate.toISOString().split('T')[0];

  // Filter candles within lookback period
  const filteredCandles = candles.filter(c => c.time >= lookbackDateStr);
  
  if (filteredCandles.length < 20) {
    return { 
      error: 'Không đủ dữ liệu trong khoảng thời gian này',
      totalCandles: filteredCandles.length 
    };
  }

  // Use the start index in original array for proper indicator calculation
  const startIndexInOriginal = candles.findIndex(c => c.time === filteredCandles[0].time);

  // Detect signals
  const signals = detectComboSignal(comboId, candles);
  
  // Filter signals within lookback period
  const filteredSignals = signals.filter(s => s.time >= lookbackDateStr);

  // Evaluate each signal
  const evaluations = filteredSignals.map(signal => 
    evaluateSignal(signal, candles, combo.prediction)
  );

  // Calculate statistics
  const totalSignals = evaluations.length;
  const successCount = evaluations.filter(e => e.result === 'success').length;
  const failureCount = evaluations.filter(e => e.result === 'failure').length;
  const neutralCount = evaluations.filter(e => e.result === 'neutral').length;

  const successRate = totalSignals > 0 ? ((successCount / totalSignals) * 100).toFixed(1) : 0;
  const failureRate = totalSignals > 0 ? ((failureCount / totalSignals) * 100).toFixed(1) : 0;
  const neutralRate = totalSignals > 0 ? ((neutralCount / totalSignals) * 100).toFixed(1) : 0;

  // Calculate average gains/losses
  const avgMaxGain = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + parseFloat(e.maxGain), 0) / evaluations.length).toFixed(2)
    : 0;
  const avgMaxLoss = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + parseFloat(e.maxLoss), 0) / evaluations.length).toFixed(2)
    : 0;

  return {
    comboId,
    comboName: combo.name,
    prediction: combo.prediction,
    lookbackMonths,
    lookbackDateStr,
    totalCandles: filteredCandles.length,
    totalSignals,
    successCount,
    failureCount,
    neutralCount,
    successRate,
    failureRate,
    neutralRate,
    avgMaxGain,
    avgMaxLoss,
    evaluations,
    signals: filteredSignals.map(s => ({
      time: s.time,
      price: s.price,
      indicatorValue: s.indicatorValue,
      index: s.index
    }))
  };
};

/**
 * Check for real-time combo signals on the latest candle
 * @param {Array} activeComboIds - Array of active combo IDs
 * @param {Array} candles - All candle data
 * @returns {Array} Array of triggered signals on the latest candle
 */
export const checkRealtimeSignals = (activeComboIds, candles) => {
  if (!candles || candles.length < 15) return [];
  
  const triggeredSignals = [];
  const latestIndex = candles.length - 1;
  const latestTime = candles[latestIndex].time;

  activeComboIds.forEach(comboId => {
    const signals = detectComboSignal(comboId, candles);
    
    // Check if any signal is on the latest candle
    const latestSignal = signals.find(s => s.time === latestTime || s.index === latestIndex);
    
    if (latestSignal) {
      const combo = getComboSignal(comboId);
      triggeredSignals.push({
        ...latestSignal,
        comboName: combo.name,
        comboIcon: combo.icon,
        comboColor: combo.color,
        sentiment: combo.sentiment
      });
    }
  });

  return triggeredSignals;
};

/**
 * Generate chart markers for combo signals
 * @param {Array} signals - Array of combo signals
 * @param {Object} combo - Combo definition
 * @returns {Array} Array of chart markers
 */
export const generateComboSignalMarkers = (signals, combo) => {
  return signals.map(signal => ({
    time: signal.time,
    position: combo.sentiment === 'bullish' ? 'belowBar' : 'aboveBar',
    color: combo.color,
    shape: combo.sentiment === 'bullish' ? 'arrowUp' : 'arrowDown',
    text: combo.icon,
    size: 2,
    comboId: combo.id,
    comboName: combo.name
  }));
};

/**
 * Generate backtest result markers for chart
 * @param {Object} backtestResult - Backtest result object
 * @returns {Array} Array of chart markers with evaluation info
 */
export const generateBacktestMarkers = (backtestResult) => {
  const { evaluations, comboId } = backtestResult;
  const combo = getComboSignal(comboId);
  
  return evaluations.map(evaluation => {
    let markerColor = '#FEB019'; // Neutral - yellow
    let markerText = '○'; // Neutral
    
    if (evaluation.result === 'success') {
      markerColor = '#00E396'; // Green
      markerText = '✓';
    } else if (evaluation.result === 'failure') {
      markerColor = '#FF4560'; // Red
      markerText = '✗';
    }
    
    return {
      time: evaluation.signalTime,
      position: combo.sentiment === 'bullish' ? 'belowBar' : 'aboveBar',
      color: markerColor,
      shape: 'circle',
      text: markerText,
      size: 2,
      result: evaluation.result,
      entryPrice: evaluation.entryPrice,
      exitPrice: evaluation.exitPrice,
      exitTime: evaluation.exitTime,
      indicatorValue: evaluation.indicatorValue
    };
  });
};

export default {
  detectComboSignal,
  detectAllActiveComboSignals,
  runBacktest,
  checkRealtimeSignals,
  generateComboSignalMarkers,
  generateBacktestMarkers
};
