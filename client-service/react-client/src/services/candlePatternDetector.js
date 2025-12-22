/**
 * Candle Pattern Detection Service
 * Client-side implementation of candlestick pattern recognition
 */

// Constants for pattern recognition thresholds
const DOJI_BODY_THRESHOLD = 0.1;
const SMALL_BODY_THRESHOLD = 0.3;
const LONG_SHADOW_RATIO = 2.0;
const MINIMAL_SHADOW_THRESHOLD = 0.1;
const MARUBOZU_BODY_THRESHOLD = 0.95;
const LARGE_BODY_THRESHOLD = 0.7;
const PRICE_TOLERANCE = 0.003; // 0.3% tolerance for price matching

// ==================== HELPER METHODS ====================

/**
 * Calculate the body size of a candlestick
 */
export const getBodySize = (candle) => {
  return Math.abs(candle.close - candle.open);
};

/**
 * Calculate the total range (high - low) of a candlestick
 */
export const getTotalRange = (candle) => {
  return candle.high - candle.low;
};

/**
 * Calculate the upper shadow of a candlestick
 */
export const getUpperShadow = (candle) => {
  return candle.high - Math.max(candle.open, candle.close);
};

/**
 * Calculate the lower shadow of a candlestick
 */
export const getLowerShadow = (candle) => {
  return Math.min(candle.open, candle.close) - candle.low;
};

/**
 * Check if a candle is bullish (close > open)
 */
export const isBullish = (candle) => {
  return candle.close > candle.open;
};

/**
 * Check if a candle is bearish (close < open)
 */
export const isBearish = (candle) => {
  return candle.close < candle.open;
};

/**
 * Check if a candle is a Doji (very small body)
 */
export const isDoji = (candle) => {
  const totalRange = getTotalRange(candle);
  if (totalRange === 0) return false;
  const bodySize = getBodySize(candle);
  return bodySize <= DOJI_BODY_THRESHOLD * totalRange;
};

/**
 * Detect all Doji patterns (any candle with very small body)
 * Used for Combo 4: Doji + Bollinger Squeeze
 */
export const detectDoji = (candles) => {
  const patterns = [];

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    if (isDoji(candle)) {
      patterns.push({ ...candle, index: i });
    }
  }
  return patterns;
};

/**
 * Check if there's an uptrend before the given index
 */
export const hasUptrend = (candles, currentIndex, lookback) => {
  if (currentIndex < lookback) return false;

  let bullishCount = 0;
  for (let i = currentIndex - lookback; i < currentIndex; i++) {
    if (isBullish(candles[i])) {
      bullishCount++;
    }
  }
  // At least 60% of previous candles should be bullish
  return bullishCount >= lookback * 0.6;
};

/**
 * Check if there's a downtrend before the given index
 */
export const hasDowntrend = (candles, currentIndex, lookback) => {
  if (currentIndex < lookback) return false;

  let bearishCount = 0;
  for (let i = currentIndex - lookback; i < currentIndex; i++) {
    if (isBearish(candles[i])) {
      bearishCount++;
    }
  }
  // At least 60% of previous candles should be bearish
  return bearishCount >= lookback * 0.6;
};

/**
 * Check if two prices are approximately equal within tolerance
 */
export const pricesMatch = (price1, price2, tolerance = PRICE_TOLERANCE) => {
  const avgPrice = (price1 + price2) / 2;
  if (avgPrice === 0) return false;
  return Math.abs(price1 - price2) <= avgPrice * tolerance;
};

/**
 * Check if there's a gap up between two candles
 */
export const hasGapUp = (firstCandle, secondCandle) => {
  return secondCandle.low > firstCandle.high;
};

/**
 * Check if there's a gap down between two candles
 */
export const hasGapDown = (firstCandle, secondCandle) => {
  return secondCandle.high < firstCandle.low;
};

// ==================== SINGLE CANDLESTICK PATTERNS ====================

/**
 * Detect Hammer patterns
 */
