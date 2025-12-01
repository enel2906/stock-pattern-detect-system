/**
 * Main Pattern Detector Service
 * Provides a unified interface for detecting all candlestick patterns
 */

// Import all detector functions
import {
  detectHammer,
  detectInvertedHammer,
  detectHangingMan,
  detectShootingStar,
  detectBearishMarubozu,
  detectBullishMarubozu,
  detectDragonflyDoji,
  detectGravestoneDoji,
  detectLongLeggedDoji,
  detectBearishBeltHold,
  detectBullishBeltHold,
  detectBullishEngulfing,
  detectBearishEngulfing,
  detectPiercingLine,
  detectDarkCloudCover,
  detectHarami,
  detectTweezerBottom,
  detectTweezerTop
} from './candlePatternDetector';

import {
  detectThreeWhiteSoldiers,
  detectThreeBlackCrows,
  detectMorningStar,
  detectEveningStar,
  detectMorningStarDoji,
  detectEveningStarDoji,
  detectThreeOutsideUp,
  detectThreeInsideUp,
  detectBearishAbandonedBaby,
  detectThrusting,
  detectUpsideTasukiGap,
  detectDownsideTasukiGap
} from './candlePatternDetectorPart2';

import {
  detectThreeStarsInTheSouth,
  detectAdvanceBlock,
  detectDescendingHawk,
  detectDeliberation,
  detectBearishKicker,
  detectBullishKicker,
  detectMatchingLow,
  detectMatchingHigh,
  detectBearishThreeLineStrike,
  detectBullishThreeLineStrike,
  detectBearishHaramiCross,
  detectBullishHaramiCross,
  detectBearishCounterattack,
  detectBullishCounterattack,
  detectLadderTop,
  detectBearishTriStar,
  detectBullishTriStar,
  detectUpsideGapTwoCrows,
  detectFallingThreeMethods,
  detectRisingThreeMethods
} from './candlePatternDetectorPart3';

import { detectCupWithHandlePattern } from './cupWithHandleDetector';
import { detectDoublePatterns, detectDoubleTops, detectDoubleBottoms } from './doublePatternDetector';
import { detectFlagPatterns } from './flagPatternDetector';
import { detectPennantPatterns } from './pennantPatternDetector';
import { detectHeadAndShoulders, detectInverseHeadAndShoulders } from './headAndShouldersDetector';
import { 
  detectTrianglePatterns, 
  detectAscendingTriangles, 
  detectDescendingTriangles, 
  detectSymmetricalTriangles 
} from './trianglePatternDetector';

/**
 * Pattern detector mapping
 * Maps pattern names to their detection functions
 */
