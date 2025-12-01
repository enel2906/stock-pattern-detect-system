/**
 * Flag Pattern Detector
 * Ported from Java: FlagPatternService.java
 * 
 * Algorithm:
 * 1. Find pivot highs and lows in lookback window
 * 2. Check if there are minimum required pivot points
 * 3. Verify pivot points are in ascending order (for both highs and lows)
 * 4. Run linear regression on both highs and lows
 * 5. Check if lines are parallel (slope ratio between 0.9-1.05)
 * 6. Validate R-squared values meet thresholds
 * 7. Determine direction (bullish if slopes positive, bearish if negative)
 */

import { findAllPivotPoints, filterOverlappingPatterns } from './pivotPointUtils.js';

/**
 * Calculate linear regression (least squares method)
 * @param {Array} x - X values (indices)
 * @param {Array} y - Y values (prices)
 * @returns {Object} {slope, intercept, rValue}
 */
const linearRegression = (x, y) => {
  const n = x.length;
  if (n === 0 || n !== y.length) {
    throw new Error('Invalid input for linear regression');
  }

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R value (correlation coefficient)
  const meanX = sumX / n;
  const meanY = sumY / n;
  
  const ssXX = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
  const ssYY = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const ssXY = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
  
  const rValue = ssXY / Math.sqrt(ssXX * ssYY);

  return { slope, intercept, rValue };
};

/**
 * Check if pivot points are in ascending order (non-decreasing)
 * @param {Array} minima - Low pivot values
 * @param {Array} maxima - High pivot values
 * @returns {boolean}
 */
const isOrderConditionMet = (minima, maxima) => {
  // Check minima are non-decreasing
  for (let i = 1; i < minima.length; i++) {
    if (minima[i] < minima[i - 1]) {
      return false;
    }
  }

  // Check maxima are non-decreasing
  for (let i = 1; i < maxima.length; i++) {
    if (maxima[i] < maxima[i - 1]) {
      return false;
    }
  }

  return true;
};

/**
 * Detect Flag patterns in the data
 * @param {Array} data - OHLCV data [{open, high, low, close, time, volume}]
 * @param {Object} options - Detection options
 * @param {number} options.lookback - Lookback period (default: 50)
 * @param {number} options.minPoints - Minimum pivot points (default: 5)
 * @param {number} options.rMax - R-squared threshold for highs (default: 0.9)
 * @param {number} options.rMin - R-squared threshold for lows (default: 0.9)
 * @param {number} options.slopeMax - Slope for highs (default: 0)
 * @param {number} options.slopeMin - Slope for lows (default: 0)
 * @param {number} options.lowerRatioSlope - Lower ratio limit (default: 0.9)
 * @param {number} options.upperRatioSlope - Upper ratio limit (default: 1.05)
 * @returns {Array} Array of detected Flag patterns
 */
export const detectFlagPatterns = (data, options = {}) => {
  const {
    lookback = 25,
    minPoints = 5,
    rMax = 0.9,
    rMin = 0.9,
    slopeMax = 0,
    slopeMin = 0,
    lowerRatioSlope = 0.9,
    upperRatioSlope = 1.05
  } = options;

  if (!data || data.length < lookback + 5) {
    return [];
  }

  const patterns = [];

  // Find all pivot points
  const dataWithPivots = findAllPivotPoints(data, 2, 2);

  // Iterate through each candle to find patterns
  for (let candleIdx = lookback; candleIdx < dataWithPivots.length; candleIdx++) {
    const maxima = [];
    const minima = [];
    const xxmax = [];
    const xxmin = [];

    // Collect pivot points in lookback window
    for (let i = candleIdx - lookback; i <= candleIdx; i++) {
      const candle = dataWithPivots[i];
      if (candle.pivot === -1) { // pivot low
        minima.push(candle.low);
        xxmin.push(i);
      }
      if (candle.pivot === 1) { // pivot high
        maxima.push(candle.high);
        xxmax.push(i);
      }
    }

    // Check minimum pivot points requirement
    if ((xxmax.length < minPoints && xxmin.length < minPoints) ||
        xxmax.length === 0 || xxmin.length === 0) {
      continue;
    }

    // Check order condition (non-decreasing)
    if (!isOrderConditionMet(minima, maxima)) {
      continue;
    }

    // Run linear regression
    let minRegression, maxRegression;
    try {
      minRegression = linearRegression(xxmin, minima);
      maxRegression = linearRegression(xxmax, maxima);
    } catch (e) {
      continue; // Not enough data
    }

    const slmin = minRegression.slope;
    const intercmin = minRegression.intercept;
    const rmin = Math.abs(minRegression.rValue);

    const slmax = maxRegression.slope;
    const intercmax = maxRegression.intercept;
    const rmax = Math.abs(maxRegression.rValue);

    // Check parallel lines and slopes
    if (rmax >= rMax && rmin >= rMin &&
        ((slmin > slopeMin && slmax > slopeMax) ||
         (slmin < slopeMin && slmax < slopeMax))) {

      const slopeRatio = slmin / slmax;
      if (slopeRatio > lowerRatioSlope && slopeRatio < upperRatioSlope) {
        // Determine direction
        const direction = (slmin > 0 && slmax > 0) ? 'bullish' : 'bearish';

        // Create pivot points data with time for accurate rendering
        const flagHighsData = xxmax.map((idx, i) => ({
          index: idx,
          time: data[idx].time,
          value: maxima[i]
        }));

        const flagLowsData = xxmin.map((idx, i) => ({
          index: idx,
          time: data[idx].time,
          value: minima[i]
        }));

        patterns.push({
          candleIndex: candleIdx,
          flagHighs: [...maxima],
          flagLows: [...minima],
          flagHighsIdx: [...xxmax],
          flagLowsIdx: [...xxmin],
          flagHighsData: flagHighsData,
          flagLowsData: flagLowsData,
          slopeMax: slmax,
          slopeMin: slmin,
          interceptMin: intercmin,
          interceptMax: intercmax,
          rSquaredMax: rmax,
          rSquaredMin: rmin,
          direction: direction,
          time: data[candleIdx].time
        });
      }
    }
  }

  // Filter overlapping patterns (minimum 20 bars apart)
  return filterOverlappingPatterns(patterns, 20);
};