export const detectHammer = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const candle = candles[i];
    const totalRange = getTotalRange(candle);

    if (totalRange === 0) continue;

    const bodySize = getBodySize(candle);
    const upperShadow = getUpperShadow(candle);
    const lowerShadow = getLowerShadow(candle);

    const hasSmallBody = bodySize <= SMALL_BODY_THRESHOLD * totalRange;
    const hasLongLowerShadow = lowerShadow >= LONG_SHADOW_RATIO * bodySize;
    const hasMinimalUpperShadow = upperShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
    const bodyAtTop = lowerShadow >= 0.6 * totalRange;
    const inDowntrend = hasDowntrend(candles, i, 3);

    if (hasSmallBody && hasLongLowerShadow && hasMinimalUpperShadow && bodyAtTop && inDowntrend) {
      patterns.push({ ...candle, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Inverted Hammer patterns
 */
export const detectInvertedHammer = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const candle = candles[i];
    const totalRange = getTotalRange(candle);

    if (totalRange === 0) continue;

    const bodySize = getBodySize(candle);
    const upperShadow = getUpperShadow(candle);
    const lowerShadow = getLowerShadow(candle);

    const hasSmallBody = bodySize <= SMALL_BODY_THRESHOLD * totalRange;
    const hasLongUpperShadow = upperShadow >= LONG_SHADOW_RATIO * bodySize;
    const hasMinimalLowerShadow = lowerShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
    const bodyAtBottom = upperShadow >= 0.6 * totalRange;
    const inDowntrend = hasDowntrend(candles, i, 3);

    if (hasSmallBody && hasLongUpperShadow && hasMinimalLowerShadow && bodyAtBottom && inDowntrend) {
      patterns.push({ ...candle, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Hanging Man patterns
 */
export const detectHangingMan = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const candle = candles[i];
    const totalRange = getTotalRange(candle);

    if (totalRange === 0) continue;

    const bodySize = getBodySize(candle);
    const upperShadow = getUpperShadow(candle);
    const lowerShadow = getLowerShadow(candle);

    const hasSmallBody = bodySize <= SMALL_BODY_THRESHOLD * totalRange;
    const hasLongLowerShadow = lowerShadow >= LONG_SHADOW_RATIO * bodySize;
    const hasMinimalUpperShadow = upperShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
    const bodyAtTop = lowerShadow >= 0.6 * totalRange;
    const inUptrend = hasUptrend(candles, i, 3);

    if (hasSmallBody && hasLongLowerShadow && hasMinimalUpperShadow && bodyAtTop && inUptrend) {
      patterns.push({ ...candle, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Shooting Star patterns
 */
export const detectShootingStar = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const candle = candles[i];
    const totalRange = getTotalRange(candle);

    if (totalRange === 0) continue;

    const bodySize = getBodySize(candle);
    const upperShadow = getUpperShadow(candle);
    const lowerShadow = getLowerShadow(candle);

    const hasSmallBody = bodySize <= SMALL_BODY_THRESHOLD * totalRange;
    const hasLongUpperShadow = upperShadow >= LONG_SHADOW_RATIO * bodySize;
    const hasMinimalLowerShadow = lowerShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
    const bodyAtBottom = upperShadow >= 0.6 * totalRange;
    const inUptrend = hasUptrend(candles, i, 3);

    if (hasSmallBody && hasLongUpperShadow && hasMinimalLowerShadow && bodyAtBottom && inUptrend) {
      patterns.push({ ...candle, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bearish Marubozu patterns
 */
export const detectBearishMarubozu = (candles) => {
  const patterns = [];

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const totalRange = getTotalRange(candle);
    if (totalRange === 0) continue;

    const bodySize = getBodySize(candle);
    const upperShadow = getUpperShadow(candle);
    const lowerShadow = getLowerShadow(candle);

    const isBearishCandle = isBearish(candle);
    const hasLongBody = bodySize / totalRange >= MARUBOZU_BODY_THRESHOLD;
    const hasMinimalUpperShadow = upperShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
    const hasMinimalLowerShadow = lowerShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;

    if (isBearishCandle && hasLongBody && hasMinimalUpperShadow && hasMinimalLowerShadow) {
      patterns.push({ ...candle, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bullish Marubozu patterns
 */
export const detectBullishMarubozu = (candles) => {
  const patterns = [];

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const totalRange = getTotalRange(candle);
    if (totalRange === 0) continue;

    const bodySize = getBodySize(candle);
    const upperShadow = getUpperShadow(candle);
    const lowerShadow = getLowerShadow(candle);

    const isBullishCandle = isBullish(candle);
    const hasLongBody = bodySize / totalRange >= MARUBOZU_BODY_THRESHOLD;
    const hasMinimalUpperShadow = upperShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
    const hasMinimalLowerShadow = lowerShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;

    if (isBullishCandle && hasLongBody && hasMinimalUpperShadow && hasMinimalLowerShadow) {
      patterns.push({ ...candle, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Dragonfly Doji patterns
 */
export const detectDragonflyDoji = (candles) => {
  const patterns = [];

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const totalRange = getTotalRange(candle);
    if (totalRange === 0) continue;

    const bodySize = getBodySize(candle);
    const upperShadow = getUpperShadow(candle);
    const lowerShadow = getLowerShadow(candle);

    const isDojiBody = bodySize <= DOJI_BODY_THRESHOLD * totalRange;
    const hasMinimalUpperShadow = upperShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
    const hasLongLowerShadow = lowerShadow >= 0.6 * totalRange;

    if (isDojiBody && hasMinimalUpperShadow && hasLongLowerShadow) {
      patterns.push({ ...candle, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Gravestone Doji patterns
 */
export const detectGravestoneDoji = (candles) => {
  const patterns = [];

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const totalRange = getTotalRange(candle);
    if (totalRange === 0) continue;

    const bodySize = getBodySize(candle);
    const upperShadow = getUpperShadow(candle);
    const lowerShadow = getLowerShadow(candle);

    const isDojiBody = bodySize <= DOJI_BODY_THRESHOLD * totalRange;
    const hasMinimalLowerShadow = lowerShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
    const hasLongUpperShadow = upperShadow >= 0.6 * totalRange;

    if (isDojiBody && hasMinimalLowerShadow && hasLongUpperShadow) {
      patterns.push({ ...candle, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Long-legged Doji patterns
 */
export const detectLongLeggedDoji = (candles) => {
  const patterns = [];

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const totalRange = getTotalRange(candle);
    if (totalRange === 0) continue;

    const bodySize = getBodySize(candle);
    const upperShadow = getUpperShadow(candle);
    const lowerShadow = getLowerShadow(candle);

    const isDojiBody = bodySize <= DOJI_BODY_THRESHOLD * totalRange;
    const hasLongUpperShadow = upperShadow >= 0.3 * totalRange;
    const hasLongLowerShadow = lowerShadow >= 0.3 * totalRange;
    const shadowsBalanced = Math.abs(upperShadow - lowerShadow) <= 0.2 * totalRange;

    if (isDojiBody && hasLongUpperShadow && hasLongLowerShadow && shadowsBalanced) {
      patterns.push({ ...candle, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bearish Belt Hold patterns
 */
export const detectBearishBeltHold = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const candle = candles[i];
    const totalRange = getTotalRange(candle);
    if (totalRange === 0) continue;

    const bearish = isBearish(candle);
    const bodySize = getBodySize(candle);
    const largeBody = bodySize >= 0.7 * totalRange;

    const upperShadow = getUpperShadow(candle);
    const opensNearHigh = upperShadow <= 0.1 * totalRange;

    const inUptrend = hasUptrend(candles, i, 3);

    if (bearish && largeBody && opensNearHigh && inUptrend) {
      patterns.push({ ...candle, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bullish Belt Hold patterns
 */
export const detectBullishBeltHold = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const candle = candles[i];
    const totalRange = getTotalRange(candle);
    if (totalRange === 0) continue;

    const bullish = isBullish(candle);
    const bodySize = getBodySize(candle);
    const largeBody = bodySize >= 0.7 * totalRange;

    const lowerShadow = getLowerShadow(candle);
    const opensNearLow = lowerShadow <= 0.1 * totalRange;

    const inDowntrend = hasDowntrend(candles, i, 3);

    if (bullish && largeBody && opensNearLow && inDowntrend) {
      patterns.push({ ...candle, index: i });
    }
  }
  return patterns;
};

// ==================== TWO CANDLESTICK PATTERNS ====================

/**
 * Detect Bullish Engulfing patterns
 */
export const detectBullishEngulfing = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];

    const prevBodySize = getBodySize(prev);
    const currBodySize = getBodySize(curr);

    const prevBearish = isBearish(prev);
    const currBullish = isBullish(curr);
    const engulfsBody = curr.open <= prev.close && curr.close >= prev.open;
    const strongerEngulfing = currBodySize >= 1.2 * prevBodySize;
    const inDowntrend = hasDowntrend(candles, i, 3);

    if (prevBearish && currBullish && engulfsBody && strongerEngulfing && inDowntrend) {
      patterns.push({ ...curr, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bearish Engulfing patterns
 */
export const detectBearishEngulfing = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];

    const prevBodySize = getBodySize(prev);
    const currBodySize = getBodySize(curr);

    const prevBullish = isBullish(prev);
    const currBearish = isBearish(curr);
    const engulfsBody = curr.open >= prev.close && curr.close <= prev.open;
    const strongerEngulfing = currBodySize >= 1.2 * prevBodySize;
    const inUptrend = hasUptrend(candles, i, 3);

    if (prevBullish && currBearish && engulfsBody && strongerEngulfing && inUptrend) {
      patterns.push({ ...curr, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Piercing Line patterns
 */
export const detectPiercingLine = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const first = candles[i - 1];
    const second = candles[i];

    const firstBodySize = getBodySize(first);

    const firstBearish = isBearish(first);
    const firstHasStrongBody = firstBodySize >= 0.5 * getTotalRange(first);
    const secondBullish = isBullish(second);
    const opensLower = second.open < first.close;

    const firstMidpoint = (first.open + first.close) / 2;
    const strongPenetration = second.close > firstMidpoint && second.close < first.open;
    const inDowntrend = hasDowntrend(candles, i, 3);

    const penetrationRatio = (second.close - first.close) / firstBodySize;
    const optimalPenetration = penetrationRatio >= 0.5 && penetrationRatio <= 0.9;

    if (firstBearish && firstHasStrongBody && secondBullish && opensLower &&
      strongPenetration && inDowntrend && optimalPenetration) {
      patterns.push({ ...second, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Dark Cloud Cover patterns
 */
export const detectDarkCloudCover = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const first = candles[i - 1];
    const second = candles[i];

    const firstBodySize = getBodySize(first);

    const firstBullish = isBullish(first);
    const firstHasStrongBody = firstBodySize >= 0.5 * getTotalRange(first);
    const secondBearish = isBearish(second);
    const opensHigher = second.open > first.close;

    const firstMidpoint = (first.open + first.close) / 2;
    const strongPenetration = second.close < firstMidpoint && second.close > first.open;
    const inUptrend = hasUptrend(candles, i, 3);

    const penetrationRatio = (first.close - second.close) / firstBodySize;
    const optimalPenetration = penetrationRatio >= 0.5 && penetrationRatio <= 0.9;

    if (firstBullish && firstHasStrongBody && secondBearish && opensHigher &&
      strongPenetration && inUptrend && optimalPenetration) {
      patterns.push({ ...second, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Harami patterns
 */
export const detectHarami = (candles) => {
  const patterns = [];

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];

    const prevBodySize = getBodySize(prev);
    const currBodySize = getBodySize(curr);

    const currInsidePrevBody = curr.low >= Math.min(prev.open, prev.close) &&
      curr.high <= Math.max(prev.open, prev.close);
    const currSmallerBody = currBodySize <= 0.75 * prevBodySize;
    const prevHasSignificantBody = prevBodySize >= 0.5 * getTotalRange(prev);

    if (currInsidePrevBody && currSmallerBody && prevHasSignificantBody) {
      patterns.push({ ...curr, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Tweezer Bottom patterns
 */
export const detectTweezerBottom = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const first = candles[i - 1];
    const second = candles[i];

    const matchingLows = pricesMatch(first.low, second.low);
    const firstBearish = isBearish(first);
    const secondBullishOrNeutral = !isBearish(second);
    const inDowntrend = hasDowntrend(candles, i, 3);

    const secondRange = getTotalRange(second);
    const showsRejection = secondRange > 0 && (second.close - second.low) >= 0.3 * secondRange;

    if (matchingLows && firstBearish && secondBullishOrNeutral && inDowntrend && showsRejection) {
      patterns.push({ ...second, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Tweezer Top patterns
 */
export const detectTweezerTop = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const first = candles[i - 1];
    const second = candles[i];

    const matchingHighs = pricesMatch(first.high, second.high);
    const firstBullish = isBullish(first);
    const secondBearishOrNeutral = !isBullish(second);
    const inUptrend = hasUptrend(candles, i, 3);

    const secondRange = getTotalRange(second);
    const showsRejection = secondRange > 0 && (second.high - second.close) >= 0.3 * secondRange;

    if (matchingHighs && firstBullish && secondBearishOrNeutral && inUptrend && showsRejection) {
      patterns.push({ ...second, index: i });
    }
  }
  return patterns;
};

// Continue with remaining patterns in next part...