const PATTERN_DETECTORS = {
  // Single candle patterns
  'hammer': detectHammer,
  'inverted_hammer': detectInvertedHammer,
  'hanging_man': detectHangingMan,
  'shooting_star': detectShootingStar,
  'bearish_marubozu': detectBearishMarubozu,
  'bullish_marubozu': detectBullishMarubozu,
  'dragonfly_doji': detectDragonflyDoji,
  'gravestone_doji': detectGravestoneDoji,
  'long_legged_doji': detectLongLeggedDoji,
  'bearish_belt_hold': detectBearishBeltHold,
  'bullish_belt_hold': detectBullishBeltHold,

  // Two candle patterns
  'bullish_engulfing': detectBullishEngulfing,
  'bearish_engulfing': detectBearishEngulfing,
  'piercing_line': detectPiercingLine,
  'dark_cloud_cover': detectDarkCloudCover,
  'harami': detectHarami,
  'tweezer_bottom': detectTweezerBottom,
  'tweezer_top': detectTweezerTop,

  // Three candle patterns
  'three_white_soldiers': detectThreeWhiteSoldiers,
  'three_black_crows': detectThreeBlackCrows,
  'morning_star': detectMorningStar,
  'evening_star': detectEveningStar,
  'morning_star_doji': detectMorningStarDoji,
  'evening_star_doji': detectEveningStarDoji,
  'three_outside_up': detectThreeOutsideUp,
  'three_inside_up': detectThreeInsideUp,
  'bearish_abandoned_baby': detectBearishAbandonedBaby,
  'thrusting': detectThrusting,
  'upside_tasuki_gap': detectUpsideTasukiGap,
  'downside_tasuki_gap': detectDownsideTasukiGap,

  // Additional three candle patterns
  'three_stars_in_the_south': detectThreeStarsInTheSouth,
  'advance_block': detectAdvanceBlock,
  'descending_hawk': detectDescendingHawk,
  'deliberation': detectDeliberation,

  // Two candle kicker patterns
  'bearish_kicker': detectBearishKicker,
  'bullish_kicker': detectBullishKicker,

  // Two candle matching patterns
  'matching_low': detectMatchingLow,
  'matching_high': detectMatchingHigh,

  // Four candle patterns
  'bearish_three_line_strike': detectBearishThreeLineStrike,
  'bullish_three_line_strike': detectBullishThreeLineStrike,

  // Two candle harami cross patterns
  'bearish_harami_cross': detectBearishHaramiCross,
  'bullish_harami_cross': detectBullishHaramiCross,

  // Two candle counterattack patterns
  'bearish_counterattack': detectBearishCounterattack,
  'bullish_counterattack': detectBullishCounterattack,

  // Five candle patterns
  'ladder_top': detectLadderTop,

  // Three candle tri-star patterns
  'bearish_tri_star': detectBearishTriStar,
  'bullish_tri_star': detectBullishTriStar,

  // Three candle gap patterns
  'upside_gap_two_crows': detectUpsideGapTwoCrows,

  // Five candle three methods patterns
  'falling_three_methods': detectFallingThreeMethods,
  'rising_three_methods': detectRisingThreeMethods,

  // Complex chart patterns (client-side detection)
  'cup_with_handle': detectCupWithHandlePattern,
  
  // Double patterns (client-side detection with pivot points)
  'double_tops': detectDoubleTops,
  'double_bottoms': detectDoubleBottoms,
  'double_pattern': detectDoublePatterns, // Detects both tops and bottoms
  
  // Flag pattern (client-side detection with linear regression)
  'flag_pattern': detectFlagPatterns,
  
  // Pennant pattern (client-side detection with converging lines)
  'pennant': detectPennantPatterns,
  'pennant_pattern': detectPennantPatterns,
  
  // Head and Shoulders patterns (client-side detection)
  'head_and_shoulders': detectHeadAndShoulders,
  'inverse_head_and_shoulders': detectInverseHeadAndShoulders,
  
  // Triangle patterns (client-side detection)
  'triangle': detectTrianglePatterns, // Detects all triangle types
  'triangle_pattern': detectTrianglePatterns,
  'triangle_ascending': detectAscendingTriangles,
  'ascending_triangle': detectAscendingTriangles,
  'triangle_descending': detectDescendingTriangles,
  'descending_triangle': detectDescendingTriangles,
  'triangle_symmetrical': detectSymmetricalTriangles,
  'symmetrical_triangle': detectSymmetricalTriangles,
};

/**
 * Main pattern detection service
 * Detects candle patterns from stock data
 * 
 * @param {Array} candles - Array of candle data with {time, open, high, low, close}
 * @param {string} patternName - Name of the pattern to detect
 * @returns {Array} Array of detected patterns with candle data
 */
export const detectCandlePattern = (candles, patternName) => {
  if (!candles || candles.length === 0) {
    console.warn('No candle data provided');
    return [];
  }

  if (!patternName) {
    console.warn('No pattern name provided');
    return [];
  }

  const detector = PATTERN_DETECTORS[patternName];

  if (!detector) {
    console.warn(`No detector found for pattern: ${patternName}`);
    return [];
  }

  try {
    const patterns = detector(candles);
    console.log(`Detected ${patterns.length} ${patternName} patterns`);
    return patterns;
  } catch (error) {
    console.error(`Error detecting pattern ${patternName}:`, error);
    return [];
  }
};

/**
 * Get list of all supported pattern names
 * @returns {Array} Array of supported pattern names
 */
export const getSupportedPatterns = () => {
  return Object.keys(PATTERN_DETECTORS);
};

/**
 * Check if a pattern is supported
 * @param {string} patternName - Name of the pattern
 * @returns {boolean} True if pattern is supported
 */
export const isPatternSupported = (patternName) => {
  return patternName in PATTERN_DETECTORS;
};

export default {
  detectCandlePattern,
  getSupportedPatterns,
  isPatternSupported
};
