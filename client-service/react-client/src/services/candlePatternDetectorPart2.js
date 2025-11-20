/**
 * Candle Pattern Detection Service - Part 2
 * Three candle patterns and more complex patterns
 */

import {
  getBodySize,
  getTotalRange,
  getUpperShadow,
  getLowerShadow,
  isBullish,
  isBearish,
  isDoji,
  hasUptrend,
  hasDowntrend,
  pricesMatch,
  hasGapUp,
  hasGapDown
} from './candlePatternDetector';

const PRICE_TOLERANCE = 0.003;

// ==================== THREE CANDLESTICK PATTERNS ====================

/**
 * Detect Three White Soldiers patterns
 */
export const detectThreeWhiteSoldiers = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const allBullish = isBullish(first) && isBullish(second) && isBullish(third);

    const secondOpensInFirst = second.open > first.open && second.open < first.close;
    const thirdOpensInSecond = third.open > second.open && third.open < second.close;

    const progressiveCloses = second.close > first.close && third.close > second.close;

    const firstUpperShadow = getUpperShadow(first);
    const secondUpperShadow = getUpperShadow(second);
    const thirdUpperShadow = getUpperShadow(third);
    const smallShadows = firstUpperShadow <= 0.3 * getBodySize(first) &&
      secondUpperShadow <= 0.3 * getBodySize(second) &&
      thirdUpperShadow <= 0.3 * getBodySize(third);

    const substantialBodies = getBodySize(first) >= 0.6 * getTotalRange(first) &&
      getBodySize(second) >= 0.6 * getTotalRange(second) &&
      getBodySize(third) >= 0.6 * getTotalRange(third);

    const afterDowntrendOrConsolidation = i >= 5 &&
      (hasDowntrend(candles, i - 2, 3) || !hasUptrend(candles, i - 2, 3));

    if (allBullish && secondOpensInFirst && thirdOpensInSecond && progressiveCloses &&
      smallShadows && substantialBodies && afterDowntrendOrConsolidation) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Three Black Crows patterns
 */
export const detectThreeBlackCrows = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const allBearish = isBearish(first) && isBearish(second) && isBearish(third);

    const secondOpensInFirst = second.open < first.open && second.open > first.close;
    const thirdOpensInSecond = third.open < second.open && third.open > second.close;

    const progressiveCloses = second.close < first.close && third.close < second.close;

    const firstLowerShadow = getLowerShadow(first);
    const secondLowerShadow = getLowerShadow(second);
    const thirdLowerShadow = getLowerShadow(third);
    const smallShadows = firstLowerShadow <= 0.3 * getBodySize(first) &&
      secondLowerShadow <= 0.3 * getBodySize(second) &&
      thirdLowerShadow <= 0.3 * getBodySize(third);

    const substantialBodies = getBodySize(first) >= 0.6 * getTotalRange(first) &&
      getBodySize(second) >= 0.6 * getTotalRange(second) &&
      getBodySize(third) >= 0.6 * getTotalRange(third);

    const afterUptrendOrConsolidation = i >= 5 &&
      (hasUptrend(candles, i - 2, 3) || !hasDowntrend(candles, i - 2, 3));

    if (allBearish && secondOpensInFirst && thirdOpensInSecond && progressiveCloses &&
      smallShadows && substantialBodies && afterUptrendOrConsolidation) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Morning Star patterns
 */
