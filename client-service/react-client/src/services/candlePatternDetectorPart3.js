/**
 * Candle Pattern Detection Service - Part 3
 * Additional complex three-candle and multi-candle patterns
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
const LARGE_BODY_THRESHOLD = 0.7;

// ==================== ADDITIONAL THREE CANDLESTICK PATTERNS ====================

/**
 * Detect Three Stars in the South patterns (bullish reversal)
 */
export const detectThreeStarsInTheSouth = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const firstRange = getTotalRange(first);
    const secondRange = getTotalRange(second);
    const thirdRange = getTotalRange(third);
    if (firstRange === 0 || secondRange === 0 || thirdRange === 0) continue;

    const firstBodySize = getBodySize(first);
    const secondBodySize = getBodySize(second);
    const thirdBodySize = getBodySize(third);

    const firstBearish = isBearish(first);
    const firstSignificantBody = firstBodySize >= 0.5 * firstRange;
    const firstLowerShadow = getLowerShadow(first);
    const firstUpperShadow = getUpperShadow(first);
    const firstLongLowerShadow = firstLowerShadow >= firstBodySize;
    const firstShortUpperShadow = firstUpperShadow <= 0.2 * firstRange;

    const secondBearish = isBearish(second);
    const secondSmaller = secondBodySize < firstBodySize;
    const secondHigherLow = second.low > first.low;
    const secondHigherClose = second.close > first.close;

    const thirdBearishOrDoji = isBearish(third) || isDoji(third);
    const thirdSmallest = thirdBodySize < secondBodySize;
    const thirdHigherLow = third.low > second.low;
    const thirdHigherClose = third.close > second.close;

    const inDowntrend = hasDowntrend(candles, i - 2, 3);

    if (firstBearish && firstSignificantBody && firstLongLowerShadow && firstShortUpperShadow &&
      secondBearish && secondSmaller && secondHigherLow && secondHigherClose &&
      thirdBearishOrDoji && thirdSmallest && thirdHigherLow && thirdHigherClose &&
      inDowntrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Advance Block patterns (bearish reversal warning)
 */
export const detectAdvanceBlock = (candles) => {
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
    const secondBullish = isBullish(second);
    const thirdBullish = isBullish(third);

    const firstBodySize = getBodySize(first);
    const secondBodySize = getBodySize(second);
    const thirdBodySize = getBodySize(third);
    const bodiesDecreasing = firstBodySize > secondBodySize && secondBodySize > thirdBodySize;
    const bodiesSignificant = firstBodySize >= 0.5 * firstRange;

    const firstUpperShadow = getUpperShadow(first);
    const secondUpperShadow = getUpperShadow(second);
    const thirdUpperShadow = getUpperShadow(third);
    const shadowsIncreasing = firstUpperShadow < secondUpperShadow && secondUpperShadow < thirdUpperShadow;

    const secondOpensInFirst = second.open >= first.open && second.open <= first.close;
    const thirdOpensInSecond = third.open >= second.open && third.open <= second.close;

    const inUptrend = hasUptrend(candles, i - 2, 3);

    if (firstBullish && secondBullish && thirdBullish &&
      bodiesDecreasing && bodiesSignificant &&
      shadowsIncreasing &&
      secondOpensInFirst && thirdOpensInSecond &&
      inUptrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Descending Hawk patterns (bearish reversal)
 */
export const detectDescendingHawk = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const firstRange = getTotalRange(first);
    const thirdRange = getTotalRange(third);
    if (firstRange === 0 || thirdRange === 0) continue;

    const firstBullish = isBullish(first);
    const secondBullish = isBullish(second);
    const thirdBearish = isBearish(third);

    const firstBodySize = getBodySize(first);
    const thirdBodySize = getBodySize(third);

    const thirdSmallBody = thirdBodySize < (firstBodySize * 0.5);
    const firstSignificant = firstBodySize >= 0.5 * firstRange;

    const thirdUpperShadow = getUpperShadow(third);
    const thirdHasRejection = thirdUpperShadow >= thirdBodySize;

    const inUptrend = hasUptrend(candles, i - 2, 3);

    if (firstBullish && secondBullish && thirdBearish &&
      thirdSmallBody && firstSignificant &&
      thirdHasRejection &&
      inUptrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Deliberation patterns (bearish reversal warning)
 */
export const detectDeliberation = (candles) => {
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
    const secondBullish = isBullish(second);
    const thirdBullish = isBullish(third);

    const secondBodySize = getBodySize(second);
    const thirdBodySize = getBodySize(third);

    const firstBodySize = getBodySize(first);
    const firstStrong = firstBodySize >= 0.6 * firstRange;
    const secondStrong = secondBodySize >= 0.6 * secondRange;

    const thirdSmallBody = thirdBodySize < (secondBodySize * 0.5);

    const thirdUpperShadow = getUpperShadow(third);
    const thirdLongUpperShadow = thirdUpperShadow > thirdBodySize;
    const thirdHasSignificantShadow = thirdUpperShadow >= 0.3 * thirdRange;

    const inUptrend = hasUptrend(candles, i - 2, 3);

    if (firstBullish && secondBullish && thirdBullish &&
      firstStrong && secondStrong &&
      thirdSmallBody && thirdLongUpperShadow && thirdHasSignificantShadow &&
      inUptrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bearish Kicker patterns (strong bearish reversal)
 */
export const detectBearishKicker = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const first = candles[i - 1];
    const second = candles[i];

    const firstRange = getTotalRange(first);
    const secondRange = getTotalRange(second);
    if (firstRange === 0 || secondRange === 0) continue;

    const firstBullish = isBullish(first);
    const firstBodySize = getBodySize(first);
    const firstStrong = firstBodySize >= LARGE_BODY_THRESHOLD * firstRange;

    const secondBearish = isBearish(second);
    const secondBodySize = getBodySize(second);
    const secondStrong = secondBodySize >= LARGE_BODY_THRESHOLD * secondRange;

    const hasSignificantGap = second.open < first.close;
    const gapSize = first.close - second.open;
    const hasStrongGap = gapSize >= 0.002 * first.close;

    const firstHasMinimalShadows = (getUpperShadow(first) + getLowerShadow(first)) <= 0.3 * firstRange;
    const secondHasMinimalShadows = (getUpperShadow(second) + getLowerShadow(second)) <= 0.3 * secondRange;

    const inUptrend = hasUptrend(candles, i - 1, 3);

    if (firstBullish && firstStrong && firstHasMinimalShadows &&
      secondBearish && secondStrong && secondHasMinimalShadows &&
      hasSignificantGap && hasStrongGap &&
      inUptrend) {
      patterns.push({ ...second, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bullish Kicker patterns (strong bullish reversal)
 */
export const detectBullishKicker = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const first = candles[i - 1];
    const second = candles[i];

    const firstRange = getTotalRange(first);
    const secondRange = getTotalRange(second);
    if (firstRange === 0 || secondRange === 0) continue;

    const firstBearish = isBearish(first);
    const firstBodySize = getBodySize(first);
    const firstStrong = firstBodySize >= LARGE_BODY_THRESHOLD * firstRange;

    const secondBullish = isBullish(second);
    const secondBodySize = getBodySize(second);
    const secondStrong = secondBodySize >= LARGE_BODY_THRESHOLD * secondRange;

    const hasSignificantGap = second.open > first.close;
    const gapSize = second.open - first.close;
    const hasStrongGap = gapSize >= 0.002 * first.close;

    const firstHasMinimalShadows = (getUpperShadow(first) + getLowerShadow(first)) <= 0.3 * firstRange;
    const secondHasMinimalShadows = (getUpperShadow(second) + getLowerShadow(second)) <= 0.3 * secondRange;

    const inDowntrend = hasDowntrend(candles, i - 1, 3);

    if (firstBearish && firstStrong && firstHasMinimalShadows &&
      secondBullish && secondStrong && secondHasMinimalShadows &&
      hasSignificantGap && hasStrongGap &&
      inDowntrend) {
      patterns.push({ ...second, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Matching Low patterns (bullish reversal)
 */
export const detectMatchingLow = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const first = candles[i - 1];
    const second = candles[i];

    const firstRange = getTotalRange(first);
    const secondRange = getTotalRange(second);
    if (firstRange === 0 || secondRange === 0) continue;

    const firstBearish = isBearish(first);
    const secondBearish = isBearish(second);

    const closesMatch = pricesMatch(first.close, second.close, PRICE_TOLERANCE);

    const firstBodySize = getBodySize(first);
    const secondBodySize = getBodySize(second);
    const bothSignificant = firstBodySize >= 0.5 * firstRange && secondBodySize >= 0.5 * secondRange;

    const inDowntrend = hasDowntrend(candles, i, 3);

    if (firstBearish && secondBearish &&
      closesMatch &&
      bothSignificant &&
      inDowntrend) {
      patterns.push({ ...second, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Matching High patterns (bearish reversal)
 */
export const detectMatchingHigh = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const first = candles[i - 1];
    const second = candles[i];

    const firstRange = getTotalRange(first);
    const secondRange = getTotalRange(second);
    if (firstRange === 0 || secondRange === 0) continue;

    const firstBullish = isBullish(first);
    const secondBullish = isBullish(second);

    const closesMatch = pricesMatch(first.close, second.close, PRICE_TOLERANCE);

    const firstBodySize = getBodySize(first);
    const secondBodySize = getBodySize(second);
    const bothSignificant = firstBodySize >= 0.5 * firstRange && secondBodySize >= 0.5 * secondRange;

    const inUptrend = hasUptrend(candles, i, 3);

    if (firstBullish && secondBullish &&
      closesMatch &&
      bothSignificant &&
      inUptrend) {
      patterns.push({ ...second, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bearish Three Line Strike patterns (bullish reversal)
 */
export const detectBearishThreeLineStrike = (candles) => {
  const patterns = [];

  for (let i = 5; i < candles.length; i++) {
    const first = candles[i - 3];
    const second = candles[i - 2];
    const third = candles[i - 1];
    const fourth = candles[i];

    const allBearish = isBearish(first) && isBearish(second) && isBearish(third);
    const progressiveLows = second.close < first.close && third.close < second.close;

    const fourthBullish = isBullish(fourth);
    const fourthEngulfsAll = fourth.open <= third.close && fourth.close >= first.open;

    const fourthRange = getTotalRange(fourth);
    const fourthBodySize = getBodySize(fourth);
    const fourthStrong = fourthBodySize >= 0.7 * fourthRange;

    const inDowntrend = hasDowntrend(candles, i - 3, 3);

    if (allBearish && progressiveLows &&
      fourthBullish && fourthEngulfsAll && fourthStrong &&
      inDowntrend) {
      patterns.push({ ...fourth, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bullish Three Line Strike patterns (bearish reversal)
 */
export const detectBullishThreeLineStrike = (candles) => {
  const patterns = [];

  for (let i = 5; i < candles.length; i++) {
    const first = candles[i - 3];
    const second = candles[i - 2];
    const third = candles[i - 1];
    const fourth = candles[i];

    const allBullish = isBullish(first) && isBullish(second) && isBullish(third);
    const progressiveHighs = second.close > first.close && third.close > second.close;

    const fourthBearish = isBearish(fourth);
    const fourthEngulfsAll = fourth.open >= third.close && fourth.close <= first.open;

    const fourthRange = getTotalRange(fourth);
    const fourthBodySize = getBodySize(fourth);
    const fourthStrong = fourthBodySize >= 0.7 * fourthRange;

    const inUptrend = hasUptrend(candles, i - 3, 3);

    if (allBullish && progressiveHighs &&
      fourthBearish && fourthEngulfsAll && fourthStrong &&
      inUptrend) {
      patterns.push({ ...fourth, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bearish Harami Cross patterns (bearish reversal)
 */
export const detectBearishHaramiCross = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const first = candles[i - 1];
    const second = candles[i];

    const firstRange = getTotalRange(first);
    if (firstRange === 0) continue;

    const firstBullish = isBullish(first);
    const firstBodySize = getBodySize(first);
    const firstSignificant = firstBodySize >= 0.6 * firstRange;

    const secondIsDoji = isDoji(second);

    const secondContained = second.high <= Math.max(first.open, first.close) &&
      second.low >= Math.min(first.open, first.close);

    const inUptrend = hasUptrend(candles, i, 3);

    if (firstBullish && firstSignificant &&
      secondIsDoji && secondContained &&
      inUptrend) {
      patterns.push({ ...second, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bullish Harami Cross patterns (bullish reversal)
 */
export const detectBullishHaramiCross = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const first = candles[i - 1];
    const second = candles[i];

    const firstRange = getTotalRange(first);
    if (firstRange === 0) continue;

    const firstBearish = isBearish(first);
    const firstBodySize = getBodySize(first);
    const firstSignificant = firstBodySize >= 0.6 * firstRange;

    const secondIsDoji = isDoji(second);

    const secondContained = second.high <= Math.max(first.open, first.close) &&
      second.low >= Math.min(first.open, first.close);

    const inDowntrend = hasDowntrend(candles, i, 3);

    if (firstBearish && firstSignificant &&
      secondIsDoji && secondContained &&
      inDowntrend) {
      patterns.push({ ...second, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bearish Counterattack patterns (bearish reversal)
 */
export const detectBearishCounterattack = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const first = candles[i - 1];
    const second = candles[i];

    const firstRange = getTotalRange(first);
    const secondRange = getTotalRange(second);
    if (firstRange === 0 || secondRange === 0) continue;

    const firstBullish = isBullish(first);
    const firstBodySize = getBodySize(first);
    const firstStrong = firstBodySize >= 0.6 * firstRange;

    const secondBearish = isBearish(second);
    const secondBodySize = getBodySize(second);
    const secondStrong = secondBodySize >= 0.6 * secondRange;

    const secondOpensHigher = second.open > first.close;

    const closesMatch = pricesMatch(first.close, second.close, PRICE_TOLERANCE);

    const inUptrend = hasUptrend(candles, i, 3);

    if (firstBullish && firstStrong &&
      secondBearish && secondStrong &&
      secondOpensHigher && closesMatch &&
      inUptrend) {
      patterns.push({ ...second, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bullish Counterattack patterns (bullish reversal)
 */
export const detectBullishCounterattack = (candles) => {
  const patterns = [];

  for (let i = 3; i < candles.length; i++) {
    const first = candles[i - 1];
    const second = candles[i];

    const firstRange = getTotalRange(first);
    const secondRange = getTotalRange(second);
    if (firstRange === 0 || secondRange === 0) continue;

    const firstBearish = isBearish(first);
    const firstBodySize = getBodySize(first);
    const firstStrong = firstBodySize >= 0.6 * firstRange;

    const secondBullish = isBullish(second);
    const secondBodySize = getBodySize(second);
    const secondStrong = secondBodySize >= 0.6 * secondRange;

    const secondOpensLower = second.open < first.close;

    const closesMatch = pricesMatch(first.close, second.close, PRICE_TOLERANCE);

    const inDowntrend = hasDowntrend(candles, i, 3);

    if (firstBearish && firstStrong &&
      secondBullish && secondStrong &&
      secondOpensLower && closesMatch &&
      inDowntrend) {
      patterns.push({ ...second, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Ladder Top patterns (bearish reversal)
 */
export const detectLadderTop = (candles) => {
  const patterns = [];

  for (let i = 6; i < candles.length; i++) {
    const first = candles[i - 4];
    const second = candles[i - 3];
    const third = candles[i - 2];
    const fourth = candles[i - 1];
    const fifth = candles[i];

    const firstFourBullish = isBullish(first) && isBullish(second) && isBullish(third) && isBullish(fourth);

    const progressiveHighs = second.close > first.close &&
      third.close > second.close &&
      fourth.close > third.close;

    const fourthUpperShadow = getUpperShadow(fourth);
    const fourthRange = getTotalRange(fourth);
    const fourthHasLongUpperShadow = fourthUpperShadow >= 0.3 * fourthRange;

    const fifthBearish = isBearish(fifth);
    const fifthRange = getTotalRange(fifth);
    const fifthBodySize = getBodySize(fifth);
    const fifthSignificant = fifthBodySize >= 0.5 * fifthRange;

    const inUptrend = hasUptrend(candles, i - 4, 3);

    if (firstFourBullish &&
      progressiveHighs &&
      fourthHasLongUpperShadow &&
      fifthBearish && fifthSignificant &&
      inUptrend) {
      patterns.push({ ...fifth, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bearish Tri Star patterns (bearish reversal)
 */
export const detectBearishTriStar = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const allDoji = isDoji(first) && isDoji(second) && isDoji(third);

    const secondHigher = second.close > first.close && second.open > first.open;

    const thirdLower = third.close < second.close;

    const inUptrend = hasUptrend(candles, i - 2, 3);

    if (allDoji && secondHigher && thirdLower && inUptrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Bullish Tri Star patterns (bullish reversal)
 */
export const detectBullishTriStar = (candles) => {
  const patterns = [];

  for (let i = 4; i < candles.length; i++) {
    const first = candles[i - 2];
    const second = candles[i - 1];
    const third = candles[i];

    const allDoji = isDoji(first) && isDoji(second) && isDoji(third);

    const secondLower = second.close < first.close && second.open < first.open;

    const thirdHigher = third.close > second.close;

    const inDowntrend = hasDowntrend(candles, i - 2, 3);

    if (allDoji && secondLower && thirdHigher && inDowntrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Upside Gap Two Crows patterns (bearish reversal warning)
 */
export const detectUpsideGapTwoCrows = (candles) => {
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
    const firstHasMinimalShadows = (getUpperShadow(first) + getLowerShadow(first)) <= 0.4 * firstRange;

    const secondBearish = isBearish(second);
    const hasGapUpCheck = second.open > first.close && second.close > first.close;

    const thirdBearish = isBearish(third);
    const thirdEngulfsSecond = third.open > second.open && third.close < second.close;
    const thirdBodySize = getBodySize(third);
    const secondBodySize = getBodySize(second);
    const thirdLargerThanSecond = thirdBodySize > secondBodySize;

    const thirdClosesAboveFirst = third.close > first.close;

    const inUptrend = hasUptrend(candles, i - 2, 3);

    if (firstBullish && firstStrong && firstHasMinimalShadows &&
      secondBearish && hasGapUpCheck &&
      thirdBearish && thirdEngulfsSecond && thirdLargerThanSecond &&
      thirdClosesAboveFirst &&
      inUptrend) {
      patterns.push({ ...third, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Falling Three Methods patterns (bearish continuation)
 */
export const detectFallingThreeMethods = (candles) => {
  const patterns = [];

  for (let i = 6; i < candles.length; i++) {
    const first = candles[i - 4];
    const second = candles[i - 3];
    const third = candles[i - 2];
    const fourth = candles[i - 1];
    const fifth = candles[i];

    const firstRange = getTotalRange(first);
    const fifthRange = getTotalRange(fifth);
    if (firstRange === 0 || fifthRange === 0) continue;

    const firstBearish = isBearish(first);
    const firstBodySize = getBodySize(first);
    const firstStrong = firstBodySize >= 0.6 * firstRange;

    const secondInRange = second.high <= first.open && second.low >= first.close;
    const thirdInRange = third.high <= first.open && third.low >= first.close;
    const fourthInRange = fourth.high <= first.open && fourth.low >= first.close;
    const middleInRange = secondInRange && thirdInRange && fourthInRange;

    const secondBody = getBodySize(second);
    const thirdBody = getBodySize(third);
    const fourthBody = getBodySize(fourth);
    const middleSmall = secondBody < 0.5 * firstBodySize &&
      thirdBody < 0.5 * firstBodySize &&
      fourthBody < 0.5 * firstBodySize;

    let bullishCount = 0;
    if (isBullish(second)) bullishCount++;
    if (isBullish(third)) bullishCount++;
    if (isBullish(fourth)) bullishCount++;
    const middleShowsPullback = bullishCount >= 2;

    const fifthBearish = isBearish(fifth);
    const fifthBodySize = getBodySize(fifth);
    const fifthStrong = fifthBodySize >= 0.6 * fifthRange;
    const fifthBreaksDown = fifth.close < first.close;

    const inDowntrend = hasDowntrend(candles, i - 4, 3);

    if (firstBearish && firstStrong &&
      middleInRange && middleSmall && middleShowsPullback &&
      fifthBearish && fifthStrong && fifthBreaksDown &&
      inDowntrend) {
      patterns.push({ ...fifth, index: i });
    }
  }
  return patterns;
};

/**
 * Detect Rising Three Methods patterns (bullish continuation)
 */
export const detectRisingThreeMethods = (candles) => {
  const patterns = [];

  for (let i = 6; i < candles.length; i++) {
    const first = candles[i - 4];
    const second = candles[i - 3];
    const third = candles[i - 2];
    const fourth = candles[i - 1];
    const fifth = candles[i];

    const firstRange = getTotalRange(first);
    const fifthRange = getTotalRange(fifth);
    if (firstRange === 0 || fifthRange === 0) continue;

    const firstBullish = isBullish(first);
    const firstBodySize = getBodySize(first);
    const firstStrong = firstBodySize >= 0.6 * firstRange;

    const secondInRange = second.high <= first.close && second.low >= first.open;
    const thirdInRange = third.high <= first.close && third.low >= first.open;
    const fourthInRange = fourth.high <= first.close && fourth.low >= first.open;
    const middleInRange = secondInRange && thirdInRange && fourthInRange;

    const secondBody = getBodySize(second);
    const thirdBody = getBodySize(third);
    const fourthBody = getBodySize(fourth);
    const middleSmall = secondBody < 0.5 * firstBodySize &&
      thirdBody < 0.5 * firstBodySize &&
      fourthBody < 0.5 * firstBodySize;

    let bearishCount = 0;
    if (isBearish(second)) bearishCount++;
    if (isBearish(third)) bearishCount++;
    if (isBearish(fourth)) bearishCount++;
    const middleShowsPullback = bearishCount >= 2;

    const fifthBullish = isBullish(fifth);
    const fifthBodySize = getBodySize(fifth);
    const fifthStrong = fifthBodySize >= 0.6 * fifthRange;
    const fifthBreaksUp = fifth.close > first.close;
    const fifthOpensStrong = fifth.open >= first.open;

    const inUptrend = hasUptrend(candles, i - 4, 3);

    if (firstBullish && firstStrong &&
      middleInRange && middleSmall && middleShowsPullback &&
      fifthBullish && fifthStrong && fifthBreaksUp && fifthOpensStrong &&
      inUptrend) {
      patterns.push({ ...fifth, index: i });
    }
  }
  return patterns;
};
