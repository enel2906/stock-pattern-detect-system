/**
 * Double Pattern Detector (Double Tops and Double Bottoms)
 * Ported from Java: DoublePatternService.java
 * 
 * Algorithm:
 * 1. Find all pivot points (highs and lows) using 2-bar left/right lookback
 * 2. For each candle, look back N bars (default 25)
 * 3. Check if exactly 5 pivot points exist in the window
 * 4. Validate pattern conditions:
 *    - Double Tops: P0 < P1, P0 < P3, P2 < P1, P2 < P3, P4 < P1, P4 < P3, P1 > P3, ratio <= 1.01
 *    - Double Bottoms: P0 > P1, P0 > P3, P2 > P1, P2 > P3, P4 > P1, P4 > P3, P1 < P3, ratio >= 0.98
 * 5. Filter overlapping patterns
 */

import { findAllPivotPoints, filterOverlappingPatterns } from './pivotPointUtils.js';

/**
 * Check if pattern is Double Tops
 * Condition: pivots[0] < pivots[1] && pivots[0] < pivots[3] && 
 *           pivots[2] < pivots[1] && pivots[2] < pivots[3] && 
 *           pivots[4] < pivots[1] && pivots[4] < pivots[3] && 
 *           pivots[1] > pivots[3] && pivots[1]/pivots[3] <= topsMaxRatio
 * @param {Array} pivots - Array of 5 pivot values
 * @param {number} topsMaxRatio - Max ratio between two tops (default 1.01)
 * @returns {boolean}
 */
const isDoubleTopsPattern = (pivots, topsMaxRatio = 1.01) => {
  return (
    pivots[0] < pivots[1] &&
    pivots[0] < pivots[3] &&
    pivots[2] < pivots[1] &&
    pivots[2] < pivots[3] &&
    pivots[4] < pivots[1] &&
    pivots[4] < pivots[3] &&
    pivots[1] > pivots[3] &&
    pivots[1] / pivots[3] <= topsMaxRatio
  );
};

/**
 * Check if pattern is Double Bottoms
 * Condition: pivots[0] > pivots[1] && pivots[0] > pivots[3] && 
 *           pivots[2] > pivots[1] && pivots[2] > pivots[3] && 
 *           pivots[4] > pivots[1] && pivots[4] > pivots[3] && 
 *           pivots[1] < pivots[3] && pivots[1]/pivots[3] >= bottomsMinRatio
 * @param {Array} pivots - Array of 5 pivot values
 * @param {number} bottomsMinRatio - Min ratio between two bottoms (default 0.98)
 * @returns {boolean}
 */
const isDoubleBottomsPattern = (pivots, bottomsMinRatio = 0.98) => {
  return (
    pivots[0] > pivots[1] &&
    pivots[0] > pivots[3] &&
    pivots[2] > pivots[1] &&
    pivots[2] > pivots[3] &&
    pivots[4] > pivots[1] &&
    pivots[4] > pivots[3] &&
    pivots[1] < pivots[3] &&
    pivots[1] / pivots[3] >= bottomsMinRatio
  );
};

/**
 * Detect Double patterns (Tops and Bottoms) in the data
 * @param {Array} data - OHLCV data [{open, high, low, close, time, volume}]
 * @param {Object} options - Detection options
 * @param {number} options.lookback - Lookback period (default: 25)
 * @param {string} options.doubleType - Pattern type: "tops", "bottoms", or "both" (default: "both")
 * @param {number} options.topsMaxRatio - Max ratio for tops (default: 1.01)
 * @param {number} options.bottomsMinRatio - Min ratio for bottoms (default: 0.98)
 * @returns {Array} Array of detected patterns
 */
export const detectDoublePatterns = (data, options = {}) => {
  const {
    lookback = 25,
    doubleType = 'both',
    topsMaxRatio = 1.01,
    bottomsMinRatio = 0.98
  } = options;

  if (!data || data.length < lookback + 5) {
    return [];
  }

  const patterns = [];
  
  // Find all pivot points
  const dataWithPivots = findAllPivotPoints(data, 2, 2);

  // Iterate through each candle to find patterns
  for (let candleIdx = lookback; candleIdx < dataWithPivots.length; candleIdx++) {
    // Get pivots in lookback window
    const pivotIndices = [];
    const pivotValues = [];
    
    for (let i = candleIdx - lookback; i <= candleIdx; i++) {
      if (dataWithPivots[i].pivot !== 0) {
        pivotIndices.push(i);
        pivotValues.push(dataWithPivots[i].pivotPos);
      }
    }
    
    // Must have exactly 5 pivot points
    if (pivotIndices.length !== 5) {
      continue;
    }

    // Check for Double Tops
    if ((doubleType === 'tops' || doubleType === 'both') && 
        isDoubleTopsPattern(pivotValues, topsMaxRatio)) {
      // Create pivot points with time data for accurate rendering
      const pivotPointsData = pivotIndices.map((idx, i) => ({
        index: idx,
        time: data[idx].time,
        value: pivotValues[i]
      }));
      
      patterns.push({
        candleIndex: candleIdx,
        doubleType: 'tops',
        pivotIndices: [...pivotIndices],
        pivotPoints: [...pivotValues],
        pivotPointsData: pivotPointsData, // Added: time-based data for rendering
        ratio: pivotValues[1] / pivotValues[3],
        time: data[candleIdx].time
      });
    }

    // Check for Double Bottoms
    if ((doubleType === 'bottoms' || doubleType === 'both') && 
        isDoubleBottomsPattern(pivotValues, bottomsMinRatio)) {
      // Create pivot points with time data for accurate rendering
      const pivotPointsData = pivotIndices.map((idx, i) => ({
        index: idx,
        time: data[idx].time,
        value: pivotValues[i]
      }));
      
      patterns.push({
        candleIndex: candleIdx,
        doubleType: 'bottoms',
        pivotIndices: [...pivotIndices],
        pivotPoints: [...pivotValues],
        pivotPointsData: pivotPointsData, // Added: time-based data for rendering
        ratio: pivotValues[1] / pivotValues[3],
        time: data[candleIdx].time
      });
    }
  }

  // Filter overlapping patterns (minimum 10 bars apart)
  return filterOverlappingPatterns(patterns, 10);
};

/**
 * Detect only Double Top patterns
 * @param {Array} data - OHLCV data
 * @param {Object} options - Detection options
 * @returns {Array} Array of Double Top patterns
 */
export const detectDoubleTops = (data, options = {}) => {
  return detectDoublePatterns(data, { ...options, doubleType: 'tops' });
};

/**
 * Detect only Double Bottom patterns
 * @param {Array} data - OHLCV data
 * @param {Object} options - Detection options
 * @returns {Array} Array of Double Bottom patterns
 */
export const detectDoubleBottoms = (data, options = {}) => {
  return detectDoublePatterns(data, { ...options, doubleType: 'bottoms' });
};
