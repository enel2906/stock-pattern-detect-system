/**
 * Head and Shoulders Pattern Detector
 * Ported from HeadAndShouldersService.java
 * 
 * Pattern structure: Left Shoulder → Left Neckline → Head → Right Neckline → Right Shoulder
 * - Head must be higher than both shoulders
 * - Neckline (connecting two lows) must be relatively flat
 * - Uses two pivot intervals: regular (10) and short (5)
 */

import { findAllPivotPoints } from './pivotPointUtils.js';

/**
 * Perform linear regression on x and y arrays
 * @param {number[]} xArray - X values (indices)
 * @param {number[]} yArray - Y values (prices)
 * @returns {{ slope: number, intercept: number, rSquared: number }}
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

  return { slope, intercept, rSquared };
}

/**
 * Find pivot points around a specific candle index
 * Similar to ChartPatternsUtils.findPoints in Java
 * 
 * @param {Array} dataWithPivots - Data with pivot information
 * @param {number} candleIdx - Index of the candle to check around
 * @param {number} lookback - How many candles to look back/forward
 * @returns {Object} Object with maxima/minima arrays and counts
 */
function findPoints(dataWithPivots, candleIdx, lookback) {
  const maxima = [];
  const minima = [];
  const xxmax = [];
  const xxmin = [];

  let minbcount = 0; // minimas before head
  let maxbcount = 0; // maximas before head
  let minacount = 0; // minimas after head
  let maxacount = 0; // maximas after head

  const halfLookback = Math.floor(lookback / 2);
  const idx = candleIdx;

  for (let i = idx - halfLookback; i < idx + halfLookback; i++) {
    if (i < 0 || i >= dataWithPivots.length) {
      continue;
    }

    const data = dataWithPivots[i];

    // Check for pivot high (pivot = 1 in our system)
    if (data.pivot === 1) {
      maxima.push(data.pivotPos);
      xxmax.push(i);
      if (i < idx) {
        maxbcount++;
      } else if (i > idx) {
        maxacount++;
      }
    }

    // Check for pivot low (pivot = -1 in our system)
    if (data.pivot === -1) {
      minima.push(data.pivotPos);
      xxmin.push(i);
      if (i < idx) {
        minbcount++;
      } else if (i > idx) {
        minacount++;
      }
    }
  }

  return {
    maxima,
    minima,
    xxmax,
    xxmin,
    maxacount,
    minacount,
    maxbcount,
    minbcount,
  };
}

/**
 * Find index of maximum value in array
 */
function argmax(arr) {
  if (!arr || arr.length === 0) return -1;
  let maxIdx = 0;
  let maxVal = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > maxVal) {
      maxVal = arr[i];
      maxIdx = i;
    }
  }
  return maxIdx;
}

/**
 * Detect Head and Shoulders patterns
 * 
 * @param {Array} candleData - Array of candle data with OHLC
 * @param {Object} options - Detection options
 * @returns {Array} Array of detected patterns
 */
export function detectHeadAndShoulders(
  candleData,
  options = {}
) {
  const {
    lookback = 60,
    pivotInterval = 10,
    shortPivotInterval = 5,
    headRatioBefore = 1.0002,
    headRatioAfter = 1.0002,
    upperSlmin = 1e-4,
  } = options;

  const patterns = [];

  // Validation
  if (shortPivotInterval <= 0 || pivotInterval <= 0) {
    console.warn('Pivot intervals must be greater than 0');
    return patterns;
  }

  if (shortPivotInterval >= pivotInterval) {
    console.warn('short_pivot_interval must be less than pivot_interval');
    return patterns;
  }

  // Find pivot points with regular interval first
  const dataWithPivots = findAllPivotPoints(
    candleData,
    pivotInterval,
    pivotInterval
  );

  // Then find pivot points with short interval
  // Note: In production, you might want to merge both pivot sets
  // For simplicity, we use the short interval pivots as they're more granular
  const dataWithShortPivots = findAllPivotPoints(
    candleData,
    shortPivotInterval,
    shortPivotInterval
  );

  // Loop through each candle to find head and shoulders pattern
  for (let candleIdx = lookback; candleIdx < dataWithShortPivots.length; candleIdx++) {
    const currentCandle = dataWithShortPivots[candleIdx];

    // Check if it's a pivot high
    if (currentCandle.pivot !== 1) {
      continue;
    }

    // Find pivot points in lookback window
    const points = findPoints(dataWithShortPivots, candleIdx, lookback);

    const { maxima, minima, xxmax, xxmin, maxbcount, minbcount, maxacount, minacount } = points;

    // Check if we have enough pivot points
    if (minbcount < 1 || minacount < 1 || maxbcount < 1 || maxacount < 1) {
      continue;
    }

    // Run linear regression on neckline (minima)
    let minRegression;
    try {
      minRegression = linearRegression(xxmin, minima);
    } catch (e) {
      // Not enough data for regression
      continue;
    }

    const slmin = minRegression.slope;

    // Find head index (highest value)
    const headIdx = argmax(maxima);

    // Skip if head is the last or first value
    if (headIdx >= maxima.length - 1 || headIdx < 1) {
      continue;
    }

    // Check Head and Shoulders conditions
    const isValidPattern =
      // Head higher than left shoulder
      maxima[headIdx] - maxima[headIdx - 1] > 0 &&
      maxima[headIdx] / maxima[headIdx - 1] > headRatioBefore &&
      // Head higher than right shoulder
      maxima[headIdx] - maxima[headIdx + 1] > 0 &&
      maxima[headIdx] / maxima[headIdx + 1] > headRatioAfter &&
      // Neckline slope within limits (relatively flat)
      Math.abs(slmin) <= upperSlmin &&
      // Neckline positions in correct order
      xxmin[0] > xxmax[headIdx - 1] &&
      xxmin[1] < xxmax[headIdx + 1];

    if (isValidPattern) {
      // Build indices array: [left shoulder, left neckline, head, right neckline, right shoulder]
      const patternIndices = [
        xxmax[headIdx - 1], // left shoulder
        xxmin[0], // left neckline
        xxmax[headIdx], // head
        xxmin[1], // right neckline
        xxmax[headIdx + 1], // right shoulder
      ];

      const patternValues = [
        maxima[headIdx - 1],
        minima[0],
        maxima[headIdx],
        minima[1],
        maxima[headIdx + 1],
      ];

      // Build time-based data for rendering
      const patternPointsData = patternIndices.map((idx, i) => ({
        index: idx,
        time: dataWithShortPivots[idx].time,
        value: patternValues[i],
      }));

      patterns.push({
        candleIndex: candleIdx,
        patternIndices,
        patternPoints: patternValues,
        patternPointsData, // Time-based data for rendering
        necklineSlope: slmin,
        lookback,
        patternType: 'head_and_shoulders',
      });
    }
  }

  return patterns;
}

