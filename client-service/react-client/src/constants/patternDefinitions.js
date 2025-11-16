// Pattern Definitions - Candlestick and Chart Patterns
// This file contains comprehensive definitions for all patterns used in the chart

export const PATTERN_DEFINITIONS = {
  // ===== SINGLE CANDLE PATTERNS =====
  'hammer': 'A bullish reversal pattern that forms at the bottom of a downtrend. It has a small body at the upper end of the trading range with a long lower shadow (at least twice the length of the body) and little or no upper shadow. Signals potential trend reversal from bearish to bullish.',
  
  'inverted_hammer': 'A bullish reversal pattern appearing at the end of a downtrend. Features a small body at the lower end with a long upper shadow and little or no lower shadow. Suggests buyers are gaining strength, though confirmation is needed on the next candle.',
  
  'hanging_man': 'A bearish reversal pattern that appears at the top of an uptrend. Similar in appearance to a hammer but appears after a price advance. Has a small body at the upper end with a long lower shadow, signaling potential weakness and distribution.',
  
  'shooting_star': 'A bearish reversal pattern that forms after an uptrend. Features a small body near the lower end with a long upper shadow (at least twice the body length) and little or no lower shadow. Indicates sellers rejected higher prices.',
  
  'long_legged_doji': 'A neutral pattern indicating indecision in the market. Has virtually no body (open equals close) with long upper and lower shadows. Shows significant intraday volatility but ends with neither bulls nor bears in control.',
  
  'gravestone_doji': 'A bearish reversal pattern with no body and a long upper shadow. Open, low, and close are all at or near the session low. Suggests buyers pushed prices higher but sellers drove them back down, indicating potential reversal at resistance.',
  
  'dragonfly_doji': 'A bullish reversal pattern with no body and a long lower shadow. Open, high, and close are all at or near the session high. Indicates sellers pushed prices lower but buyers regained control, suggesting potential reversal at support.',
  
  'bearish_marubozu': 'A strong bearish candlestick with no or very small shadows. Opens at the high and closes at the low, showing complete domination by sellers throughout the session. Indicates strong selling pressure and bearish sentiment.',
  
  'bullish_marubozu': 'A strong bullish candlestick with no or very small shadows. Opens at the low and closes at the high, showing complete domination by buyers throughout the session. Indicates strong buying pressure and bullish sentiment.',
  
  'bearish_belt_hold': 'A single-candle bearish reversal pattern appearing after an uptrend. Opens at the high of the day with little to no upper shadow and closes near the low with a long body. Signals strong selling pressure and potential trend reversal.',
  
  'bullish_belt_hold': 'A single-candle bullish reversal pattern appearing after a downtrend. Opens at the low of the day with little to no lower shadow and closes near the high with a long body. Signals strong buying pressure and potential trend reversal.',

  // ===== TWO CANDLE PATTERNS =====
  'bullish_engulfing': 'A strong bullish reversal pattern consisting of two candles. The second candle (bullish) completely engulfs the body of the first candle (bearish). Appears at the end of a downtrend and signals a potential reversal to the upside with strong buying pressure.',
  
  'bearish_engulfing': 'A strong bearish reversal pattern consisting of two candles. The second candle (bearish) completely engulfs the body of the first candle (bullish). Appears at the end of an uptrend and signals a potential reversal to the downside with strong selling pressure.',
  
  'piercing_line': 'A bullish reversal pattern consisting of two candles. First candle is bearish, second opens below the prior low but closes above the midpoint of the first candle\'s body. Shows buyers are gaining control and suggests potential upward reversal.',
  
  'dark_cloud_cover': 'A bearish reversal pattern consisting of two candles. First candle is bullish, second opens above the prior high but closes below the midpoint of the first candle\'s body. Shows sellers are gaining control and suggests potential downward reversal.',
  
  'harami': 'A reversal pattern where the second candle\'s body is completely contained within the first candle\'s body. Can be bullish or bearish depending on context. Suggests a pause or potential reversal in the current trend. Means "pregnant" in Japanese.',
  
  'bearish_harami_cross': 'A bearish reversal pattern where a large bullish candle is followed by a doji whose body is contained within the first candle. The doji indicates indecision after an uptrend, suggesting potential reversal to the downside.',
  
  'bullish_harami_cross': 'A bullish reversal pattern where a large bearish candle is followed by a doji whose body is contained within the first candle. The doji indicates indecision after a downtrend, suggesting potential reversal to the upside.',
  
  'tweezer_bottom': 'A bullish reversal pattern consisting of two or more candles with matching lows. Appears at the bottom of a downtrend. The matching lows indicate strong support and suggest that sellers are losing control, potential reversal upward.',
  
  'tweezer_top': 'A bearish reversal pattern consisting of two or more candles with matching highs. Appears at the top of an uptrend. The matching highs indicate strong resistance and suggest that buyers are losing control, potential reversal downward.',
  
  'bearish_kicker': 'A strong bearish reversal pattern with two candles. A bullish candle is followed by a bearish candle that gaps down and opens below the previous close. Indicates a sudden shift from bullish to bearish sentiment with strong selling pressure.',
  
  'bullish_kicker': 'A strong bullish reversal pattern with two candles. A bearish candle is followed by a bullish candle that gaps up and opens above the previous close. Indicates a sudden shift from bearish to bullish sentiment with strong buying pressure.',
  
  'matching_low': 'A bullish reversal pattern where two consecutive bearish candles close at approximately the same price level during a downtrend. Suggests support and potential reversal as sellers fail to push prices lower.',
  
  'matching_high': 'A bearish reversal pattern where two consecutive bullish candles close at approximately the same price level during an uptrend. Suggests resistance and potential reversal as buyers fail to push prices higher.',
  
  'bearish_counterattack': 'A bearish continuation pattern consisting of two candles. A bullish candle is followed by a bearish candle that opens higher but closes at the same level as the previous close. Shows sellers fighting back but unable to push lower yet.',
  
  'bullish_counterattack': 'A bullish continuation pattern consisting of two candles. A bearish candle is followed by a bullish candle that opens lower but closes at the same level as the previous close. Shows buyers fighting back but unable to push higher yet.',

  // ===== THREE CANDLE PATTERNS =====
  'three_white_soldiers': 'A strong bullish reversal pattern consisting of three consecutive long bullish candles with higher closes. Each candle opens within the previous candle\'s body and closes near its high. Indicates strong and sustained buying pressure after a downtrend.',
  
  'three_black_crows': 'A strong bearish reversal pattern consisting of three consecutive long bearish candles with lower closes. Each candle opens within the previous candle\'s body and closes near its low. Indicates strong and sustained selling pressure after an uptrend.',
  
  'morning_star': 'A bullish reversal pattern consisting of three candles: a long bearish candle, a small-bodied candle (star) that gaps down, and a long bullish candle that closes well into the first candle\'s body. Signals the end of a downtrend.',
  
  'evening_star': 'A bearish reversal pattern consisting of three candles: a long bullish candle, a small-bodied candle (star) that gaps up, and a long bearish candle that closes well into the first candle\'s body. Signals the end of an uptrend.',
  
  'morning_star_doji': 'A bullish reversal pattern similar to morning star, but the middle candle is a doji. The doji emphasizes market indecision before the bullish reversal. Considered more reliable than regular morning star due to the stronger indecision signal.',
  
  'evening_star_doji': 'A bearish reversal pattern similar to evening star, but the middle candle is a doji. The doji emphasizes market indecision before the bearish reversal. Considered more reliable than regular evening star due to the stronger indecision signal.',
  
  'three_outside_up': 'A bullish reversal pattern consisting of three candles. Starts with a bullish engulfing pattern (two candles) followed by a third bullish candle that closes above the second candle\'s close. Provides strong confirmation of upward reversal.',
  
  'three_inside_up': 'A bullish reversal pattern consisting of three candles. Starts with a bullish harami pattern (two candles) followed by a third bullish candle that closes above the second candle\'s close. Confirms the reversal from downtrend to uptrend.',
  
  'bearish_abandoned_baby': 'A rare bearish reversal pattern consisting of three candles. A doji gaps above the previous uptrend and the following candle gaps down. The isolated doji represents abandonment of the bullish trend. Strong reversal signal.',
  
  'upside_tasuki_gap': 'A bullish continuation pattern with three candles. After a gap up in an uptrend, a bearish candle closes within the gap but not below it. The gap holds, suggesting the uptrend will continue. Shows temporary weakness is not a reversal.',
  
  'downside_tasuki_gap': 'A bearish continuation pattern with three candles. After a gap down in a downtrend, a bullish candle closes within the gap but not above it. The gap holds, suggesting the downtrend will continue. Shows temporary strength is not a reversal.',
  
  'bearish_tri_star': 'A rare bearish reversal pattern consisting of three doji candles. The middle doji gaps above the other two. Indicates extreme indecision at a top followed by potential reversal. Very rare and considered a strong signal when found.',
  
  'bullish_tri_star': 'A rare bullish reversal pattern consisting of three doji candles. The middle doji gaps below the other two. Indicates extreme indecision at a bottom followed by potential reversal. Very rare and considered a strong signal when found.',
  
  'thrusting': 'A bearish continuation pattern with two candles. In a downtrend, a bullish candle opens below the previous low but closes only slightly into the bearish candle\'s body (below midpoint). Shows weak buying that fails to reverse the trend.',
  
  'upside_gap_two_crows': 'A bearish reversal pattern with three candles. After a bullish candle, two small bearish candles gap up with the second engulfing the first. Despite the gap up, the bearish candles suggest the uptrend is losing momentum.',
  
  'three_star_in_the_south': 'A bullish reversal pattern with three bearish candles at the bottom of a downtrend. Each candle has progressively shorter bodies and smaller lower shadows. Suggests selling pressure is exhausting and reversal is near.',
  
  'advance_block': 'A bearish reversal pattern consisting of three consecutive bullish candles with progressively smaller bodies and longer upper shadows. Appears after an uptrend, suggesting buying pressure is weakening and a reversal may be imminent.',
  
  'descending_hawk': 'A bearish pattern where three consecutive candles show declining highs with increasing bearish pressure. The pattern resembles a hawk diving down, indicating strong selling momentum and potential for continued downtrend.',
  
  'deliberation': 'A bearish reversal pattern similar to advance block. Three bullish candles with the third showing hesitation (smaller body or doji-like). Suggests buyers are becoming uncertain after an uptrend, potential reversal ahead.',

  // ===== MULTI-CANDLE PATTERNS =====
  'falling_three': 'Falling Three Methods - A bearish continuation pattern consisting of five candles. A long bearish candle, followed by three small bullish candles (contained within first candle\'s range), then another long bearish candle. Shows temporary pause before downtrend continues.',
  
  'rising_three': 'Rising Three Methods - A bullish continuation pattern consisting of five candles. A long bullish candle, followed by three small bearish candles (contained within first candle\'s range), then another long bullish candle. Shows temporary pause before uptrend continues.',
  
  'bearish_three_line_strike': 'A bullish reversal pattern with four candles. Three consecutive bearish candles are followed by a strong bullish candle that opens below the third close and closes above the first open. Despite bearish setup, bulls take control.',
  
  'bullish_three_line_strike': 'A bearish reversal pattern with four candles. Three consecutive bullish candles are followed by a strong bearish candle that opens above the third close and closes below the first open. Despite bullish setup, bears take control.',
  
  'ladder_top': 'A bearish reversal pattern consisting of five candles. Three consecutive bullish candles followed by a gap up and a small candle, then a bearish candle. The extended run-up suggests exhaustion and potential reversal at resistance.',

  // ===== COMPLEX CHART PATTERNS =====
  'cup_with_handle': 'Cup With Handle - A bullish continuation pattern resembling a tea cup. A rounded bottom (cup) forms after a decline, followed by a smaller consolidation (handle) that drifts downward. A breakout above the handle signals continuation of the prior uptrend with a measured move target.',
  
  'flag_pattern': 'Flag Pattern - A continuation pattern that forms after a strong price move (flagpole). The consolidation phase forms parallel trend lines resembling a flag. Can be bullish or bearish. A breakout in the direction of the prior trend suggests continuation with momentum.',
  
  'pennant': 'Pennant Pattern - A short-term continuation pattern formed by converging trend lines after a strong move. Similar to a symmetrical triangle but smaller and shorter duration. Typically resolves in the direction of the prior trend with strong momentum following breakout.',
  
  'double_tops': 'Double Tops - A bearish reversal pattern where price reaches a resistance level twice and fails to break through. The two peaks are approximately at the same level with a trough in between. A break below the trough (neckline) confirms the reversal with a measured downside target.',
  
  'double_bottoms': 'Double Bottoms - A bullish reversal pattern where price reaches a support level twice and bounces back. The two troughs are approximately at the same level with a peak in between. A break above the peak (neckline) confirms the reversal with a measured upside target.',
  
  'double_pattern': 'Double Pattern - Refers to both double tops (bearish) and double bottoms (bullish) patterns. These are major reversal formations where price tests a key level twice before reversing direction. Important patterns for identifying trend changes at significant support/resistance.',
  
  'head_and_shoulders': 'Head and Shoulders - A bearish reversal pattern with three peaks: a higher peak (head) between two lower peaks (shoulders). The neckline connects the lows between the peaks. A break below the neckline confirms the reversal with a measured downside target equal to the head\'s height.',
  
  'inverse_head_and_shoulders': 'Inverse Head and Shoulders - A bullish reversal pattern with three troughs: a lower trough (head) between two higher troughs (shoulders). The neckline connects the highs between the troughs. A break above the neckline confirms the reversal with a measured upside target equal to the head\'s depth.',
  
  'triangle_ascending': 'Ascending Triangle - A bullish continuation pattern with a horizontal resistance line and rising support line. Shows buyers becoming more aggressive while resistance holds. Typically breaks out upward with volume, suggesting continuation or start of an uptrend.',
  
  'triangle_descending': 'Descending Triangle - A bearish continuation pattern with a horizontal support line and falling resistance line. Shows sellers becoming more aggressive while support holds. Typically breaks out downward with volume, suggesting continuation or start of a downtrend.',
  
  'triangle_symmetrical': 'Symmetrical Triangle - A neutral continuation pattern with converging trend lines (lower highs and higher lows). Shows market indecision with decreasing volatility. Typically breaks out in the direction of the prior trend, though can reverse. Volume tends to contract then expand on breakout.',
  
  'triangle_pattern': 'Triangle Pattern - Refers to all triangle formations: ascending (bullish), descending (bearish), and symmetrical (neutral). These consolidation patterns show a battle between buyers and sellers with decreasing volatility, typically resolving with a strong directional breakout.'
};
