/**
 * Advance Signal Service
 * Service xử lý logic phát hiện combo tín hiệu và backtest
 */

import { calculateRSI, calculateMACD, calculateBollingerBands, calculateVolumeSpike, calculateMASlope, calculatePriceVsMA, calculateATR } from './technicalIndicators';
import { 
  detectHammer, 
  detectInvertedHammer, 
  detectShootingStar, 
  detectHangingMan,
  detectBullishEngulfing,
  detectBearishEngulfing,
  detectDragonflyDoji,
  detectGravestoneDoji,
  detectDoji
} from './candlePatternDetector';
import { detectMorningStar, detectEveningStar, detectThreeWhiteSoldiers, detectThreeBlackCrows } from './candlePatternDetectorPart2';
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
  'doji': detectDoji,
  'three_white_soldiers': detectThreeWhiteSoldiers,
  'three_black_crows': detectThreeBlackCrows,
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
 * @param {Object} indicatorConfig - Additional indicator configuration
 * @returns {number|Object|null} Indicator value or null
 */
const getIndicatorValueAtIndex = (indicatorType, candles, period, targetIndex, indicatorConfig = {}) => {
  if (indicatorType === 'rsi') {
    const rsiData = calculateRSI(candles, period);
    // RSI data starts from index = period
    const rsiIndex = targetIndex - period;
    if (rsiIndex >= 0 && rsiIndex < rsiData.length) {
      return rsiData[rsiIndex].value;
    }
  } else if (indicatorType === 'macd_crossover') {
    const { fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = indicatorConfig;
    const macdData = calculateMACD(candles, fastPeriod, slowPeriod, signalPeriod);
    
    if (!macdData.macd.length || !macdData.signal.length) return null;
    
    // Find the MACD and Signal values at targetIndex
    const targetTime = candles[targetIndex]?.time;
    const currentMacdIdx = macdData.macd.findIndex(m => m.time === targetTime);
    const currentSignalIdx = macdData.signal.findIndex(s => s.time === targetTime);
    
    if (currentMacdIdx < 1 || currentSignalIdx < 1) return null;
    
    // Get current and previous values
    const macdNow = macdData.macd[currentMacdIdx]?.value;
    const macdPrev = macdData.macd[currentMacdIdx - 1]?.value;
    const signalNow = macdData.signal[currentSignalIdx]?.value;
    const signalPrev = macdData.signal[currentSignalIdx - 1]?.value;
    
    if (macdNow === undefined || macdPrev === undefined || 
        signalNow === undefined || signalPrev === undefined) return null;
    
    return {
      macdNow,
      macdPrev,
      signalNow,
      signalPrev,
      crossUp: macdPrev < signalPrev && macdNow >= signalNow,
      crossDown: macdPrev > signalPrev && macdNow <= signalNow
    };
  } else if (indicatorType === 'bollinger_squeeze') {
    const { period: bbPeriod = 20, stdDev = 2 } = indicatorConfig;
    const bbData = calculateBollingerBands(candles, bbPeriod, stdDev);
    
    if (!bbData.upper.length || !bbData.middle.length || !bbData.lower.length) return null;
    
    // Find the BB values at targetIndex
    const targetTime = candles[targetIndex]?.time;
    const bbIndex = bbData.upper.findIndex(u => u.time === targetTime);
    
    if (bbIndex < 0) return null;
    
    const upper = bbData.upper[bbIndex]?.value;
    const middle = bbData.middle[bbIndex]?.value;
    const lower = bbData.lower[bbIndex]?.value;
    
    if (upper === undefined || middle === undefined || lower === undefined || middle === 0) return null;
    
    // Calculate bandwidth: (Upper - Lower) / Middle * 100
    const bandwidth = ((upper - lower) / middle) * 100;
    
    return {
      upper,
      middle,
      lower,
      bandwidth,
      isSqueeze: bandwidth <= (indicatorConfig.threshold || 5)
    };
  } else if (indicatorType === 'volume_spike') {
    // Volume Spike indicator
    const volumePeriod = indicatorConfig.period || period || 20;
    const volumeData = calculateVolumeSpike(candles, volumePeriod);
    
    if (!volumeData.length) return null;
    
    // Find the volume data at targetIndex
    const targetTime = candles[targetIndex]?.time;
    const volIndex = volumeData.findIndex(v => v.time === targetTime);
    
    if (volIndex < 0) return null;
    
    const volData = volumeData[volIndex];
    
    return {
      currentVolume: volData.value,
      avgVolume: volData.avgVolume,
      spikeRatio: volData.spikeRatio,
      isSpike: volData.spikeRatio >= (indicatorConfig.threshold || 2)
    };
  } else if (indicatorType === 'ma_slope') {
    // MA Slope indicator - checks if MA is trending up or down
    const { maType = 'sma', period: maPeriod = 50 } = indicatorConfig;
    const slopeData = calculateMASlope(candles, maType, maPeriod, 5);
    
    if (!slopeData.length) return null;
    
    // Find the slope data at targetIndex
    const targetTime = candles[targetIndex]?.time;
    const slopeIndex = slopeData.findIndex(s => s.time === targetTime);
    
    if (slopeIndex < 0) return null;
    
    const sData = slopeData[slopeIndex];
    
    return {
      maValue: sData.value,
      slope: sData.slope,
      slopeUp: sData.slopeUp,
      slopeDown: sData.slopeDown
    };
  } else if (indicatorType === 'price_vs_ma') {
    // Price vs MA relationship
    const { maType = 'sma', period: maPeriod = 20 } = indicatorConfig;
    const priceMAData = calculatePriceVsMA(candles, maType, maPeriod);
    
    if (!priceMAData.length) return null;
    
    // Find the price vs MA data at targetIndex
    const targetTime = candles[targetIndex]?.time;
    const priceMAIndex = priceMAData.findIndex(p => p.time === targetTime);
    
    if (priceMAIndex < 0) return null;
    
    const pmaData = priceMAData[priceMAIndex];
    
    return {
      close: pmaData.close,
      maValue: pmaData.maValue,
      distancePercent: pmaData.distancePercent,
      touchedMA: pmaData.touchedMA,
      isNearMA: pmaData.isNearMA,
      isAboveMA: pmaData.isAboveMA,
      isBelowMA: pmaData.isBelowMA,
      nearOrAbove: pmaData.nearOrAbove
    };
  }
  return null;
};

/**
 * Check if indicator condition is met
 * @param {number|Object} value - Indicator value
 * @param {string} condition - Condition type (lessThan, greaterThan, crossUp, crossDown, squeeze, slopeUp, slopeDown, nearOrAbove, greaterThanMultiple)
 * @param {number} threshold - Threshold value
 * @returns {boolean}
 */
const checkIndicatorCondition = (value, condition, threshold) => {
  if (value === null || value === undefined) return false;
  
  switch (condition) {
    case 'lessThan':
      return typeof value === 'number' && value < threshold;
    case 'greaterThan':
      return typeof value === 'number' && value > threshold;
    case 'equals':
      return typeof value === 'number' && Math.abs(value - threshold) < 0.01;
    case 'lessThanOrEqual':
      return typeof value === 'number' && value <= threshold;
    case 'greaterThanOrEqual':
      return typeof value === 'number' && value >= threshold;
    case 'crossUp':
      return typeof value === 'object' && value.crossUp === true;
    case 'crossDown':
      return typeof value === 'object' && value.crossDown === true;
    case 'squeeze':
      return typeof value === 'object' && value.isSqueeze === true;
    // New conditions for advanced combos
    case 'slopeUp':
      return typeof value === 'object' && value.slopeUp === true;
    case 'slopeDown':
      return typeof value === 'object' && value.slopeDown === true;
    case 'nearOrAbove':
      // Price is near or above MA (within threshold % below MA, or above)
      return typeof value === 'object' && value.nearOrAbove === true;
    case 'nearMA':
      return typeof value === 'object' && value.isNearMA === true;
    case 'aboveMA':
      return typeof value === 'object' && value.isAboveMA === true;
    case 'belowMA':
      return typeof value === 'object' && value.isBelowMA === true;
    case 'touchedMA':
      return typeof value === 'object' && value.touchedMA === true;
    case 'greaterThanMultiple':
      // For volume spike: spikeRatio >= threshold
      return typeof value === 'object' && value.spikeRatio >= threshold;
    case 'isSpike':
      return typeof value === 'object' && value.isSpike === true;
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

  const { pattern, indicators } = combo;
  const signals = [];

  // Detect all patterns
  const detectedPatterns = detectPattern(pattern, candles);
  
  console.log(`Detected ${detectedPatterns.length} ${pattern} patterns`);

  // For each pattern, check if ALL indicator conditions are met
  detectedPatterns.forEach(patternData => {
    const patternIndex = patternData.index;
    if (patternIndex === undefined) return;

    // Check all indicators
    const indicatorResults = [];
    let allConditionsMet = true;

    for (const indicator of indicators) {
      // Get indicator value at pattern index
      const indicatorValue = getIndicatorValueAtIndex(
        indicator.type,
        candles,
        indicator.period || 14,
        patternIndex,
        indicator // Pass full config for MACD and Bollinger
      );

      const conditionMet = checkIndicatorCondition(
        indicatorValue, 
        indicator.condition, 
        indicator.threshold
      );

      indicatorResults.push({
        type: indicator.type,
        value: indicatorValue,
        threshold: indicator.threshold,
        condition: indicator.condition,
        met: conditionMet
      });

      if (!conditionMet) {
        allConditionsMet = false;
        break;
      }
    }

    console.log(`Pattern at index ${patternIndex}, indicators:`, indicatorResults);

    // Check if ALL indicator conditions are met
    if (allConditionsMet) {
      signals.push({
        comboId,
        time: patternData.time,
        index: patternIndex,
        patternName: pattern,
        indicators: indicatorResults,
        price: patternData.close,
        candle: candles[patternIndex]
      });
      console.log(`✅ Combo signal found at ${patternData.time}`, indicatorResults);
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
 * Uses ATR-based stop/target for adaptive volatility management
 * Falls back to percentage-based if ATR cannot be calculated
 * @param {Object} signal - Signal object
 * @param {Array} candles - All candle data
 * @param {Object} prediction - Prediction settings
 * @param {Array} atrData - Pre-calculated ATR(14) data (optional, will calculate if not provided)
 * @returns {Object} Evaluation result
 */
const evaluateSignal = (signal, candles, prediction, atrData = null) => {
  const { index, time, price, candle } = signal;
  const { direction, timeframe, targetGain, stopLoss } = prediction;
  
  const entryPrice = candle.close;
  const isNeutral = direction === 'neutral';
  
  // ATR-based risk management
  let atrValue = null;
  let stopPrice = null;
  let targetPrice = null;
  let usedRiskModel = 'PERCENT'; // Default to percent-based
  let fallbackToPercent = false;
  let riskRewardRatio = null;
  
  // Try to get ATR value at signal time
  if (atrData && atrData.length > 0) {
    const atrEntry = atrData.find(a => a.time === time);
    if (atrEntry) {
      atrValue = atrEntry.value;
    }
  } else {
    // Calculate ATR if not provided
    const calculatedATR = calculateATR(candles, 14);
    if (calculatedATR.length > 0) {
      const atrEntry = calculatedATR.find(a => a.time === time);
      if (atrEntry) {
        atrValue = atrEntry.value;
      }
    }
  }
  
  // Determine stop/target based on ATR or fallback to percentage
  let targetPriceUp, targetPriceDown, stopPriceUp, stopPriceDown;
  
  if (atrValue !== null && atrValue > 0 && !isNeutral) {
    // ATR-based stop/target (adaptive to volatility)
    usedRiskModel = 'ATR';
    const atrMultiplierStop = 1.0;
    const atrMultiplierTarget = 2.0;
    
    if (direction === 'bullish') {
      stopPrice = entryPrice - (atrMultiplierStop * atrValue);
      targetPrice = entryPrice + (atrMultiplierTarget * atrValue);
      stopPriceDown = stopPrice;
      targetPriceUp = targetPrice;
      stopPriceUp = null; // Not used for bullish
      targetPriceDown = null; // Not used for bullish
    } else if (direction === 'bearish') {
      stopPrice = entryPrice + (atrMultiplierStop * atrValue);
      targetPrice = entryPrice - (atrMultiplierTarget * atrValue);
      stopPriceUp = stopPrice;
      targetPriceDown = targetPrice;
      stopPriceDown = null; // Not used for bearish
      targetPriceUp = null; // Not used for bearish
    }
    
    // Calculate Risk/Reward ratio
    const riskAmount = Math.abs(entryPrice - stopPrice);
    const rewardAmount = Math.abs(targetPrice - entryPrice);
    riskRewardRatio = riskAmount > 0 ? (rewardAmount / riskAmount).toFixed(2) : null;
    
  } else {
    // Fallback to percentage-based (original logic)
    fallbackToPercent = true;
    usedRiskModel = 'PERCENT';
    
    targetPriceUp = entryPrice * (1 + targetGain / 100);
    targetPriceDown = entryPrice * (1 - targetGain / 100);
    stopPriceUp = entryPrice * (1 + stopLoss / 100);
    stopPriceDown = entryPrice * (1 - stopLoss / 100);
    
    if (direction === 'bullish') {
      stopPrice = stopPriceDown;
      targetPrice = targetPriceUp;
    } else if (direction === 'bearish') {
      stopPrice = stopPriceUp;
      targetPrice = targetPriceDown;
    }
    
    // Calculate Risk/Reward ratio for percent-based
    if (!isNeutral) {
      riskRewardRatio = stopLoss > 0 ? (targetGain / stopLoss).toFixed(2) : null;
    }
  }

  let result = 'neutral'; // neutral, success, failure
  let exitIndex = null;
  let exitPrice = null;
  let exitTime = null;
  let maxGain = 0;
  let maxLoss = 0;
  let breakoutDirection = null;

  // Evaluate next N candles
  for (let i = 1; i <= timeframe && (index + i) < candles.length; i++) {
    const futureCandle = candles[index + i];
    const currentHigh = futureCandle.high;
    const currentLow = futureCandle.low;
    const currentClose = futureCandle.close;

    if (isNeutral) {
      // For neutral (breakout) direction - use percentage-based for neutral
      const neutralTargetUp = entryPrice * (1 + targetGain / 100);
      const neutralTargetDown = entryPrice * (1 - targetGain / 100);
      
      const gainUp = ((currentHigh - entryPrice) / entryPrice) * 100;
      const gainDown = ((entryPrice - currentLow) / entryPrice) * 100;
      maxGain = Math.max(maxGain, gainUp, gainDown);
      maxLoss = Math.min(
        Math.abs(((currentClose - entryPrice) / entryPrice) * 100),
        maxLoss || 999
      );

      // Check for breakout up
      if (currentHigh >= neutralTargetUp) {
        result = 'success';
        exitIndex = index + i;
        exitPrice = neutralTargetUp;
        exitTime = futureCandle.time;
        breakoutDirection = 'up';
        break;
      }
      // Check for breakout down
      if (currentLow <= neutralTargetDown) {
        result = 'success';
        exitIndex = index + i;
        exitPrice = neutralTargetDown;
        exitTime = futureCandle.time;
        breakoutDirection = 'down';
        break;
      }
    } else if (direction === 'bullish') {
      // Track max gain/loss in percentage
      const gain = ((currentHigh - entryPrice) / entryPrice) * 100;
      const loss = ((entryPrice - currentLow) / entryPrice) * 100;
      maxGain = Math.max(maxGain, gain);
      maxLoss = Math.max(maxLoss, loss);

      // Use ATR-based or percent-based stopPriceDown and targetPriceUp
      const effectiveStop = usedRiskModel === 'ATR' ? stopPrice : stopPriceDown;
      const effectiveTarget = usedRiskModel === 'ATR' ? targetPrice : targetPriceUp;

      // Check stop loss first
      if (currentLow <= effectiveStop) {
        result = 'failure';
        exitIndex = index + i;
        exitPrice = effectiveStop;
        exitTime = futureCandle.time;
        break;
      }
      // Check target
      if (currentHigh >= effectiveTarget) {
        result = 'success';
        exitIndex = index + i;
        exitPrice = effectiveTarget;
        exitTime = futureCandle.time;
        break;
      }
    } else {
      // Bearish direction
      const gain = ((entryPrice - currentLow) / entryPrice) * 100;
      const loss = ((currentHigh - entryPrice) / entryPrice) * 100;
      maxGain = Math.max(maxGain, gain);
      maxLoss = Math.max(maxLoss, loss);

      // Use ATR-based or percent-based stopPriceUp and targetPriceDown
      const effectiveStop = usedRiskModel === 'ATR' ? stopPrice : stopPriceUp;
      const effectiveTarget = usedRiskModel === 'ATR' ? targetPrice : targetPriceDown;

      // Check stop loss first
      if (currentHigh >= effectiveStop) {
        result = 'failure';
        exitIndex = index + i;
        exitPrice = effectiveStop;
        exitTime = futureCandle.time;
        break;
      }
      // Check target
      if (currentLow <= effectiveTarget) {
        result = 'success';
        exitIndex = index + i;
        exitPrice = effectiveTarget;
        exitTime = futureCandle.time;
        break;
      }
    }
  }

  // For neutral signals that didn't breakout
  if (isNeutral && result === 'neutral') {
    // Check if the max movement was too small (stayed within ±stopLoss%)
    if (maxGain < stopLoss) {
      result = 'failure'; // No significant breakout
    }
  }

  // Get indicator info for display
  const indicatorInfo = signal.indicators || [];
  const primaryIndicator = indicatorInfo[0];

  return {
    signalTime: time,
    signalIndex: index,
    entryPrice,
    // ATR-based fields
    atrValue: atrValue !== null ? parseFloat(atrValue.toFixed(2)) : null,
    stopPrice: stopPrice !== null ? parseFloat(stopPrice.toFixed(2)) : null,
    targetPrice: targetPrice !== null ? parseFloat(targetPrice.toFixed(2)) : null,
    riskRewardRatio: riskRewardRatio !== null ? parseFloat(riskRewardRatio) : null,
    usedRiskModel,
    fallbackToPercent,
    // Legacy fields for backward compatibility
    targetPriceUp: targetPriceUp !== null ? parseFloat(targetPriceUp?.toFixed(2)) : null,
    targetPriceDown: targetPriceDown !== null ? parseFloat(targetPriceDown?.toFixed(2)) : null,
    stopPriceUp: stopPriceUp !== null ? parseFloat(stopPriceUp?.toFixed(2)) : null,
    stopPriceDown: stopPriceDown !== null ? parseFloat(stopPriceDown?.toFixed(2)) : null,
    // Result fields
    result,
    exitTime,
    exitIndex,
    exitPrice: exitPrice !== null ? parseFloat(exitPrice.toFixed(2)) : null,
    maxGain: maxGain.toFixed(2),
    maxLoss: maxLoss.toFixed(2),
    indicators: indicatorInfo,
    indicatorValue: primaryIndicator?.value,
    breakoutDirection,
    daysHeld: exitIndex ? exitIndex - index : timeframe
  };
};

/**
 * Run backtest for a combo signal
 * Uses ATR-based stop/target for adaptive volatility management
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

  // Pre-calculate ATR(14) for all candles (performance optimization)
  const atrData = calculateATR(candles, 14);

  // Detect signals
  const signals = detectComboSignal(comboId, candles);
  
  // Filter signals within lookback period
  const filteredSignals = signals.filter(s => s.time >= lookbackDateStr);

  // Evaluate each signal with pre-calculated ATR data
  const evaluations = filteredSignals.map(signal => 
    evaluateSignal(signal, candles, combo.prediction, atrData)
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

  // Calculate ATR usage statistics
  const atrUsedCount = evaluations.filter(e => e.usedRiskModel === 'ATR').length;
  const percentUsedCount = evaluations.filter(e => e.usedRiskModel === 'PERCENT').length;
  const avgATR = evaluations.length > 0
    ? evaluations.reduce((sum, e) => sum + (e.atrValue || 0), 0) / evaluations.filter(e => e.atrValue !== null).length
    : null;
  const avgRiskReward = evaluations.length > 0
    ? evaluations.reduce((sum, e) => sum + (e.riskRewardRatio || 0), 0) / evaluations.filter(e => e.riskRewardRatio !== null).length
    : null;

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
    // ATR risk management stats
    riskManagement: {
      atrUsedCount,
      percentUsedCount,
      avgATR: avgATR !== null && !isNaN(avgATR) ? parseFloat(avgATR.toFixed(2)) : null,
      avgRiskReward: avgRiskReward !== null && !isNaN(avgRiskReward) ? parseFloat(avgRiskReward.toFixed(2)) : null
    },
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
 * Includes ATR-based stop/target calculations
 * @param {Array} activeComboIds - Array of active combo IDs
 * @param {Array} candles - All candle data
 * @returns {Array} Array of triggered signals on the latest candle with ATR info
 */
export const checkRealtimeSignals = (activeComboIds, candles) => {
  if (!candles || candles.length < 15) return [];
  
  const triggeredSignals = [];
  const latestIndex = candles.length - 1;
  const latestTime = candles[latestIndex].time;
  
  // Pre-calculate ATR for realtime signals
  const atrData = calculateATR(candles, 14);

  activeComboIds.forEach(comboId => {
    const signals = detectComboSignal(comboId, candles);
    
    // Check if any signal is on the latest candle
    const latestSignal = signals.find(s => s.time === latestTime || s.index === latestIndex);
    
    if (latestSignal) {
      const combo = getComboSignal(comboId);
      const entryPrice = latestSignal.candle?.close || latestSignal.price;
      
      // Get ATR value at signal time
      let atrValue = null;
      let stopPrice = null;
      let targetPrice = null;
      let riskRewardRatio = null;
      let usedRiskModel = 'PERCENT';
      
      const atrEntry = atrData.find(a => a.time === latestTime);
      if (atrEntry && atrEntry.value > 0) {
        atrValue = atrEntry.value;
        usedRiskModel = 'ATR';
        
        const direction = combo.sentiment;
        if (direction === 'bullish') {
          stopPrice = entryPrice - (1.0 * atrValue);
          targetPrice = entryPrice + (2.0 * atrValue);
        } else if (direction === 'bearish') {
          stopPrice = entryPrice + (1.0 * atrValue);
          targetPrice = entryPrice - (2.0 * atrValue);
        }
        
        if (stopPrice && targetPrice) {
          const riskAmount = Math.abs(entryPrice - stopPrice);
          const rewardAmount = Math.abs(targetPrice - entryPrice);
          riskRewardRatio = riskAmount > 0 ? parseFloat((rewardAmount / riskAmount).toFixed(2)) : null;
        }
      } else {
        // Fallback to percent-based
        const { targetGain, stopLoss } = combo.prediction;
        const direction = combo.sentiment;
        
        if (direction === 'bullish') {
          stopPrice = entryPrice * (1 - stopLoss / 100);
          targetPrice = entryPrice * (1 + targetGain / 100);
        } else if (direction === 'bearish') {
          stopPrice = entryPrice * (1 + stopLoss / 100);
          targetPrice = entryPrice * (1 - targetGain / 100);
        }
        riskRewardRatio = stopLoss > 0 ? parseFloat((targetGain / stopLoss).toFixed(2)) : null;
      }
      
      triggeredSignals.push({
        ...latestSignal,
        comboName: combo.name,
        comboIcon: combo.icon,
        comboColor: combo.color,
        sentiment: combo.sentiment,
        // ATR-based risk management
        entryPrice: parseFloat(entryPrice.toFixed(2)),
        atrValue: atrValue !== null ? parseFloat(atrValue.toFixed(2)) : null,
        stopPrice: stopPrice !== null ? parseFloat(stopPrice.toFixed(2)) : null,
        targetPrice: targetPrice !== null ? parseFloat(targetPrice.toFixed(2)) : null,
        riskRewardRatio,
        usedRiskModel
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
 * Includes ATR-based stop/target information
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
      indicatorValue: evaluation.indicatorValue,
      // ATR-based risk management info
      atrValue: evaluation.atrValue,
      stopPrice: evaluation.stopPrice,
      targetPrice: evaluation.targetPrice,
      riskRewardRatio: evaluation.riskRewardRatio,
      usedRiskModel: evaluation.usedRiskModel,
      fallbackToPercent: evaluation.fallbackToPercent
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