export const detectMorningStar = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const firstBodySize = getBodySize(first);
    const secondBodySize = getBodySize(second);
    const thirdBodySize = getBodySize(third);

    const firstBearish = isBearish(first);
    const firstHasLongBody = firstBodySize >= 0.6 * getTotalRange(first);
    const secondHasSmallBody = secondBodySize <= 0.3 * getTotalRange(first);
    const thirdBullish = isBullish(third);
    const thirdHasLongBody = thirdBodySize >= 0.6 * getTotalRange(third);

    const firstMidpoint = (first.open + first.close) / 2;
    const closesAboveMidpoint = third.close > firstMidpoint;

    const inDowntrend = hasDowntrend(candles, i - 2, 3);

    if (firstBearish && firstHasLongBody && secondHasSmallBody && thirdBullish &&
      thirdHasLongBody && closesAboveMidpoint && inDowntrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Evening Star patterns
 */
export const detectEveningStar = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const firstBodySize = getBodySize(first);
    const secondBodySize = getBodySize(second);
    const thirdBodySize = getBodySize(third);

    const firstBullish = isBullish(first);
    const firstHasLongBody = firstBodySize >= 0.6 * getTotalRange(first);
    const secondHasSmallBody = secondBodySize <= 0.3 * getTotalRange(first);
    const thirdBearish = isBearish(third);
    const thirdHasLongBody = thirdBodySize >= 0.6 * getTotalRange(third);

    const firstMidpoint = (first.open + first.close) / 2;
    const closesBelowMidpoint = third.close < firstMidpoint;

    const inUptrend = hasUptrend(candles, i - 2, 3);

    if (firstBullish && firstHasLongBody && secondHasSmallBody && thirdBearish &&
      thirdHasLongBody && closesBelowMidpoint && inUptrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Morning Star Doji patterns
 */
export const detectMorningStarDoji = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const firstRange = getTotalRange(first);
    const secondRange = getTotalRange(second);
    const thirdRange = getTotalRange(third);
    if (firstRange === 0 || secondRange === 0 || thirdRange === 0) continue;

    const firstBearish = isBearish(first);
    const firstBodySize = getBodySize(first);
    const firstStrong = firstBodySize >= 0.6 * firstRange;

    const secondIsDoji = isDoji(second);

    const thirdBullish = isBullish(third);
    const thirdBodySize = getBodySize(third);
    const thirdStrong = thirdBodySize >= 0.5 * thirdRange;

    const firstMidpoint = (first.open + first.close) / 2;
    const thirdPenetratesMidpoint = third.close > firstMidpoint;

    const inDowntrend = hasDowntrend(candles, i - 2, 3);

    if (firstBearish && firstStrong &&
      secondIsDoji &&
      thirdBullish && thirdStrong && thirdPenetratesMidpoint &&
      inDowntrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Evening Star Doji patterns
 */
export const detectEveningStarDoji = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const firstRange = getTotalRange(first);
    const secondRange = getTotalRange(second);
    const thirdRange = getTotalRange(third);
    if (firstRange === 0 || secondRange === 0 || thirdRange === 0) continue;

    const firstBullish = isBullish(first);
    const firstBodySize = getBodySize(first);
    const firstStrong = firstBodySize >= 0.6 * firstRange;

    const secondIsDoji = isDoji(second);

    const thirdBearish = isBearish(third);
    const thirdBodySize = getBodySize(third);
    const thirdStrong = thirdBodySize >= 0.5 * thirdRange;

    const firstMidpoint = (first.open + first.close) / 2;
    const thirdPenetratesMidpoint = third.close < firstMidpoint;

    const inUptrend = hasUptrend(candles, i - 2, 3);

    if (firstBullish && firstStrong &&
      secondIsDoji &&
      thirdBearish && thirdStrong && thirdPenetratesMidpoint &&
      inUptrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Three Outside Up patterns
 */
export const detectThreeOutsideUp = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const firstTotalRange = getTotalRange(first);
    const secondTotalRange = getTotalRange(second);
    const thirdTotalRange = getTotalRange(third);
    if (firstTotalRange === 0 || secondTotalRange === 0 || thirdTotalRange === 0) continue;

    const firstBearish = isBearish(first);
    const firstBodySize = getBodySize(first);
    const firstSignificant = firstBodySize >= 0.5 * firstTotalRange;

    const secondBullish = isBullish(second);
    const secondEngulfs = second.open <= first.close && second.close >= first.open;
    const secondBodySize = getBodySize(second);
    const secondLarger = secondBodySize >= 1.2 * firstBodySize;

    const thirdBullish = isBullish(third);
    const thirdConfirms = third.close > second.close;
    const thirdBodySize = getBodySize(third);
    const thirdSignificant = thirdBodySize >= 0.4 * thirdTotalRange;

    const inDowntrend = hasDowntrend(candles, i - 2, 3);

    if (firstBearish && firstSignificant &&
      secondBullish && secondEngulfs && secondLarger &&
      thirdBullish && thirdConfirms && thirdSignificant &&
      inDowntrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Three Inside Up patterns
 */
export const detectThreeInsideUp = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const firstRange = getTotalRange(first);
    const secondRange = getTotalRange(second);
    const thirdRange = getTotalRange(third);
    if (firstRange === 0 || secondRange === 0 || thirdRange === 0) continue;

    const firstBearish = isBearish(first);
    const firstBodySize = getBodySize(first);
    const firstSignificant = firstBodySize >= 0.6 * firstRange;

    const secondBullish = isBullish(second);
    const secondContained = second.high <= Math.max(first.open, first.close) &&
      second.low >= Math.min(first.open, first.close);
    const secondWithinBody = second.open >= first.close && second.close <= first.open;
    const secondBodySize = getBodySize(second);
    const secondSmaller = secondBodySize <= 0.75 * firstBodySize;

    const thirdBullish = isBullish(third);
    const thirdConfirms = third.close > second.high;
    const thirdBodySize = getBodySize(third);
    const thirdSignificant = thirdBodySize >= 0.5 * thirdRange;

    const inDowntrend = hasDowntrend(candles, i - 2, 3);

    if (firstBearish && firstSignificant &&
      secondBullish && secondContained && secondWithinBody && secondSmaller &&
      thirdBullish && thirdConfirms && thirdSignificant &&
      inDowntrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bearish Abandoned Baby patterns
 */
export const detectBearishAbandonedBaby = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const firstRange = getTotalRange(first);
    const secondRange = getTotalRange(second);
    const thirdRange = getTotalRange(third);
    if (firstRange === 0 || secondRange === 0 || thirdRange === 0) continue;

    const firstBullish = isBullish(first);
    const firstBodySize = getBodySize(first);
    const firstStrong = firstBodySize >= 0.6 * firstRange;

    const secondIsDoji = isDoji(second);
    const secondGapUp = hasGapUp(first, second);

    const thirdBearish = isBearish(third);
    const thirdBodySize = getBodySize(third);
    const thirdStrong = thirdBodySize >= 0.6 * thirdRange;
    const thirdGapDown = hasGapDown(second, third);

    const secondIsIsolated = secondGapUp && thirdGapDown;

    const firstMidpoint = (first.open + first.close) / 2;
    const thirdClosesBelowMidpoint = third.close < firstMidpoint;

    const inUptrend = hasUptrend(candles, i - 2, 3);

    if (firstBullish && firstStrong &&
      secondIsDoji && secondIsIsolated &&
      thirdBearish && thirdStrong && thirdClosesBelowMidpoint &&
      inUptrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Thrusting patterns
 */
export const detectThrusting = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const first = candles[i - 1];
    const second = candles[i];

    const firstBearish = isBearish(first);
    const secondBullish = isBullish(second);
    const opensLower = second.open < first.close;

    const firstMidpoint = (first.open + first.close) / 2;
    const weakPenetration = second.close > first.close && second.close < firstMidpoint;
    const inDowntrend = hasDowntrend(candles, i, 3);

    if (firstBearish && secondBullish && opensLower && weakPenetration && inDowntrend) {
      patterns.push({ ...second, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Upside Tasuki Gap patterns
 */
export const detectUpsideTasukiGap = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const firstRange = getTotalRange(first);
    const secondRange = getTotalRange(second);
    if (firstRange === 0 || secondRange === 0) continue;

    const firstBullish = isBullish(first);
    const firstBodySize = getBodySize(first);
    const firstSignificant = firstBodySize >= 0.5 * firstRange;

    const secondBullish = isBullish(second);
    const hasGapUpCheck = second.low > first.high;
    const secondBodySize = getBodySize(second);
    const secondSignificant = secondBodySize >= 0.5 * secondRange;

    const thirdBearish = isBearish(third);
    const thirdTriesToFillGap = third.open > second.close;
    const thirdPartiallyFillsGap = third.close < second.close && third.close > second.open;
    const gapNotCompletelyFilled = third.close > first.high;

    const inUptrend = hasUptrend(candles, i - 2, 3);

    if (firstBullish && firstSignificant &&
      secondBullish && secondSignificant && hasGapUpCheck &&
      thirdBearish && thirdTriesToFillGap && thirdPartiallyFillsGap &&
      gapNotCompletelyFilled &&
      inUptrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Downside Tasuki Gap patterns
 */
export const detectDownsideTasukiGap = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const firstRange = getTotalRange(first);
    const secondRange = getTotalRange(second);
    if (firstRange === 0 || secondRange === 0) continue;

    const firstBearish = isBearish(first);
    const firstBodySize = getBodySize(first);
    const firstSignificant = firstBodySize >= 0.5 * firstRange;

    const secondBearish = isBearish(second);
    const hasGapDownCheck = second.high < first.low;
    const secondBodySize = getBodySize(second);
    const secondSignificant = secondBodySize >= 0.5 * secondRange;

    const thirdBullish = isBullish(third);
    const thirdTriesToFillGap = third.open < second.close;
    const thirdPartiallyFillsGap = third.close > second.close && third.close < second.open;
    const gapNotCompletelyFilled = third.close < first.low;

    const inDowntrend = hasDowntrend(candles, i - 2, 3);

    if (firstBearish && firstSignificant &&
      secondBearish && secondSignificant && hasGapDownCheck &&
      thirdBullish && thirdTriesToFillGap && thirdPartiallyFillsGap &&
      gapNotCompletelyFilled &&
      inDowntrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

// Continue with more patterns...
