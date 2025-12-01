/**
 * Pivot Point Utilities
 * Provides functions to find pivot highs and lows in OHLC data
 */

/**
 * Find pivot highs (local maxima) in the data
 * @param {Array} data - Array of OHLCV data with {high, low, open, close, time}
 * @param {number} leftBars - Number of bars to the left
 * @param {number} rightBars - Number of bars to the right
 * @returns {Array} Array of objects {index, value, isPivotHigh: true}
 */
export const findPivotHighs = (data, leftBars = 2, rightBars = 2) => {
  const pivots = [];
  
  for (let i = leftBars; i < data.length - rightBars; i++) {
    let isPivot = true;
    const currentHigh = data[i].high;
    
    // Check left side - all bars must be lower
    for (let j = i - leftBars; j < i; j++) {
      if (data[j].high >= currentHigh) {
        isPivot = false;
        break;
      }
    }
    
    // Check right side - all bars must be lower
    if (isPivot) {
      for (let j = i + 1; j <= i + rightBars; j++) {
        if (data[j].high >= currentHigh) {
          isPivot = false;
          break;
        }
      }
    }
    
    if (isPivot) {
      pivots.push({ 
        index: i, 
        value: currentHigh,
        isPivotHigh: true,
        isPivotLow: false
      });
    }
  }
  
  return pivots;
};

/**
 * Find pivot lows (local minima) in the data
 * @param {Array} data - Array of OHLCV data with {high, low, open, close, time}
 * @param {number} leftBars - Number of bars to the left
 * @param {number} rightBars - Number of bars to the right
 * @returns {Array} Array of objects {index, value, isPivotLow: true}
 */
export const findPivotLows = (data, leftBars = 2, rightBars = 2) => {
  const pivots = [];
  
  for (let i = leftBars; i < data.length - rightBars; i++) {
    let isPivot = true;
    const currentLow = data[i].low;
    
    // Check left side - all bars must be higher
    for (let j = i - leftBars; j < i; j++) {
      if (data[j].low <= currentLow) {
        isPivot = false;
        break;
      }
    }
    
    // Check right side - all bars must be higher
    if (isPivot) {
      for (let j = i + 1; j <= i + rightBars; j++) {
        if (data[j].low <= currentLow) {
          isPivot = false;
          break;
        }
      }
    }
    
    if (isPivot) {
      pivots.push({ 
        index: i, 
        value: currentLow,
        isPivotHigh: false,
        isPivotLow: true
      });
    }
  }
  
  return pivots;
};

/**
 * Find all pivot points (both highs and lows) in the data
 * Returns data with pivot information attached
 * @param {Array} data - Array of OHLCV data
 * @param {number} leftBars - Number of bars to the left
 * @param {number} rightBars - Number of bars to the right
 * @returns {Array} Array with pivot info: {pivot: 1 for high, -1 for low, 0 for none, pivotPos: price}
 */
export const findAllPivotPoints = (data, leftBars = 2, rightBars = 2) => {
  // Create copy of data with pivot info
  const dataWithPivots = data.map(candle => ({
    ...candle,
    pivot: 0,
    pivotPos: null
  }));
  
  // Find pivot highs
  const pivotHighs = findPivotHighs(data, leftBars, rightBars);
  pivotHighs.forEach(pivot => {
    dataWithPivots[pivot.index].pivot = 1;
    dataWithPivots[pivot.index].pivotPos = pivot.value;
  });
  
  // Find pivot lows
  const pivotLows = findPivotLows(data, leftBars, rightBars);
  pivotLows.forEach(pivot => {
    dataWithPivots[pivot.index].pivot = -1;
    dataWithPivots[pivot.index].pivotPos = pivot.value;
  });
  
  return dataWithPivots;
};

/**
 * Filter overlapping patterns based on distance threshold
 * @param {Array} patterns - Array of pattern objects with candleIndex
 * @param {number} minDistance - Minimum distance between patterns (in bars)
 * @returns {Array} Filtered patterns without overlaps
 */
export const filterOverlappingPatterns = (patterns, minDistance = 10) => {
  if (!patterns || patterns.length === 0) return [];
  
  // Sort by candleIndex
  const sorted = [...patterns].sort((a, b) => a.candleIndex - b.candleIndex);
  
  const filtered = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const lastPattern = filtered[filtered.length - 1];
    const currentPattern = sorted[i];
    
    // Check distance
    if (currentPattern.candleIndex - lastPattern.candleIndex >= minDistance) {
      filtered.push(currentPattern);
    }
  }
  
  return filtered;
};
