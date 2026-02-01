/**
 * Pennant Pattern Detector
 * Ported from Java: PennantService.java
 * 
 * Algorithm:
 * Pennant is similar to Flag but with CONVERGING trendlines instead of parallel
 * 1. Find pivot highs and lows in lookback window
 * 2. Check if there are minimum required pivot points
 * 3. Run linear regression on both highs and lows
 * 4. Check if lines are converging:
 *    - High trendline should have negative slope (descending)
 *    - Low trendline should have positive slope (ascending)
 *    - Lines must intersect ahead (apex in the future)
 *    - Apex must be within reasonable distance (< 3x lookback)
 * 5. Validate R-squared values meet thresholds
 * 6. Check slope ratio is within limits (0.95-1.0)
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
 * Calculate the intersection point of two lines
 * @param {number} slope1 - Slope of first line
 * @param {number} intercept1 - Intercept of first line
 * @param {number} slope2 - Slope of second line
 * @param {number} intercept2 - Intercept of second line
 * @returns {Object|null} {x, y} coordinates of intersection, or null if parallel
 */
const findIntersection = (slope1, intercept1, slope2, intercept2) => {
  // Check if lines are parallel (slopes are equal)
  if (Math.abs(slope1 - slope2) < 0.0000001) {
    return null;
  }
  
  // Calculate intersection point: y = slope1*x + intercept1 = slope2*x + intercept2
  const x = (intercept2 - intercept1) / (slope1 - slope2);
  const y = slope1 * x + intercept1;
  
  return { x, y };
};

/**
 * Detect Pennant patterns in the data
 * @param {Array} data - OHLCV data [{open, high, low, close, time, volume}]
 * @param {Object} options - Detection options
 * @param {number} options.lookback - Lookback period (default: 20)
 * @param {number} options.minPoints - Minimum pivot points (default: 3)
 * @param {number} options.rMax - R-squared threshold for highs (default: 0.9)
 * @param {number} options.rMin - R-squared threshold for lows (default: 0.9)
 * @param {number} options.slopeMax - Max slope for highs (default: -0.0001, should be negative)
 * @param {number} options.slopeMin - Min slope for lows (default: 0.0001, should be positive)
 * @param {number} options.lowerRatioSlope - Lower ratio limit (default: 0.95)
 * @param {number} options.upperRatioSlope - Upper ratio limit (default: 1.0)
 * @returns {Array} Array of detected Pennant patterns
 */
export const detectPennantPatterns = (data, options = {}) => {
  const {
    lookback = 20,
    minPoints = 3,
    rMax = 0.9,
    rMin = 0.9,
    slopeMax = -0.0001, // Negative for descending upper line
    slopeMin = 0.0001,  // Positive for ascending lower line
    lowerRatioSlope = 0.95,
    upperRatioSlope = 1.0
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
        minima.push(candle.pivotPos); // Use pivotPos for consistency
        xxmin.push(i);
      }
      if (candle.pivot === 1) { // pivot high
        maxima.push(candle.pivotPos); // Use pivotPos for consistency
        xxmax.push(i);
      }
    }

    // Check minimum pivot points requirement
    if ((xxmax.length < minPoints && xxmin.length < minPoints) ||
        xxmax.length === 0 || xxmin.length === 0) {
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

    // Check pennant condition: converging lines
    // slmin must be positive (ascending), slmax must be negative (descending)
    if (rmax >= rMax && rmin >= rMin &&
        slmin >= slopeMin && slmax <= slopeMax) {

      // Calculate intersection point to verify convergence
      const intersection = findIntersection(slmax, intercmax, slmin, intercmin);
      
      // Verify that lines converge ahead (apex should be in the future)
      // and within reasonable distance (not too far away)
      const lastPivotIdx = Math.max(...xxmax, ...xxmin);
      const maxConvergenceDistance = lookback * 3; // Apex should be within 3x lookback
      
      if (intersection && 
          intersection.x > lastPivotIdx && // Apex is ahead (converging forward)
          intersection.x - lastPivotIdx < maxConvergenceDistance) { // Not too far away

        const slopeRatio = Math.abs(slmax / slmin);
        if (slopeRatio > lowerRatioSlope && slopeRatio < upperRatioSlope) {
          
          // Create pivot points data with time for accurate rendering
          const pennantHighsData = xxmax.map((idx, i) => ({
            index: idx,
            time: data[idx].time,
            value: maxima[i]
          }));

          const pennantLowsData = xxmin.map((idx, i) => ({
            index: idx,
            time: data[idx].time,
            value: minima[i]
          }));

          patterns.push({
            candleIndex: candleIdx,
            pennantHighs: [...maxima],
            pennantLows: [...minima],
            pennantHighsIdx: [...xxmax],
            pennantLowsIdx: [...xxmin],
            pennantHighsData: pennantHighsData,
            pennantLowsData: pennantLowsData,
            slopeMax: slmax,
            slopeMin: slmin,
            interceptMin: intercmin,
            interceptMax: intercmax,
            rSquaredMax: rmax,
            rSquaredMin: rmin,
            apexIndex: intersection.x, // Add apex position
            apexPrice: intersection.y, // Add apex price
            patternType: 'pennant',
            direction: 'converging', // Always converging for pennant
            time: data[candleIdx].time
          });
        }
      }
    }
  }

  // Filter overlapping patterns (minimum 15 bars apart)
  return filterOverlappingPatterns(patterns, 15);
};
