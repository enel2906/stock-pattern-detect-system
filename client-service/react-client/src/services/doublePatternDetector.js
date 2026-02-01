/**
 * Double Pattern Detector (Double Tops and Double Bottoms)
 * Ported from Java: DoublePatternService.java
 * 
 * Algorithm:
 * 1. Find all pivot points (highs and lows) using 2-bar left/right lookback
 * 2. For each candle, look back N bars (default 25)
 * 3. Check if exactly 5 pivot points exist in the window
 * 4. Validate pivot point structure:
 *    - Double Tops: P0, P2, P4 must be pivot LOWS, P1, P3 must be pivot HIGHS
 *    - Double Bottoms: P0, P2, P4 must be pivot HIGHS, P1, P3 must be pivot LOWS
 * 5. Validate pattern price conditions:
 *    - Double Tops: P0 < P1, P0 < P3, P2 < P1, P2 < P3, P4 < P1, P4 < P3, P1 > P3, ratio <= 1.01
 *    - Double Bottoms: P0 > P1, P0 > P3, P2 > P1, P2 > P3, P4 > P1, P4 > P3, P1 < P3, ratio >= 0.98
 * 6. Filter overlapping patterns
 */

import { findAllPivotPoints, filterOverlappingPatterns } from './pivotPointUtils.js';

/**
 * Validate pivot types for Double Tops pattern
 * Double Tops requires: P0, P2, P4 = pivot lows (-1), P1, P3 = pivot highs (1)
 * @param {Array} pivotTypes - Array of 5 pivot types (1 for high, -1 for low)
 * @returns {boolean}
 */
const isValidDoubleTopsStructure = (pivotTypes) => {
  return (
    pivotTypes[0] === -1 && // P0 must be pivot low
    pivotTypes[1] === 1 &&  // P1 must be pivot high (first top)
    pivotTypes[2] === -1 && // P2 must be pivot low (valley between tops)
    pivotTypes[3] === 1 &&  // P3 must be pivot high (second top)
    pivotTypes[4] === -1    // P4 must be pivot low
  );
};

/**
 * Validate pivot types for Double Bottoms pattern
 * Double Bottoms requires: P0, P2, P4 = pivot highs (1), P1, P3 = pivot lows (-1)
 * @param {Array} pivotTypes - Array of 5 pivot types (1 for high, -1 for low)
 * @returns {boolean}
 */
const isValidDoubleBottomsStructure = (pivotTypes) => {
  return (
    pivotTypes[0] === 1 &&  // P0 must be pivot high
    pivotTypes[1] === -1 && // P1 must be pivot low (first bottom)
    pivotTypes[2] === 1 &&  // P2 must be pivot high (peak between bottoms)
    pivotTypes[3] === -1 && // P3 must be pivot low (second bottom)
    pivotTypes[4] === 1     // P4 must be pivot high
  );
};

/**
 * Check if pattern is Double Tops
 * Condition: pivots[0] < pivots[1] && pivots[0] < pivots[3] && 
 *           pivots[2] < pivots[1] && pivots[2] < pivots[3] && 
 *           pivots[4] < pivots[1] && pivots[4] < pivots[3] && 
 *           pivots[1] > pivots[3] && pivots[1]/pivots[3] <= topsMaxRatio
 * @param {Array} pivots - Array of 5 pivot values
 * @param {Array} pivotTypes - Array of 5 pivot types (1 for high, -1 for low)
 * @param {number} topsMaxRatio - Max ratio between two tops (default 1.01)
 * @returns {boolean}
 */
const isDoubleTopsPattern = (pivots, pivotTypes, topsMaxRatio = 1.01) => {
  // First check pivot structure (P0, P2, P4 = lows, P1, P3 = highs)
  if (!isValidDoubleTopsStructure(pivotTypes)) {
    return false;
  }
  
  // Then check price relationships
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
 * @param {Array} pivotTypes - Array of 5 pivot types (1 for high, -1 for low)
 * @param {number} bottomsMinRatio - Min ratio between two bottoms (default 0.98)
 * @returns {boolean}
 */
const isDoubleBottomsPattern = (pivots, pivotTypes, bottomsMinRatio = 0.98) => {
  // First check pivot structure (P0, P2, P4 = highs, P1, P3 = lows)
  if (!isValidDoubleBottomsStructure(pivotTypes)) {
    return false;
  }
  
  // Then check price relationships
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
    const pivotTypes = []; // Track pivot types (1 for high, -1 for low)
    
    for (let i = candleIdx - lookback; i <= candleIdx; i++) {
      if (dataWithPivots[i].pivot !== 0) {
        pivotIndices.push(i);
        pivotValues.push(dataWithPivots[i].pivotPos);
        pivotTypes.push(dataWithPivots[i].pivot); // 1 for high, -1 for low
      }
    }
    
    // Must have exactly 5 pivot points
    if (pivotIndices.length !== 5) {
      continue;
    }

    // Check for Double Tops (with pivot type validation)
    if ((doubleType === 'tops' || doubleType === 'both') && 
        isDoubleTopsPattern(pivotValues, pivotTypes, topsMaxRatio)) {
      // Create pivot points with time data for accurate rendering
      const pivotPointsData = pivotIndices.map((idx, i) => ({
        index: idx,
        time: data[idx].time,
        value: pivotValues[i],
        pivotType: pivotTypes[i] // Include pivot type for debugging
      }));
      
      patterns.push({
        candleIndex: candleIdx,
        doubleType: 'tops',
        pivotIndices: [...pivotIndices],
        pivotPoints: [...pivotValues],
        pivotTypes: [...pivotTypes], // Include pivot types in output
        pivotPointsData: pivotPointsData, // Added: time-based data for rendering
        ratio: pivotValues[1] / pivotValues[3],
        time: data[candleIdx].time
      });
    }

    // Check for Double Bottoms (with pivot type validation)
    if ((doubleType === 'bottoms' || doubleType === 'both') && 
        isDoubleBottomsPattern(pivotValues, pivotTypes, bottomsMinRatio)) {
      // Create pivot points with time data for accurate rendering
      const pivotPointsData = pivotIndices.map((idx, i) => ({
        index: idx,
        time: data[idx].time,
        value: pivotValues[i],
        pivotType: pivotTypes[i] // Include pivot type for debugging
      }));
      
      patterns.push({
        candleIndex: candleIdx,
        doubleType: 'bottoms',
        pivotIndices: [...pivotIndices],
        pivotPoints: [...pivotValues],
        pivotTypes: [...pivotTypes], // Include pivot types in output
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
