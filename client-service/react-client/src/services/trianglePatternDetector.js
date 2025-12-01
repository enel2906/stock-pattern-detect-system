/**
 * Triangle Pattern Detector
 * Ported from TriangleService.java
 * 
 * Detects three types of triangle patterns:
 * 1. Ascending Triangle: Rising lows, flat highs
 * 2. Descending Triangle: Flat lows, falling highs
 * 3. Symmetrical Triangle: Rising lows, falling highs
 */

import { findAllPivotPoints, filterOverlappingPatterns } from './pivotPointUtils.js';

/**
 * Perform linear regression on x and y arrays
 * @param {number[]} xArray - X values (indices)
 * @param {number[]} yArray - Y values (prices)
 * @returns {{ slope: number, intercept: number, rSquared: number, rValue: number }}
 */
function linearRegression(xArray, yArray) {
  const n = xArray.length;
  if (n === 0 || n !== yArray.length) {
    throw new Error('Arrays must be non-empty and same length');
  }

  const sumX = xArray.reduce((a, b) => a + b, 0);
  const sumY = yArray.reduce((a, b) => a + b, 0);
  const sumXY = xArray.reduce((sum, x, i) => sum + x * yArray[i], 0);
  const sumXX = xArray.reduce((sum, x) => sum + x * x, 0);
  const sumYY = yArray.reduce((sum, y) => sum + y * y, 0);

  const meanX = sumX / n;
  const meanY = sumY / n;

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = meanY - slope * meanX;

  // Calculate R-squared
  const ssRes = yArray.reduce((sum, y, i) => {
    const predicted = slope * xArray[i] + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);

  const ssTot = yArray.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  const rValue = Math.sqrt(Math.abs(rSquared)) * (rSquared >= 0 ? 1 : -1);

  return { slope, intercept, rSquared, rValue };
}

/**
 * Detect Triangle patterns (Ascending, Descending, Symmetrical)
 * 
 * @param {Array} candleData - Array of candle data with OHLC
 * @param {Object} options - Detection options
 * @returns {Array} Array of detected patterns
 */
export function detectTrianglePatterns(
  candleData,
  options = {}
) {
  const {
    lookback = 25,
    minPoints = 3,
    rlimit = 0.9,
    slmaxLimit = 0.00001,
    slminLimit = 0.00001,
    triangleType = 'all', // 'ascending', 'descending', 'symmetrical', 'all'
  } = options;

  const patterns = [];

  // Find pivot points with 2-bar lookback
  const dataWithPivots = findAllPivotPoints(candleData, 2, 2);

  // Loop through each candle to find triangle pattern
  for (let candleIdx = lookback; candleIdx < dataWithPivots.length; candleIdx++) {
    const maxima = [];
    const minima = [];
    const xxmin = [];
    const xxmax = [];

    // Collect pivot points in lookback window
    for (let i = candleIdx - lookback; i <= candleIdx; i++) {
      const data = dataWithPivots[i];
      if (data.pivot === -1) {
        // pivot low
        minima.push(data.low);
        xxmin.push(i);
      }
      if (data.pivot === 1) {
        // pivot high
        maxima.push(data.high);
        xxmax.push(i);
      }
    }

    // Check if we have enough pivot points
    if (
      (xxmax.length < minPoints && xxmin.length < minPoints) ||
      xxmax.length === 0 ||
      xxmin.length === 0
    ) {
      continue;
    }

    // Run linear regression
    let minRegression, maxRegression;
    try {
      minRegression = linearRegression(xxmin, minima);
      maxRegression = linearRegression(xxmax, maxima);
    } catch (e) {
      // Not enough data for regression
      continue;
    }

    const slmin = minRegression.slope;
    const intercmin = minRegression.intercept;
    const rmin = Math.abs(minRegression.rValue);

    const slmax = maxRegression.slope;
    const intercmax = maxRegression.intercept;
    const rmax = Math.abs(maxRegression.rValue);

    // Build time-based data for rendering
    const triangleHighsData = xxmax.map((idx) => ({
      index: idx,
      time: dataWithPivots[idx].time,
      value: dataWithPivots[idx].high,
    }));

    const triangleLowsData = xxmin.map((idx) => ({
      index: idx,
      time: dataWithPivots[idx].time,
      value: dataWithPivots[idx].low,
    }));

    // Check pattern type and create pattern if match
    let detectedPattern = null;

    if (triangleType === 'symmetrical' || triangleType === 'all') {
      // Symmetrical: slmin rising, slmax falling
      if (
        rmax >= rlimit &&
        rmin >= rlimit &&
        slmin >= slminLimit &&
        slmax <= -1 * slmaxLimit
      ) {
        detectedPattern = {
          candleIndex: candleIdx,
          triangleType: 'symmetrical',
          highIndices: [...xxmax],
          lowIndices: [...xxmin],
          triangleHighsData,
          triangleLowsData,
          slopeMax: slmax,
          slopeMin: slmin,
          interceptMin: intercmin,
          interceptMax: intercmax,
          rSquaredMax: rmax * rmax,
          rSquaredMin: rmin * rmin,
          patternType: 'triangle',
        };
        patterns.push(detectedPattern);
      }
    }

    if (triangleType === 'ascending' || triangleType === 'all') {
      // Ascending: slmin rising, slmax nearly flat
      if (
        rmax >= rlimit &&
        rmin >= rlimit &&
        slmin >= slminLimit &&
        slmax >= -1 * slmaxLimit &&
        slmax <= slmaxLimit
      ) {
        detectedPattern = {
          candleIndex: candleIdx,
          triangleType: 'ascending',
          highIndices: [...xxmax],
          lowIndices: [...xxmin],
          triangleHighsData,
          triangleLowsData,
          slopeMax: slmax,
          slopeMin: slmin,
          interceptMin: intercmin,
          interceptMax: intercmax,
          rSquaredMax: rmax * rmax,
          rSquaredMin: rmin * rmin,
          patternType: 'triangle',
        };
        patterns.push(detectedPattern);
      }
    }

    if (triangleType === 'descending' || triangleType === 'all') {
      // Descending: slmax falling, slmin nearly flat
      if (
        rmax >= rlimit &&
        rmin >= rlimit &&
        slmax <= -1 * slmaxLimit &&
        slmin >= -1 * slminLimit &&
        slmin <= slminLimit
      ) {
        detectedPattern = {
          candleIndex: candleIdx,
          triangleType: 'descending',
          highIndices: [...xxmax],
          lowIndices: [...xxmin],
          triangleHighsData,
          triangleLowsData,
          slopeMax: slmax,
          slopeMin: slmin,
          interceptMin: intercmin,
          interceptMax: intercmax,
          rSquaredMax: rmax * rmax,
          rSquaredMin: rmin * rmin,
          patternType: 'triangle',
        };
        patterns.push(detectedPattern);
      }
    }
  }

  // Filter overlapping patterns
  const filtered = filterOverlappingPatterns(patterns, 15);

  return filtered;
}

/**
 * Detect Ascending Triangle patterns only
 */
export function detectAscendingTriangles(candleData, options = {}) {
  return detectTrianglePatterns(candleData, { ...options, triangleType: 'ascending' });
}

/**
 * Detect Descending Triangle patterns only
 */
export function detectDescendingTriangles(candleData, options = {}) {
  return detectTrianglePatterns(candleData, { ...options, triangleType: 'descending' });
}

/**
 * Detect Symmetrical Triangle patterns only
 */
export function detectSymmetricalTriangles(candleData, options = {}) {
  return detectTrianglePatterns(candleData, { ...options, triangleType: 'symmetrical' });
}
