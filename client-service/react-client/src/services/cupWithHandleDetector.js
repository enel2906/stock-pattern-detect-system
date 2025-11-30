/**
 * Cup with Handle Pattern Detector
 * Based on the algorithm from cup_with_handle.groovy
 * 
 * Algorithm Overview:
 * 1. Find pivot highs (peaks) in the data
 * 2. For each pair of pivot highs (left and right):
 *    - Check if angle between them is within threshold
 *    - Verify no breaking above the top line
 *    - Calculate cup shape using cosine function for smooth curve
 *    - Validate breaks above/below thresholds
 *    - Verify cup dimensions and depth ratios
 * 3. Draw the cup pattern with top and bottom boundaries
 * 4. Identify the handle (consolidation area after right high)
 */

/**
 * Calculate pivot highs in the dataset
 * @param {Array} data - Array of OHLCV data
 * @param {number} left - Left period for pivot
 * @param {number} right - Right period for pivot
 * @returns {Array} Array of pivot points {index, value}
 */
const findPivotHighs = (data, left = 3, right = 1) => {
  const pivots = [];
  
  for (let i = left; i < data.length - right; i++) {
    let isPivot = true;
    const currentHigh = data[i].high;
    
    // Check left side
    for (let j = i - left; j < i; j++) {
      if (data[j].high > currentHigh) {
        isPivot = false;
        break;
      }
    }
    
    // Check right side
    if (isPivot) {
      for (let j = i + 1; j <= i + right; j++) {
        if (data[j].high > currentHigh) {
          isPivot = false;
          break;
        }
      }
    }
    
    if (isPivot) {
      pivots.push({ index: i, value: currentHigh });
    }
  }
  
  return pivots;
};

/**
 * Find the lowest point in a given range
 * @param {Array} data - OHLCV data
 * @param {number} startIdx - Start index
 * @param {number} endIdx - End index
 * @returns {Object} {index, value}
 */
const findLowestInRange = (data, startIdx, endIdx) => {
  let lowestIdx = startIdx;
  let lowestValue = data[startIdx].low;
  
  for (let i = startIdx + 1; i <= endIdx && i < data.length; i++) {
    if (data[i].low < lowestValue) {
      lowestValue = data[i].low;
      lowestIdx = i;
    }
  }
  
  return { index: lowestIdx, value: lowestValue };
};

/**
 * Check if price breaks above a line between two points
 * @param {Array} data - OHLCV data
 * @param {number} x1 - Start index
 * @param {number} y1 - Start value
 * @param {number} x2 - End index
 * @param {number} y2 - End value
 * @returns {boolean} True if any close breaks above the line
 */
const checkBreakAbove = (data, x1, y1, x2, y2) => {
  const slope = (y2 - y1) / (x2 - x1);
  
  for (let i = x1; i <= x2 && i < data.length; i++) {
    const linePrice = y1 + slope * (i - x1);
    if (data[i].close > linePrice) {
      return true;
    }
  }
  
  return false;
};

/**
 * Calculate cup boundaries using cosine function
 * Creates a smooth U-shaped curve for the cup
 * @param {number} cupWidth - Width of the cup
 * @param {number} cupHeight1 - Height from right high to lowest
 * @param {number} cupHeight2 - Height from left high to lowest
 * @param {number} y2 - Right high value
 * @param {number} y1 - Left high value
 * @param {number} lwset - Lowest value
 * @param {number} prcOfCupT - Percentage for top line adjustment
 * @param {number} prcOfCupB - Percentage for bottom line adjustment
 * @param {boolean} flatTop - Flatten top line
 * @param {boolean} flatBot - Flatten bottom line
 * @returns {Array} Array of {topValue, bottomValue} for each position
 */
const calculateCupBoundaries = (
  cupWidth,
  cupHeight1,
  cupHeight2,
  y2,
  y1,
  lwset,
  prcOfCupT,
  prcOfCupB,
  flatTop,
  flatBot
) => {
  const boundaries = [];
  const plus = cupHeight1 * prcOfCupT;
  const min = cupHeight2 * prcOfCupB;
  
  for (let d = 0; d <= cupWidth; d++) {
    // Cosine function: goes from 1 -> -1 as angle goes from 0 -> PI
    const cos = Math.cos((Math.PI / cupWidth) * d);
    // nxt goes from 0 -> 1 -> 0 (creates the U shape)
    const nxt = Math.sqrt(1 - cos * cos);
    
    const clcT = y2 - (cupHeight1 * nxt) + plus;
    const clcB = y1 - (cupHeight2 * nxt) - min;
    
    boundaries.push({
      topValue: flatTop ? Math.min(y2, clcT) : clcT,
      bottomValue: flatBot ? Math.max(lwset, clcB) : clcB
    });
  }
  
  return boundaries;
};