/**
 * Detect Inverse Head and Shoulders patterns
 * This is the bearish counterpart - pattern is upside down
 * 
 * @param {Array} candleData - Array of candle data with OHLC
 * @param {Object} options - Detection options
 * @returns {Array} Array of detected patterns
 */
export function detectInverseHeadAndShoulders(
  candleData,
  options = {}
) {
  const {
    lookback = 60,
    pivotInterval = 10,
    shortPivotInterval = 5,
    headRatioBefore = 1.0002,
    headRatioAfter = 1.0002,
    upperSlmin = 1e-4,
  } = options;

  const patterns = [];

  // Validation
  if (shortPivotInterval <= 0 || pivotInterval <= 0) {
    console.warn('Pivot intervals must be greater than 0');
    return patterns;
  }

  if (shortPivotInterval >= pivotInterval) {
    console.warn('short_pivot_interval must be less than pivot_interval');
    return patterns;
  }

  // Find pivot points
  const dataWithShortPivots = findAllPivotPoints(
    candleData,
    shortPivotInterval,
    shortPivotInterval
  );

  // Loop through each candle to find inverse head and shoulders pattern
  for (let candleIdx = lookback; candleIdx < dataWithShortPivots.length; candleIdx++) {
    const currentCandle = dataWithShortPivots[candleIdx];

    // Check if it's a pivot low (inverse of H&S)
    if (currentCandle.pivot !== -1) {
      continue;
    }

    // Find pivot points in lookback window
    const points = findPoints(dataWithShortPivots, candleIdx, lookback);

    const { maxima, minima, xxmax, xxmin, maxbcount, minbcount, maxacount, minacount } = points;

    // Check if we have enough pivot points
    if (minbcount < 1 || minacount < 1 || maxbcount < 1 || maxacount < 1) {
      continue;
    }

    // Run linear regression on neckline (maxima for inverse)
    let maxRegression;
    try {
      maxRegression = linearRegression(xxmax, maxima);
    } catch (e) {
      // Not enough data for regression
      continue;
    }

    const slmax = maxRegression.slope;

    // Find head index (lowest value for inverse)
    const headIdx = minima.indexOf(Math.min(...minima));

    // Skip if head is the last or first value
    if (headIdx >= minima.length - 1 || headIdx < 1) {
      continue;
    }

    // Check Inverse Head and Shoulders conditions
    const isValidPattern =
      // Head lower than left shoulder
      minima[headIdx - 1] - minima[headIdx] > 0 &&
      minima[headIdx - 1] / minima[headIdx] > headRatioBefore &&
      // Head lower than right shoulder
      minima[headIdx + 1] - minima[headIdx] > 0 &&
      minima[headIdx + 1] / minima[headIdx] > headRatioAfter &&
      // Neckline slope within limits (relatively flat)
      Math.abs(slmax) <= upperSlmin &&
      // Neckline positions in correct order
      xxmax[0] > xxmin[headIdx - 1] &&
      xxmax[1] < xxmin[headIdx + 1];

    if (isValidPattern) {
      // Build indices array: [left shoulder, left neckline, head, right neckline, right shoulder]
      const patternIndices = [
        xxmin[headIdx - 1], // left shoulder
        xxmax[0], // left neckline
        xxmin[headIdx], // head
        xxmax[1], // right neckline
        xxmin[headIdx + 1], // right shoulder
      ];

      const patternValues = [
        minima[headIdx - 1],
        maxima[0],
        minima[headIdx],
        maxima[1],
        minima[headIdx + 1],
      ];

      // Build time-based data for rendering
      const patternPointsData = patternIndices.map((idx, i) => ({
        index: idx,
        time: dataWithShortPivots[idx].time,
        value: patternValues[i],
      }));

      patterns.push({
        candleIndex: candleIdx,
        patternIndices,
        patternPoints: patternValues,
        patternPointsData, // Time-based data for rendering
        necklineSlope: slmax,
        lookback,
        patternType: 'inverse_head_and_shoulders',
      });
    }
  }

  return patterns;
}
