// Pattern utility functions

export const getPatternAbbreviation = (patternName) => {
  const abbrevMap = {
    'bullish_engulfing': 'BE',
    'bearish_engulfing': 'BE',
    'hammer': 'HM',
    'hanging_man': 'HM',
    'shooting_star': 'SS',
    'inverted_hammer': 'IH',
    'morning_star': 'MS',
    'evening_star': 'ES',
    'three_white_soldiers': '3WS',
    'three_black_crows': '3BC',
    'piercing_line': 'PL',
    'dark_cloud_cover': 'DCC',
    'harami': 'HR',
    'tweezer_top': 'TT',
    'tweezer_bottom': 'TB',
    'doji': 'DJ',
    'dragonfly_doji': 'DDJ',
    'gravestone_doji': 'GDJ',
    'long_legged_doji': 'LDJ',
    'marubozu': 'MZ',
    'bullish_marubozu': 'BMZ',
    'bearish_marubozu': 'BMZ',
    'cup_with_handle': 'CWH',
    'head_and_shoulders': 'H&S',
    'inverse_head_and_shoulders': 'IH&S',
    'double_tops': 'DT',
    'double_bottoms': 'DB',
    'flag_pattern': 'FLG',
    'pennant': 'PEN',
    'triangle_ascending': 'AT',
    'triangle_descending': 'DT',
    'triangle_symmetrical': 'ST'
  };
  return abbrevMap[patternName] || patternName.substring(0, 3).toUpperCase();
};

export const getPatternSentiment = (patternName) => {
  const bullishPatterns = [
    'bullish_engulfing', 'hammer', 'inverted_hammer', 'morning_star', 
    'three_white_soldiers', 'piercing_line', 'dragonfly_doji', 'bullish_marubozu',
    'bullish_belt_hold', 'bullish_kicker', 'bullish_harami_cross', 'bullish_counterattack',
    'tweezer_bottom', 'morning_star_doji', 'three_outside_up', 'three_inside_up',
    'upside_tasuki_gap', 'bullish_tri_star', 'rising_three', 'bullish_three_line_strike',
    'cup_with_handle', 'double_bottoms', 'inverse_head_and_shoulders', 'triangle_ascending'
  ];
  
  const bearishPatterns = [
    'bearish_engulfing', 'hanging_man', 'shooting_star', 'evening_star',
    'three_black_crows', 'dark_cloud_cover', 'gravestone_doji', 'bearish_marubozu',
    'bearish_belt_hold', 'bearish_kicker', 'bearish_harami_cross', 'bearish_counterattack',
    'tweezer_top', 'evening_star_doji', 'bearish_abandoned_baby', 'downside_tasuki_gap',
    'bearish_tri_star', 'falling_three', 'bearish_three_line_strike', 'ladder_top',
    'double_tops', 'head_and_shoulders', 'triangle_descending'
  ];

  if (bullishPatterns.includes(patternName)) return 'bullish';
  if (bearishPatterns.includes(patternName)) return 'bearish';
  return 'neutral';
};

export const getPatternColor = (patternName) => {
  const sentiment = getPatternSentiment(patternName);
  if (sentiment === 'bullish') return '#26a69a';
  if (sentiment === 'bearish') return '#ef5350';
  return '#9933FF';
};

export const isValidData = (data) => {
  return data && Array.isArray(data) && data.length > 0;
};