/**
 * Count breaks above/below the cup boundaries
 * @param {Array} data - OHLCV data
 * @param {number} startIdx - Start index of cup
 * @param {Array} boundaries - Cup boundary values
 * @param {number} maxHighsPercent - Max allowed breaks above (as decimal)
 * @param {number} maxLowsPercent - Max allowed breaks below (as decimal)
 * @returns {Object} {breaksTop, breaksBottom, valid}
 */
const countBoundaryBreaks = (data, startIdx, boundaries, maxHighsPercent, maxLowsPercent) => {
  const cupWidth = boundaries.length - 1;
  const maxBreaksTop = Math.round(cupWidth * maxHighsPercent);
  const maxBreaksBottom = Math.round(cupWidth * maxLowsPercent);
  
  let breaksTop = 0;
  let breaksBottom = 0;
  
  for (let i = 0; i < boundaries.length && i < data.length - startIdx; i++) {
    const candle = data[startIdx + i];
    const boundary = boundaries[boundaries.length - 1 - i]; // Reverse order
    
    if (candle.high > boundary.topValue) {
      breaksTop++;
    }
    if (candle.low < boundary.bottomValue) {
      breaksBottom++;
    }
    
    if (breaksTop > maxBreaksTop || breaksBottom > maxBreaksBottom) {
      return { breaksTop, breaksBottom, valid: false };
    }
  }
  
  return { breaksTop, breaksBottom, valid: true };
};

/**
 * Detect Cup with Handle pattern
 * @param {Array} data - Array of OHLCV data sorted by time (oldest first)
 * @param {Object} params - Detection parameters
 * @returns {Array} Array of detected patterns
 */
export const detectCupWithHandle = (data, params = {}) => {
  if (!data || data.length < 50) {
    return [];
  }
  
  // Parameters from the Groovy script
  const {
    left = 3,              // Left period for pivot
    right = 1,             // Right period for pivot
    zzBack = 50,           // Max pivot lookback
    prcAngle = 0.22,       // Max angle (22% of height)
    prcOfCupT = 0.22,      // Cup height top percentage (22%)
    prcOfCupB = 0.22,      // Cup height bottom percentage (22%)
    maxHighs = 0.20,       // Max breaks above (20%)
    maxLows = 0.20,        // Max breaks below (20%)
    flatTop = true,        // Flatten top line
    flatBot = true,        // Flatten bottom line
    minCupWidth = 25,      // Minimum cup width
    maxCupWidth = 130,     // Maximum cup width
    maxHighDiff = 0.10,    // Max difference between two highs (10%)
    maxHandleDepth = 0.33, // Max handle depth (33% of cup height)
    minHandleWidth = 5     // Minimum handle width
  } = params;
  
  // Find all pivot highs
  const allPivots = findPivotHighs(data, left, right);
  
  if (allPivots.length < 5) {
    return [];
  }
  
  // In Groovy, the script runs on every bar when a NEW pivot is detected
  // We need to simulate this: for each pivot (as if it's the "current" bar),
  // check if it forms a cup with previous pivots
  
  let totalChecks = 0;
  let failedAngle = 0;
  let failedBreakLine = 0;
  let failedBreakBoundary = 0;
  
  // Try each pivot as potential right high (starting from index 4, like Groovy checks array.size > 4)
  for (let currentPivotIdx = 4; currentPivotIdx < allPivots.length; currentPivotIdx++) {
    const rightPivot = allPivots[currentPivotIdx];
    const x2 = rightPivot.index;
    const y2 = rightPivot.value;
    
    // Build array of previous pivots (like Groovy's aP array up to current)
    const pivots = allPivots.slice(0, currentPivotIdx);
    
    // Look back through older pivots for left high (x1, y1)
    // In Groovy: for a = 4 to math.min(ZZback, array.size(aP)) -1
    const lookbackStart = Math.max(0, pivots.length - zzBack);
    const lookbackEnd = pivots.length - 1;
    
    for (let a = lookbackStart; a <= lookbackEnd; a++) {
      totalChecks++;
      const leftPivot = pivots[a];
      const x1 = leftPivot.index;
      const y1 = leftPivot.value;
      
      const cupWidth = x2 - x1;
      
      // Find lowest point in cup
      const lowest = findLowestInRange(data, x1, x2);
      const lo = lowest.value;
      
      // Check conditions from Groovy script:
      // 1. if y2 > y1 and y1 > y2 - ((y2 - lo) * prcAngle) and bar_index - x1 < 3000
      if (!(y2 > y1)) continue;
      
      const angleThreshold = y2 - ((y2 - lo) * prcAngle);
      if (!(y1 > angleThreshold)) {
        failedAngle++;
        continue;
      }
      
      if (data.length - x1 >= 3000) continue;
      
      // Check for breaks above the connecting line (testline check)
      if (checkBreakAbove(data, x1, y1, x2, y2)) {
        failedBreakLine++;
        continue;
      }    // Calculate cup heights
    const cupH1 = y2 - lo; // Height from right high (y2 - lowest)
    const cupH2 = y1 - lo; // Height from left high (y1 - lowest)
    
    // Calculate cup boundaries using cosine function
    const boundaries = calculateCupBoundaries(
      cupWidth,
      cupH1,
      cupH2,
      y2,
      y1,
      lo,
      prcOfCupT,
      prcOfCupB,
      flatTop,
      flatBot
    );
    
      // Check for breaks above/below boundaries
      const breakCheck = countBoundaryBreaks(data, x1, boundaries, maxHighs, maxLows);
      if (!breakCheck.valid) {
        failedBreakBoundary++;
        continue;
      }    // Pattern found! Like Groovy: if brTop < brT and brBot < brB
    // Now PREDICT handle area (like Groovy script does with box)
    const handleEnd = Math.min(x2 + Math.floor(cupWidth / 3), data.length - 1);
    
    // Find the lowest point in the predicted handle area for visualization
    let handleLow = y2;
    let handleLowIdx = x2;
    
    for (let j = x2; j <= handleEnd && j < data.length; j++) {
      if (data[j].low < handleLow) {
        handleLow = data[j].low;
        handleLowIdx = j;
      }
    }
    
    const handleWidth = handleEnd - x2;
    const handleDepth = y2 - handleLow;
    
    // Create boundary data for visualization
    const cupBoundaryPoints = [];
    for (let i = 0; i < boundaries.length && x1 + i <= x2; i++) {
      if (x1 + i < data.length) {
        cupBoundaryPoints.push({
          index: x1 + i,
          time: data[x1 + i].time,
          topValue: boundaries[boundaries.length - 1 - i].topValue,
          bottomValue: boundaries[boundaries.length - 1 - i].bottomValue
        });
      }
    }
    
      // Found valid pattern!
      return [{
        leftHighIndex: x1,
        leftHighValue: y1,
        leftHighTime: data[x1].time,
        rightHighIndex: x2,
        rightHighValue: y2,
        rightHighTime: data[x2].time,
        dipIndex: lowest.index,
        dipValue: lo,
        dipTime: data[lowest.index].time,
        handleLowIndex: handleLowIdx,
        handleLowValue: handleLow,
        handleLowTime: data[handleLowIdx].time,
        handleEndIndex: handleEnd,
        handleEndTime: data[handleEnd].time,
        cupWidth,
        cupHeight: cupH1,
        handleDepth,
        handleWidth,
        cupBoundaryPoints, // For drawing the cup shape
        breaksTop: breakCheck.breaksTop,
        breaksBottom: breakCheck.breaksBottom,
        // Latest bar for marking
        candleIndex: handleEnd,
        sentiment: 'bullish'
      }];
    }
  }
  
  // No pattern found
  return [];
};

/**
 * Detect Cup with Handle using High values (for pivot detection)
 * This is the main function to be called from patternDetectionService
 */
export const detectCupWithHandlePattern = (data) => {
  return detectCupWithHandle(data);
};
