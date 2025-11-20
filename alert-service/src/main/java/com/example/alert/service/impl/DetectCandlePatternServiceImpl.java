package com.example.alert.service.impl;

import com.example.alert.domain.CandleStick;
import com.example.alert.repository.CandleStickRepository;
import com.example.alert.service.DetectCandlePatternService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class DetectCandlePatternServiceImpl implements DetectCandlePatternService {
    private final CandleStickRepository candleStickRepository;
    
    // Constants for pattern recognition thresholds
    private static final double DOJI_BODY_THRESHOLD = 0.1;
    private static final double SMALL_BODY_THRESHOLD = 0.3;
    private static final double LONG_SHADOW_RATIO = 2.0;
    private static final double MINIMAL_SHADOW_THRESHOLD = 0.1;
    private static final double MARUBOZU_BODY_THRESHOLD = 0.95;
    private static final double LARGE_BODY_THRESHOLD = 0.7;
    private static final double PRICE_TOLERANCE = 0.003; // 0.3% tolerance for price matching
    
    // ==================== HELPER METHODS ====================
    
    /**
     * Calculate the body size of a candlestick
     */
    private double getBodySize(CandleStick candle) {
        return Math.abs(candle.getClose() - candle.getOpen());
    }
    
    /**
     * Calculate the total range (high - low) of a candlestick
     */
    private double getTotalRange(CandleStick candle) {
        return candle.getHigh() - candle.getLow();
    }
    
    /**
     * Calculate the upper shadow of a candlestick
     */
    private double getUpperShadow(CandleStick candle) {
        return candle.getHigh() - Math.max(candle.getOpen(), candle.getClose());
    }
    
    /**
     * Calculate the lower shadow of a candlestick
     */
    private double getLowerShadow(CandleStick candle) {
        return Math.min(candle.getOpen(), candle.getClose()) - candle.getLow();
    }
    
    /**
     * Check if a candle is bullish (close > open)
     */
    private boolean isBullish(CandleStick candle) {
        return candle.getClose() > candle.getOpen();
    }
    
    /**
     * Check if a candle is bearish (close < open)
     */
    private boolean isBearish(CandleStick candle) {
        return candle.getClose() < candle.getOpen();
    }
    
    /**
     * Check if a candle is a Doji (very small body)
     */
    private boolean isDoji(CandleStick candle) {
        double totalRange = getTotalRange(candle);
        if (totalRange == 0) return false;
        double bodySize = getBodySize(candle);
        return bodySize <= DOJI_BODY_THRESHOLD * totalRange;
    }
    
    /**
     * Check if there's an uptrend before the given index (checks previous 3 candles)
     */
    private boolean hasUptrend(List<CandleStick> candles, int currentIndex, int lookback) {
        if (currentIndex < lookback) return false;
        
        int bullishCount = 0;
        for (int i = currentIndex - lookback; i < currentIndex; i++) {
            if (isBullish(candles.get(i))) {
                bullishCount++;
            }
        }
        // At least 60% of previous candles should be bullish
        return bullishCount >= (lookback * 0.6);
    }
    
    /**
     * Check if there's a downtrend before the given index (checks previous 3 candles)
     */
    private boolean hasDowntrend(List<CandleStick> candles, int currentIndex, int lookback) {
        if (currentIndex < lookback) return false;
        
        int bearishCount = 0;
        for (int i = currentIndex - lookback; i < currentIndex; i++) {
            if (isBearish(candles.get(i))) {
                bearishCount++;
            }
        }
        // At least 60% of previous candles should be bearish
        return bearishCount >= (lookback * 0.6);
    }
    
    /**
     * Check if two prices are approximately equal within tolerance
     */
    private boolean pricesMatch(double price1, double price2, double tolerance) {
        double avgPrice = (price1 + price2) / 2;
        if (avgPrice == 0) return false;
        return Math.abs(price1 - price2) <= avgPrice * tolerance;
    }
    
    /**
     * Check if there's a gap up between two candles
     */
    private boolean hasGapUp(CandleStick firstCandle, CandleStick secondCandle) {
        return secondCandle.getLow() > firstCandle.getHigh();
    }
    
    /**
     * Check if there's a gap down between two candles
     */
    private boolean hasGapDown(CandleStick firstCandle, CandleStick secondCandle) {
        return secondCandle.getHigh() < firstCandle.getLow();
    }

    // ==================== SINGLE CANDLESTICK PATTERNS ====================
    
    @Override
    public List<CandleStick> getHammerCandles(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> hammerCandles = new ArrayList<>();
        
        for (int i = 3; i < candles.size(); i++) {
            CandleStick candle = candles.get(i);
            double totalRange = getTotalRange(candle);
            
            if (totalRange == 0) continue;
            
            double bodySize = getBodySize(candle);
            double upperShadow = getUpperShadow(candle);
            double lowerShadow = getLowerShadow(candle);
            
            // Hammer criteria (Steve Nison standard):
            // 1. Small real body at the upper end of the trading range
            // 2. Lower shadow at least 2x the body length
            // 3. Little to no upper shadow
            // 4. Appears after a downtrend (bullish reversal)
            boolean hasSmallBody = bodySize <= SMALL_BODY_THRESHOLD * totalRange;
            boolean hasLongLowerShadow = lowerShadow >= LONG_SHADOW_RATIO * bodySize;
            boolean hasMinimalUpperShadow = upperShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
            boolean bodyAtTop = lowerShadow >= 0.6 * totalRange; // Body should be in upper 40%
            boolean inDowntrend = hasDowntrend(candles, i, 3);
            
            if (hasSmallBody && hasLongLowerShadow && hasMinimalUpperShadow && bodyAtTop && inDowntrend) {
                hammerCandles.add(candle);
            }
        }
        return hammerCandles;
    }

    @Override
    public List<CandleStick> getInvertedHammerCandles(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> invertedHammerCandles = new ArrayList<>();
        
        for (int i = 3; i < candles.size(); i++) {
            CandleStick candle = candles.get(i);
            double totalRange = getTotalRange(candle);
            
            if (totalRange == 0) continue;
            
            double bodySize = getBodySize(candle);
            double upperShadow = getUpperShadow(candle);
            double lowerShadow = getLowerShadow(candle);
            
            // Inverted Hammer criteria:
            // 1. Small real body at the lower end of the trading range
            // 2. Upper shadow at least 2x the body length
            // 3. Little to no lower shadow
            // 4. Appears after a downtrend (potential bullish reversal)
            boolean hasSmallBody = bodySize <= SMALL_BODY_THRESHOLD * totalRange;
            boolean hasLongUpperShadow = upperShadow >= LONG_SHADOW_RATIO * bodySize;
            boolean hasMinimalLowerShadow = lowerShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
            boolean bodyAtBottom = upperShadow >= 0.6 * totalRange; // Body should be in lower 40%
            boolean inDowntrend = hasDowntrend(candles, i, 3);
            
            if (hasSmallBody && hasLongUpperShadow && hasMinimalLowerShadow && bodyAtBottom && inDowntrend) {
                invertedHammerCandles.add(candle);
            }
        }
        return invertedHammerCandles;
    }

    @Override
    public List<CandleStick> getHangingManCandles(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> hangingManCandles = new ArrayList<>();
        
        for (int i = 3; i < candles.size(); i++) {
            CandleStick candle = candles.get(i);
            double totalRange = getTotalRange(candle);
            
            if (totalRange == 0) continue;
            
            double bodySize = getBodySize(candle);
            double upperShadow = getUpperShadow(candle);
            double lowerShadow = getLowerShadow(candle);
            
            // Hanging Man criteria (identical shape to Hammer but appears after uptrend):
            // 1. Small real body at the upper end of the trading range
            // 2. Lower shadow at least 2x the body length
            // 3. Little to no upper shadow
            // 4. Appears after an uptrend (bearish reversal signal)
            boolean hasSmallBody = bodySize <= SMALL_BODY_THRESHOLD * totalRange;
            boolean hasLongLowerShadow = lowerShadow >= LONG_SHADOW_RATIO * bodySize;
            boolean hasMinimalUpperShadow = upperShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
            boolean bodyAtTop = lowerShadow >= 0.6 * totalRange; // Body should be in upper 40%
            boolean inUptrend = hasUptrend(candles, i, 3);
            
            if (hasSmallBody && hasLongLowerShadow && hasMinimalUpperShadow && bodyAtTop && inUptrend) {
                hangingManCandles.add(candle);
            }
        }
        return hangingManCandles;
    }

    @Override
    public List<CandleStick> getBearishMarubozuPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bearishMarubozuPatterns = new ArrayList<>();

        for (CandleStick candle : candles) {
            double totalRange = getTotalRange(candle);
            if (totalRange == 0) continue;
            
            double bodySize = getBodySize(candle);
            double upperShadow = getUpperShadow(candle);
            double lowerShadow = getLowerShadow(candle);
            
            // Bearish Marubozu criteria:
            // 1. Long bearish body (close < open)
            // 2. Body comprises ≥95% of total range
            // 3. Minimal or no upper shadow (≤10% of range)
            // 4. Minimal or no lower shadow (≤10% of range)
            // Opens at high, closes at or near low
            boolean isBearish = isBearish(candle);
            boolean hasLongBody = (bodySize / totalRange) >= MARUBOZU_BODY_THRESHOLD;
            boolean hasMinimalUpperShadow = upperShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
            boolean hasMinimalLowerShadow = lowerShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;

            if (isBearish && hasLongBody && hasMinimalUpperShadow && hasMinimalLowerShadow) {
                bearishMarubozuPatterns.add(candle);
            }
        }
        return bearishMarubozuPatterns;
    }

    @Override
    public List<CandleStick> getBullishMarubozuPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bullishMarubozuPatterns = new ArrayList<>();

        for (CandleStick candle : candles) {
            double totalRange = getTotalRange(candle);
            if (totalRange == 0) continue;
            
            double bodySize = getBodySize(candle);
            double upperShadow = getUpperShadow(candle);
            double lowerShadow = getLowerShadow(candle);
            
            // Bullish Marubozu criteria:
            // 1. Long bullish body (close > open)
            // 2. Body comprises ≥95% of total range
            // 3. Minimal or no upper shadow (≤10% of range)
            // 4. Minimal or no lower shadow (≤10% of range)
            // Opens at or near low, closes at high
            boolean isBullishCandle = isBullish(candle);
            boolean hasLongBody = (bodySize / totalRange) >= MARUBOZU_BODY_THRESHOLD;
            boolean hasMinimalUpperShadow = upperShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
            boolean hasMinimalLowerShadow = lowerShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;

            if (isBullishCandle && hasLongBody && hasMinimalUpperShadow && hasMinimalLowerShadow) {
                bullishMarubozuPatterns.add(candle);
            }
        }
        return bullishMarubozuPatterns;
    }



    // ==================== TWO CANDLESTICK PATTERNS ====================
    
    @Override
    public List<CandleStick> getBullishEngulfingPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bullishPatterns = new ArrayList<>();
        
        for (int i = 3; i < candles.size(); i++) {
            CandleStick prev = candles.get(i - 1);
            CandleStick curr = candles.get(i);
            
            double prevBodySize = getBodySize(prev);
            double currBodySize = getBodySize(curr);
            
            // Bullish Engulfing criteria (Steve Nison):
            // 1. Previous candle is bearish
            // 2. Current candle is bullish
            // 3. Current body completely engulfs previous body
            // 4. Preferably appears after downtrend
            // 5. Larger engulfing = stronger signal
            boolean prevBearish = isBearish(prev);
            boolean currBullish = isBullish(curr);
            boolean engulfsBody = curr.getOpen() <= prev.getClose() && curr.getClose() >= prev.getOpen();
            boolean strongerEngulfing = currBodySize >= 1.2 * prevBodySize; // 20% larger for reliability
            boolean inDowntrend = hasDowntrend(candles, i, 3);
            
            if (prevBearish && currBullish && engulfsBody && strongerEngulfing && inDowntrend) {
                bullishPatterns.add(curr);
            }
        }
        return bullishPatterns;
    }

    @Override
    public List<CandleStick> getBearishEngulfingPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bearishPatterns = new ArrayList<>();
        
        for (int i = 3; i < candles.size(); i++) {
            CandleStick prev = candles.get(i - 1);
            CandleStick curr = candles.get(i);
            
            double prevBodySize = getBodySize(prev);
            double currBodySize = getBodySize(curr);
            
            // Bearish Engulfing criteria (Steve Nison):
            // 1. Previous candle is bullish
            // 2. Current candle is bearish
            // 3. Current body completely engulfs previous body
            // 4. Preferably appears after uptrend
            // 5. Larger engulfing = stronger signal
            boolean prevBullish = isBullish(prev);
            boolean currBearish = isBearish(curr);
            boolean engulfsBody = curr.getOpen() >= prev.getClose() && curr.getClose() <= prev.getOpen();
            boolean strongerEngulfing = currBodySize >= 1.2 * prevBodySize; // 20% larger for reliability
            boolean inUptrend = hasUptrend(candles, i, 3);
            
            if (prevBullish && currBearish && engulfsBody && strongerEngulfing && inUptrend) {
                bearishPatterns.add(curr);
            }
        }
        return bearishPatterns;
    }

    @Override
    public List<CandleStick> getTweezerBottomPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> tweezerBottomPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 1);
            CandleStick second = candles.get(i);

            // Tweezer Bottom criteria:
            // 1. Two candles with matching lows (within tolerance)
            // 2. First candle is bearish
            // 3. Second candle is bullish or neutral (shows rejection)
            // 4. Appears after downtrend (bullish reversal signal)
            // 5. Lows should test same support level
            boolean matchingLows = pricesMatch(first.getLow(), second.getLow(), PRICE_TOLERANCE);
            boolean firstBearish = isBearish(first);
            boolean secondBullishOrNeutral = !isBearish(second);
            boolean inDowntrend = hasDowntrend(candles, i, 3);
            
            // Additional validation: second candle should close away from low (rejection)
            double secondRange = getTotalRange(second);
            boolean showsRejection = secondRange > 0 && 
                    (second.getClose() - second.getLow()) >= 0.3 * secondRange;

            if (matchingLows && firstBearish && secondBullishOrNeutral && inDowntrend && showsRejection) {
                tweezerBottomPatterns.add(second);
            }
        }
        return tweezerBottomPatterns;
    }

    @Override
    public List<CandleStick> getTweezerTopPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> tweezerTopPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 1);
            CandleStick second = candles.get(i);

            // Tweezer Top criteria:
            // 1. Two candles with matching highs (within tolerance)
            // 2. First candle is bullish
            // 3. Second candle is bearish or neutral (shows rejection)
            // 4. Appears after uptrend (bearish reversal signal)
            // 5. Highs should test same resistance level
            boolean matchingHighs = pricesMatch(first.getHigh(), second.getHigh(), PRICE_TOLERANCE);
            boolean firstBullish = isBullish(first);
            boolean secondBearishOrNeutral = !isBullish(second);
            boolean inUptrend = hasUptrend(candles, i, 3);
            
            // Additional validation: second candle should close away from high (rejection)
            double secondRange = getTotalRange(second);
            boolean showsRejection = secondRange > 0 && 
                    (second.getHigh() - second.getClose()) >= 0.3 * secondRange;

            if (matchingHighs && firstBullish && secondBearishOrNeutral && inUptrend && showsRejection) {
                tweezerTopPatterns.add(second);
            }
        }
        return tweezerTopPatterns;
    }

    @Override
    public List<CandleStick> getDragonflyDoji(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> dragonflyDojiCandles = new ArrayList<>();

        for (CandleStick candle : candles) {
            double totalRange = getTotalRange(candle);
            if (totalRange == 0) continue;
            
            double bodySize = getBodySize(candle);
            double upperShadow = getUpperShadow(candle);
            double lowerShadow = getLowerShadow(candle);
            
            // Dragonfly Doji criteria:
            // 1. Very small body (≤10% of range) - Doji characteristic
            // 2. Long lower shadow (implied by having minimal upper shadow)
            // 3. Little to no upper shadow (≤10% of range)
            // 4. Open and close at or near the high
            // Bullish reversal when appears after downtrend
            boolean isDojiBody = bodySize <= DOJI_BODY_THRESHOLD * totalRange;
            boolean hasMinimalUpperShadow = upperShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
            boolean hasLongLowerShadow = lowerShadow >= 0.6 * totalRange; // At least 60% is lower shadow
            
            if (isDojiBody && hasMinimalUpperShadow && hasLongLowerShadow) {
                dragonflyDojiCandles.add(candle);
            }
        }
        return dragonflyDojiCandles;
    }

    @Override
    public List<CandleStick> getGravestoneDoji(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> gravestoneDojiCandles = new ArrayList<>();

        for (CandleStick candle : candles) {
            double totalRange = getTotalRange(candle);
            if (totalRange == 0) continue;
            
            double bodySize = getBodySize(candle);
            double upperShadow = getUpperShadow(candle);
            double lowerShadow = getLowerShadow(candle);
            
            // Gravestone Doji criteria:
            // 1. Very small body (≤10% of range) - Doji characteristic
            // 2. Long upper shadow (implied by having minimal lower shadow)
            // 3. Little to no lower shadow (≤10% of range)
            // 4. Open and close at or near the low
            // Bearish reversal when appears after uptrend
            boolean isDojiBody = bodySize <= DOJI_BODY_THRESHOLD * totalRange;
            boolean hasMinimalLowerShadow = lowerShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
            boolean hasLongUpperShadow = upperShadow >= 0.6 * totalRange; // At least 60% is upper shadow
            
            if (isDojiBody && hasMinimalLowerShadow && hasLongUpperShadow) {
                gravestoneDojiCandles.add(candle);
            }
        }
        return gravestoneDojiCandles;
    }

    @Override
    public List<CandleStick> getLongLeggedDoji(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> longLeggedDojiCandles = new ArrayList<>();

        for (CandleStick candle : candles) {
            double totalRange = getTotalRange(candle);
            if (totalRange == 0) continue;
            
            double bodySize = getBodySize(candle);
            double upperShadow = getUpperShadow(candle);
            double lowerShadow = getLowerShadow(candle);
            
            // Long-legged Doji criteria:
            // 1. Very small body (≤10% of range) - Doji characteristic
            // 2. Long upper shadow (≥30% of range)
            // 3. Long lower shadow (≥30% of range)
            // 4. Both shadows approximately equal length
            // Indicates high indecision and potential reversal
            boolean isDojiBody = bodySize <= DOJI_BODY_THRESHOLD * totalRange;
            boolean hasLongUpperShadow = upperShadow >= 0.3 * totalRange;
            boolean hasLongLowerShadow = lowerShadow >= 0.3 * totalRange;
            boolean shadowsBalanced = Math.abs(upperShadow - lowerShadow) <= 0.2 * totalRange;
            
            if (isDojiBody && hasLongUpperShadow && hasLongLowerShadow && shadowsBalanced) {
                longLeggedDojiCandles.add(candle);
            }
        }
        return longLeggedDojiCandles;
    }


    @Override
    public List<CandleStick> getShootingStarCandles(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> shootingStarCandles = new ArrayList<>();
        
        for (int i = 3; i < candles.size(); i++) {
            CandleStick candle = candles.get(i);
            double totalRange = getTotalRange(candle);
            
            if (totalRange == 0) continue;
            
            double bodySize = getBodySize(candle);
            double upperShadow = getUpperShadow(candle);
            double lowerShadow = getLowerShadow(candle);
            
            // Shooting Star criteria (identical shape to Inverted Hammer but appears after uptrend):
            // 1. Small real body at the lower end of the trading range
            // 2. Upper shadow at least 2x the body length
            // 3. Little to no lower shadow
            // 4. Appears after an uptrend (bearish reversal signal)
            // 5. Body should preferably be bearish (red) but not mandatory
            boolean hasSmallBody = bodySize <= SMALL_BODY_THRESHOLD * totalRange;
            boolean hasLongUpperShadow = upperShadow >= LONG_SHADOW_RATIO * bodySize;
            boolean hasMinimalLowerShadow = lowerShadow <= MINIMAL_SHADOW_THRESHOLD * totalRange;
            boolean bodyAtBottom = upperShadow >= 0.6 * totalRange; // Body should be in lower 40%
            boolean inUptrend = hasUptrend(candles, i, 3);
            
            if (hasSmallBody && hasLongUpperShadow && hasMinimalLowerShadow && bodyAtBottom && inUptrend) {
                shootingStarCandles.add(candle);
            }
        }
        return shootingStarCandles;
    }


    @Override
    public List<CandleStick> getHaramiPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> haramiPatterns = new ArrayList<>();
        
        for (int i = 1; i < candles.size(); i++) {
            CandleStick prev = candles.get(i - 1);
            CandleStick curr = candles.get(i);
            
            double prevBodySize = getBodySize(prev);
            double currBodySize = getBodySize(curr);
            
            // Harami criteria (works for both bullish and bearish):
            // 1. Second candle's body is contained within first candle's body
            // 2. Second body should be significantly smaller (≤ 75% of first body)
            // 3. Both high and low of second must be within first's body range
            // Bullish Harami: prev bearish + curr bullish (after downtrend)
            // Bearish Harami: prev bullish + curr bearish (after uptrend)
            boolean currInsidePrevBody = curr.getLow() >= Math.min(prev.getOpen(), prev.getClose()) &&
                    curr.getHigh() <= Math.max(prev.getOpen(), prev.getClose());
            boolean currSmallerBody = currBodySize <= 0.75 * prevBodySize;
            boolean prevHasSignificantBody = prevBodySize >= 0.5 * getTotalRange(prev);
            
            if (currInsidePrevBody && currSmallerBody && prevHasSignificantBody) {
                haramiPatterns.add(curr);
            }
        }
        return haramiPatterns;
    }

    @Override
    public List<CandleStick> getThrustingPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> thrustingPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 1);
            CandleStick second = candles.get(i);
            
            // Thrusting Pattern criteria (bearish continuation):
            // 1. First candle: Strong bearish candle
            // 2. Second candle: Bullish but opens below first's close
            // 3. Second closes below midpoint of first (weak penetration)
            // 4. Appears in downtrend - signals continuation
            // Similar to Piercing Line but weaker (doesn't reach 50%)
            boolean firstBearish = isBearish(first);
            boolean secondBullish = isBullish(second);
            boolean opensLower = second.getOpen() < first.getClose();
            
            double firstMidpoint = (first.getOpen() + first.getClose()) / 2;
            boolean weakPenetration = second.getClose() > first.getClose() && 
                    second.getClose() < firstMidpoint;
            boolean inDowntrend = hasDowntrend(candles, i, 3);
            
            if (firstBearish && secondBullish && opensLower && weakPenetration && inDowntrend) {
                thrustingPatterns.add(second);
            }
        }
        return thrustingPatterns;
    }

    @Override
    public List<CandleStick> getPiercingLinePatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> piercingLinePatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 1);
            CandleStick second = candles.get(i);
            
            double firstBodySize = getBodySize(first);
            
            // Piercing Line criteria (bullish reversal):
            // 1. First candle: Strong bearish
            // 2. Second candle: Opens below first's close (gap down preferred)
            // 3. Second candle: Bullish, closes ABOVE 50% of first's body
            // 4. Must not close above first's open (otherwise it's engulfing)
            // 5. Appears after downtrend
            // The deeper the penetration (>60%), the stronger the signal
            boolean firstBearish = isBearish(first);
            boolean firstHasStrongBody = firstBodySize >= 0.5 * getTotalRange(first);
            boolean secondBullish = isBullish(second);
            boolean opensLower = second.getOpen() < first.getClose();
            
            double firstMidpoint = (first.getOpen() + first.getClose()) / 2;
            boolean strongPenetration = second.getClose() > firstMidpoint && 
                    second.getClose() < first.getOpen();
            boolean inDowntrend = hasDowntrend(candles, i, 3);
            
            // Optimal: penetrates 50-75% into first body
            double penetrationRatio = (second.getClose() - first.getClose()) / firstBodySize;
            boolean optimalPenetration = penetrationRatio >= 0.5 && penetrationRatio <= 0.9;
            
            if (firstBearish && firstHasStrongBody && secondBullish && opensLower && 
                    strongPenetration && inDowntrend && optimalPenetration) {
                piercingLinePatterns.add(second);
            }
        }
        return piercingLinePatterns;
    }


    // ==================== THREE CANDLESTICK PATTERNS ====================
    
    @Override
    public List<CandleStick> getThreeWhiteSoldiers(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> patterns = new ArrayList<>();
        
        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            // Three White Soldiers criteria (Bulkowski):
            // 1. Three consecutive long bullish candles
            // 2. Each opens within previous body (not at extreme)
            // 3. Each closes progressively higher
            // 4. Minimal upper shadows (< 30% of body)
            // 5. Bodies should be relatively similar in size
            // 6. Strong bullish momentum signal
            boolean allBullish = isBullish(first) && isBullish(second) && isBullish(third);
            
            // Check opening positions
            boolean secondOpensInFirst = second.getOpen() > first.getOpen() && 
                    second.getOpen() < first.getClose();
            boolean thirdOpensInSecond = third.getOpen() > second.getOpen() && 
                    third.getOpen() < second.getClose();
            
            // Check progressive closes
            boolean progressiveCloses = second.getClose() > first.getClose() && 
                    third.getClose() > second.getClose();
            
            // Check shadows (should be small)
            double firstUpperShadow = getUpperShadow(first);
            double secondUpperShadow = getUpperShadow(second);
            double thirdUpperShadow = getUpperShadow(third);
            boolean smallShadows = firstUpperShadow <= 0.3 * getBodySize(first) &&
                    secondUpperShadow <= 0.3 * getBodySize(second) &&
                    thirdUpperShadow <= 0.3 * getBodySize(third);
            
            // Check body sizes are substantial
            boolean substantialBodies = getBodySize(first) >= 0.6 * getTotalRange(first) &&
                    getBodySize(second) >= 0.6 * getTotalRange(second) &&
                    getBodySize(third) >= 0.6 * getTotalRange(third);
            
            // Preferably appears after downtrend or consolidation
            boolean afterDowntrendOrConsolidation = i >= 5 && 
                    (hasDowntrend(candles, i - 2, 3) || !hasUptrend(candles, i - 2, 3));
            
            if (allBullish && secondOpensInFirst && thirdOpensInSecond && progressiveCloses && 
                    smallShadows && substantialBodies && afterDowntrendOrConsolidation) {
                patterns.add(third);
            }
        }
        return patterns;
    }

    @Override
    public List<CandleStick> getThreeBlackCrows(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> patterns = new ArrayList<>();
        
        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            // Three Black Crows criteria (mirror of Three White Soldiers):
            // 1. Three consecutive long bearish candles
            // 2. Each opens within previous body (not at extreme)
            // 3. Each closes progressively lower
            // 4. Minimal lower shadows (< 30% of body)
            // 5. Bodies should be relatively similar in size
            // 6. Strong bearish momentum signal
            boolean allBearish = isBearish(first) && isBearish(second) && isBearish(third);
            
            // Check opening positions
            boolean secondOpensInFirst = second.getOpen() < first.getOpen() && 
                    second.getOpen() > first.getClose();
            boolean thirdOpensInSecond = third.getOpen() < second.getOpen() && 
                    third.getOpen() > second.getClose();
            
            // Check progressive closes
            boolean progressiveCloses = second.getClose() < first.getClose() && 
                    third.getClose() < second.getClose();
            
            // Check shadows (should be small)
            double firstLowerShadow = getLowerShadow(first);
            double secondLowerShadow = getLowerShadow(second);
            double thirdLowerShadow = getLowerShadow(third);
            boolean smallShadows = firstLowerShadow <= 0.3 * getBodySize(first) &&
                    secondLowerShadow <= 0.3 * getBodySize(second) &&
                    thirdLowerShadow <= 0.3 * getBodySize(third);
            
            // Check body sizes are substantial
            boolean substantialBodies = getBodySize(first) >= 0.6 * getTotalRange(first) &&
                    getBodySize(second) >= 0.6 * getTotalRange(second) &&
                    getBodySize(third) >= 0.6 * getTotalRange(third);
            
            // Preferably appears after uptrend or consolidation
            boolean afterUptrendOrConsolidation = i >= 5 && 
                    (hasUptrend(candles, i - 2, 3) || !hasDowntrend(candles, i - 2, 3));
            
            if (allBearish && secondOpensInFirst && thirdOpensInSecond && progressiveCloses && 
                    smallShadows && substantialBodies && afterUptrendOrConsolidation) {
                patterns.add(third);
            }
        }
        return patterns;
    }

    @Override
    public List<CandleStick> getEveningStarPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> eveningStarPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstBodySize = getBodySize(first);
            double secondBodySize = getBodySize(second);
            double thirdBodySize = getBodySize(third);
            
            // Evening Star criteria (Steve Nison - High Reliability):
            // 1. First candle: Long bullish body
            // 2. Second candle: Small body (star) - gaps up preferred
            // 3. Third candle: Long bearish body - closes below midpoint of first
            // 4. Appears after uptrend (bearish reversal)
            boolean firstBullish = isBullish(first);
            boolean firstHasLongBody = firstBodySize >= 0.6 * getTotalRange(first);
            boolean secondHasSmallBody = secondBodySize <= 0.3 * getTotalRange(first);
            boolean thirdBearish = isBearish(third);
            boolean thirdHasLongBody = thirdBodySize >= 0.6 * getTotalRange(third);
            
            // Check gap (preferred but not mandatory)
            boolean hasGapUp = second.getLow() > first.getHigh();
            
            // Third must close below midpoint of first
            double firstMidpoint = (first.getOpen() + first.getClose()) / 2;
            boolean closesBelowMidpoint = third.getClose() < firstMidpoint;
            
            boolean inUptrend = hasUptrend(candles, i - 2, 3);
            
            if (firstBullish && firstHasLongBody && secondHasSmallBody && thirdBearish && 
                    thirdHasLongBody && closesBelowMidpoint && inUptrend) {
                eveningStarPatterns.add(third);
            }
        }
        return eveningStarPatterns;
    }

    @Override
    public List<CandleStick> getMorningStarPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> morningStarPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstBodySize = getBodySize(first);
            double secondBodySize = getBodySize(second);
            double thirdBodySize = getBodySize(third);
            
            // Morning Star criteria (Steve Nison - High Reliability):
            // 1. First candle: Long bearish body
            // 2. Second candle: Small body (star) - gaps down preferred
            // 3. Third candle: Long bullish body - closes above midpoint of first
            // 4. Appears after downtrend (bullish reversal)
            boolean firstBearish = isBearish(first);
            boolean firstHasLongBody = firstBodySize >= 0.6 * getTotalRange(first);
            boolean secondHasSmallBody = secondBodySize <= 0.3 * getTotalRange(first);
            boolean thirdBullish = isBullish(third);
            boolean thirdHasLongBody = thirdBodySize >= 0.6 * getTotalRange(third);
            
            // Check gap (preferred but not mandatory)
            boolean hasGapDown = second.getHigh() < first.getLow();
            
            // Third must close above midpoint of first
            double firstMidpoint = (first.getOpen() + first.getClose()) / 2;
            boolean closesAboveMidpoint = third.getClose() > firstMidpoint;
            
            boolean inDowntrend = hasDowntrend(candles, i - 2, 3);
            
            if (firstBearish && firstHasLongBody && secondHasSmallBody && thirdBullish && 
                    thirdHasLongBody && closesAboveMidpoint && inDowntrend) {
                morningStarPatterns.add(third);
            }
        }
        return morningStarPatterns;
    }

    @Override
    public List<CandleStick> getDarkCloudCoverPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> darkCloudCoverPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 1);
            CandleStick second = candles.get(i);
            
            double firstBodySize = getBodySize(first);
            
            // Dark Cloud Cover criteria (bearish reversal - mirror of Piercing Line):
            // 1. First candle: Strong bullish
            // 2. Second candle: Opens above first's close (gap up preferred)
            // 3. Second candle: Bearish, closes BELOW 50% of first's body
            // 4. Must not close below first's open (otherwise it's engulfing)
            // 5. Appears after uptrend
            // The deeper the penetration (>60%), the stronger the signal
            boolean firstBullish = isBullish(first);
            boolean firstHasStrongBody = firstBodySize >= 0.5 * getTotalRange(first);
            boolean secondBearish = isBearish(second);
            boolean opensHigher = second.getOpen() > first.getClose();
            
            double firstMidpoint = (first.getOpen() + first.getClose()) / 2;
            boolean strongPenetration = second.getClose() < firstMidpoint && 
                    second.getClose() > first.getOpen();
            boolean inUptrend = hasUptrend(candles, i, 3);
            
            // Optimal: penetrates 50-75% into first body
            double penetrationRatio = (first.getClose() - second.getClose()) / firstBodySize;
            boolean optimalPenetration = penetrationRatio >= 0.5 && penetrationRatio <= 0.9;
            
            if (firstBullish && firstHasStrongBody && secondBearish && opensHigher && 
                    strongPenetration && inUptrend && optimalPenetration) {
                darkCloudCoverPatterns.add(second);
            }
        }
        return darkCloudCoverPatterns;
    }

    @Override
    public List<CandleStick> getThreeOutsideUpPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> threeOutsideUpPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstTotalRange = getTotalRange(first);
            double secondTotalRange = getTotalRange(second);
            double thirdTotalRange = getTotalRange(third);
            if (firstTotalRange == 0 || secondTotalRange == 0 || thirdTotalRange == 0) continue;

            // Three Outside Up criteria (bullish reversal):
            // 1. First candle: Bearish with significant body
            // 2. Second candle: Bullish Engulfing (completely engulfs first + 20% larger)
            // 3. Third candle: Bullish confirmation, closes above second's close
            // 4. Appears after downtrend
            // This is essentially a Bullish Engulfing followed by a confirmation candle
            
            boolean firstBearish = isBearish(first);
            double firstBodySize = getBodySize(first);
            boolean firstSignificant = firstBodySize >= 0.5 * firstTotalRange;
            
            // Second: Complete engulfing with size requirement
            boolean secondBullish = isBullish(second);
            boolean secondEngulfs = second.getOpen() <= first.getClose() && 
                    second.getClose() >= first.getOpen();
            double secondBodySize = getBodySize(second);
            boolean secondLarger = secondBodySize >= 1.2 * firstBodySize;
            
            // Third: Strong bullish confirmation
            boolean thirdBullish = isBullish(third);
            boolean thirdConfirms = third.getClose() > second.getClose();
            double thirdBodySize = getBodySize(third);
            boolean thirdSignificant = thirdBodySize >= 0.4 * thirdTotalRange;
            
            boolean inDowntrend = hasDowntrend(candles, i - 2, 3);
            
            if (firstBearish && firstSignificant && 
                    secondBullish && secondEngulfs && secondLarger && 
                    thirdBullish && thirdConfirms && thirdSignificant && 
                    inDowntrend) {
                threeOutsideUpPatterns.add(third);
            }
        }
        return threeOutsideUpPatterns;
    }

    @Override
    public List<CandleStick> getThreeStarsInTheSouthPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> patterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            double thirdRange = getTotalRange(third);
            if (firstRange == 0 || secondRange == 0 || thirdRange == 0) continue;

            // Three Stars in the South criteria (rare bullish reversal):
            // 1. First candle: Bearish with long lower shadow, short upper shadow
            // 2. Second candle: Smaller bearish, higher low than first
            // 3. Third candle: Smallest bearish or Doji, higher low than second
            // 4. Progressive weakening of selling pressure (bodies get smaller)
            // 5. Appears after downtrend
            // This pattern signals exhaustion of downtrend
            
            double firstBodySize = getBodySize(first);
            double secondBodySize = getBodySize(second);
            double thirdBodySize = getBodySize(third);
            
            // First: Bearish with significant body and long lower shadow
            boolean firstBearish = isBearish(first);
            boolean firstSignificantBody = firstBodySize >= 0.5 * firstRange;
            double firstLowerShadow = getLowerShadow(first);
            double firstUpperShadow = getUpperShadow(first);
            boolean firstLongLowerShadow = firstLowerShadow >= firstBodySize;
            boolean firstShortUpperShadow = firstUpperShadow <= 0.2 * firstRange;
            
            // Second: Bearish, smaller body, higher low
            boolean secondBearish = isBearish(second);
            boolean secondSmaller = secondBodySize < firstBodySize;
            boolean secondHigherLow = second.getLow() > first.getLow();
            boolean secondHigherClose = second.getClose() > first.getClose();
            
            // Third: Smallest body (can be Doji), higher low
            boolean thirdBearishOrDoji = isBearish(third) || isDoji(third);
            boolean thirdSmallest = thirdBodySize < secondBodySize;
            boolean thirdHigherLow = third.getLow() > second.getLow();
            boolean thirdHigherClose = third.getClose() > second.getClose();
            
            boolean inDowntrend = hasDowntrend(candles, i - 2, 3);
            
            if (firstBearish && firstSignificantBody && firstLongLowerShadow && firstShortUpperShadow &&
                    secondBearish && secondSmaller && secondHigherLow && secondHigherClose &&
                    thirdBearishOrDoji && thirdSmallest && thirdHigherLow && thirdHigherClose &&
                    inDowntrend) {
                patterns.add(third);
            }
        }
        return patterns;
    }

    @Override
    public List<CandleStick> getAdvanceBlockPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> advanceBlockPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            double thirdRange = getTotalRange(third);
            if (firstRange == 0 || secondRange == 0 || thirdRange == 0) continue;

            // Advance Block criteria (bearish reversal warning):
            // 1. Three consecutive bullish candles (like Three White Soldiers)
            // 2. BUT progressively decreasing body sizes (weakening momentum)
            // 3. AND progressively increasing upper shadows (selling pressure)
            // 4. Each candle opens within previous body
            // 5. Appears after uptrend
            // This signals that uptrend is losing steam
            
            boolean firstBullish = isBullish(first);
            boolean secondBullish = isBullish(second);
            boolean thirdBullish = isBullish(third);
            
            // Bodies must be significant but decreasing
            double firstBodySize = getBodySize(first);
            double secondBodySize = getBodySize(second);
            double thirdBodySize = getBodySize(third);
            boolean bodiesDecreasing = firstBodySize > secondBodySize && 
                    secondBodySize > thirdBodySize;
            boolean bodiesSignificant = firstBodySize >= 0.5 * firstRange;
            
            // Upper shadows must be increasing (rejection at higher prices)
            double firstUpperShadow = getUpperShadow(first);
            double secondUpperShadow = getUpperShadow(second);
            double thirdUpperShadow = getUpperShadow(third);
            boolean shadowsIncreasing = firstUpperShadow < secondUpperShadow && 
                    secondUpperShadow < thirdUpperShadow;
            
            // Each candle should open within previous body
            boolean secondOpensInFirst = second.getOpen() >= first.getOpen() && 
                    second.getOpen() <= first.getClose();
            boolean thirdOpensInSecond = third.getOpen() >= second.getOpen() && 
                    third.getOpen() <= second.getClose();
            
            boolean inUptrend = hasUptrend(candles, i - 2, 3);

            if (firstBullish && secondBullish && thirdBullish && 
                    bodiesDecreasing && bodiesSignificant && 
                    shadowsIncreasing && 
                    secondOpensInFirst && thirdOpensInSecond && 
                    inUptrend) {
                advanceBlockPatterns.add(third);
            }
        }
        return advanceBlockPatterns;
    }

    @Override
    public List<CandleStick> getDescendingHawkPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> descendingHawkPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double thirdRange = getTotalRange(third);
            if (firstRange == 0 || thirdRange == 0) continue;

            // Descending Hawk criteria (bearish reversal - similar to Advance Block):
            // 1. First two candles: Bullish
            // 2. Third candle: Bearish or small body (reversal signal)
            // 3. Third candle's body is small compared to first
            // 4. Shows exhaustion after uptrend
            // 5. Appears after uptrend
            // Note: This is a variation where the third candle turns bearish
            
            boolean firstBullish = isBullish(first);
            boolean secondBullish = isBullish(second);
            boolean thirdBearish = isBearish(third);
            
            double firstBodySize = getBodySize(first);
            double thirdBodySize = getBodySize(third);
            
            // Third candle must be significantly smaller (shows weakness)
            boolean thirdSmallBody = thirdBodySize < (firstBodySize * 0.5);
            boolean firstSignificant = firstBodySize >= 0.5 * firstRange;
            
            // Third should ideally have long upper shadow (rejection)
            double thirdUpperShadow = getUpperShadow(third);
            boolean thirdHasRejection = thirdUpperShadow >= thirdBodySize;
            
            boolean inUptrend = hasUptrend(candles, i - 2, 3);

            if (firstBullish && secondBullish && thirdBearish && 
                    thirdSmallBody && firstSignificant && 
                    thirdHasRejection && 
                    inUptrend) {
                descendingHawkPatterns.add(third);
            }
        }
        return descendingHawkPatterns;
    }

    @Override
    public List<CandleStick> getDeliberationPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> deliberationPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            double thirdRange = getTotalRange(third);
            if (firstRange == 0 || secondRange == 0 || thirdRange == 0) continue;

            // Deliberation criteria (bearish reversal warning - stalling pattern):
            // 1. Three consecutive bullish candles
            // 2. Third candle has small body (stalling momentum)
            // 3. Third candle has long upper shadow (rejection at resistance)
            // 4. Upper shadow should be longer than body
            // 5. Appears after strong uptrend
            // This signals indecision and potential reversal
            
            boolean firstBullish = isBullish(first);
            boolean secondBullish = isBullish(second);
            boolean thirdBullish = isBullish(third);
            
            double secondBodySize = getBodySize(second);
            double thirdBodySize = getBodySize(third);
            
            // First two candles should be strong
            double firstBodySize = getBodySize(first);
            boolean firstStrong = firstBodySize >= 0.6 * firstRange;
            boolean secondStrong = secondBodySize >= 0.6 * secondRange;
            
            // Third candle: small body (less than 50% of second)
            boolean thirdSmallBody = thirdBodySize < (secondBodySize * 0.5);
            
            // Third candle: long upper shadow (rejection)
            double thirdUpperShadow = getUpperShadow(third);
            boolean thirdLongUpperShadow = thirdUpperShadow > thirdBodySize;
            boolean thirdHasSignificantShadow = thirdUpperShadow >= 0.3 * thirdRange;
            
            boolean inUptrend = hasUptrend(candles, i - 2, 3);

            if (firstBullish && secondBullish && thirdBullish && 
                    firstStrong && secondStrong && 
                    thirdSmallBody && thirdLongUpperShadow && thirdHasSignificantShadow && 
                    inUptrend) {
                deliberationPatterns.add(third);
            }
        }
        return deliberationPatterns;
    }


    @Override
    public List<CandleStick> getThreeInsideUpPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> threeInsideUpPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            double thirdRange = getTotalRange(third);
            if (firstRange == 0 || secondRange == 0 || thirdRange == 0) continue;

            // Three Inside Up criteria (bullish reversal):
            // 1. First candle: Bearish with significant body
            // 2. Second candle: Bullish Harami (contained within first, smaller body)
            // 3. Third candle: Bullish confirmation, closes above second's high
            // 4. Appears after downtrend
            // This is essentially a Bullish Harami followed by a confirmation candle
            
            boolean firstBearish = isBearish(first);
            double firstBodySize = getBodySize(first);
            boolean firstSignificant = firstBodySize >= 0.6 * firstRange;
            
            // Second: Bullish Harami (contained + smaller)
            boolean secondBullish = isBullish(second);
            boolean secondContained = second.getHigh() <= Math.max(first.getOpen(), first.getClose()) &&
                    second.getLow() >= Math.min(first.getOpen(), first.getClose());
            boolean secondWithinBody = second.getOpen() >= first.getClose() &&
                    second.getClose() <= first.getOpen();
            double secondBodySize = getBodySize(second);
            boolean secondSmaller = secondBodySize <= 0.75 * firstBodySize;
            
            // Third: Strong bullish confirmation
            boolean thirdBullish = isBullish(third);
            boolean thirdConfirms = third.getClose() > second.getHigh();
            double thirdBodySize = getBodySize(third);
            boolean thirdSignificant = thirdBodySize >= 0.5 * thirdRange;
            
            boolean inDowntrend = hasDowntrend(candles, i - 2, 3);
            
            if (firstBearish && firstSignificant &&
                    secondBullish && secondContained && secondWithinBody && secondSmaller &&
                    thirdBullish && thirdConfirms && thirdSignificant &&
                    inDowntrend) {
                threeInsideUpPatterns.add(third);
            }
        }
        return threeInsideUpPatterns;
    }


    @Override
    public List<CandleStick> getBearishAbandonedBabyPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bearishAbandonedBabyPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            double thirdRange = getTotalRange(third);
            if (firstRange == 0 || secondRange == 0 || thirdRange == 0) continue;

            // Bearish Abandoned Baby criteria (very rare bearish reversal):
            // 1. First candle: Strong bullish
            // 2. Second candle: Doji with gap UP (isolated star)
            // 3. Third candle: Strong bearish with gap DOWN
            // 4. Second candle must be completely isolated (gaps on both sides)
            // 5. Third closes below first's midpoint
            // 6. Appears after uptrend
            // This is more reliable than Evening Star due to strict gap isolation
            
            boolean firstBullish = isBullish(first);
            double firstBodySize = getBodySize(first);
            boolean firstStrong = firstBodySize >= 0.6 * firstRange;
            
            // Second: Must be TRUE Doji and completely isolated
            boolean secondIsDoji = isDoji(second);
            boolean secondGapUp = hasGapUp(first, second); // Use helper method
            
            // Third: Strong bearish with gap down
            boolean thirdBearish = isBearish(third);
            double thirdBodySize = getBodySize(third);
            boolean thirdStrong = thirdBodySize >= 0.6 * thirdRange;
            boolean thirdGapDown = hasGapDown(second, third); // Use helper method
            
            // Complete isolation check
            boolean secondIsIsolated = secondGapUp && thirdGapDown;
            
            // Third should close significantly lower
            double firstMidpoint = (first.getOpen() + first.getClose()) / 2;
            boolean thirdClosesBelowMidpoint = third.getClose() < firstMidpoint;
            
            boolean inUptrend = hasUptrend(candles, i - 2, 3);

            if (firstBullish && firstStrong && 
                    secondIsDoji && secondIsIsolated && 
                    thirdBearish && thirdStrong && thirdClosesBelowMidpoint && 
                    inUptrend) {
                bearishAbandonedBabyPatterns.add(third);
            }
        }
        return bearishAbandonedBabyPatterns;
    }

    @Override
    public List<CandleStick> getBearishKickerPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bearishKickerPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 1);
            CandleStick second = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            if (firstRange == 0 || secondRange == 0) continue;

            // Bearish Kicker criteria (strong bearish reversal):
            // 1. First candle: Strong bullish
            // 2. Second candle: Opens with GAP DOWN, strong bearish
            // 3. Gap should be significant (not just opens lower)
            // 4. Both candles have strong bodies (minimal shadows)
            // 5. Shows sudden shift in sentiment
            // 6. Appears after uptrend
            
            boolean firstBullish = isBullish(first);
            double firstBodySize = getBodySize(first);
            boolean firstStrong = firstBodySize >= 0.7 * firstRange;
            
            boolean secondBearish = isBearish(second);
            double secondBodySize = getBodySize(second);
            boolean secondStrong = secondBodySize >= 0.7 * secondRange;
            
            // Gap down requirement - second opens BELOW first's close
            boolean hasSignificantGap = second.getOpen() < first.getClose();
            // Stronger signal if gap is substantial
            double gapSize = first.getClose() - second.getOpen();
            boolean hasStrongGap = gapSize >= 0.002 * first.getClose(); // 0.2% gap minimum
            
            // Both should have minimal shadows (strong momentum)
            boolean firstHasMinimalShadows = (getUpperShadow(first) + getLowerShadow(first)) 
                    <= 0.3 * firstRange;
            boolean secondHasMinimalShadows = (getUpperShadow(second) + getLowerShadow(second)) 
                    <= 0.3 * secondRange;
            
            boolean inUptrend = hasUptrend(candles, i - 1, 3);

            if (firstBullish && firstStrong && firstHasMinimalShadows &&
                    secondBearish && secondStrong && secondHasMinimalShadows &&
                    hasSignificantGap && hasStrongGap &&
                    inUptrend) {
                bearishKickerPatterns.add(second);
            }
        }
        return bearishKickerPatterns;
    }

    @Override
    public List<CandleStick> getBullishKickerPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bullishKickerPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 1);
            CandleStick second = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            if (firstRange == 0 || secondRange == 0) continue;

            // Bullish Kicker criteria (strong bullish reversal):
            // 1. First candle: Strong bearish
            // 2. Second candle: Opens with GAP UP, strong bullish
            // 3. Gap should be significant (not just opens higher)
            // 4. Both candles have strong bodies (minimal shadows)
            // 5. Shows sudden shift in sentiment from bearish to bullish
            // 6. Appears after downtrend
            
            boolean firstBearish = isBearish(first);
            double firstBodySize = getBodySize(first);
            boolean firstStrong = firstBodySize >= 0.7 * firstRange;
            
            boolean secondBullish = isBullish(second);
            double secondBodySize = getBodySize(second);
            boolean secondStrong = secondBodySize >= 0.7 * secondRange;
            
            // Gap up requirement - second opens ABOVE first's close
            boolean hasSignificantGap = second.getOpen() > first.getClose();
            // Stronger signal if gap is substantial
            double gapSize = second.getOpen() - first.getClose();
            boolean hasStrongGap = gapSize >= 0.002 * first.getClose(); // 0.2% gap minimum
            
            // Both should have minimal shadows (strong momentum)
            boolean firstHasMinimalShadows = (getUpperShadow(first) + getLowerShadow(first)) 
                    <= 0.3 * firstRange;
            boolean secondHasMinimalShadows = (getUpperShadow(second) + getLowerShadow(second)) 
                    <= 0.3 * secondRange;
            
            boolean inDowntrend = hasDowntrend(candles, i - 1, 3);

            if (firstBearish && firstStrong && firstHasMinimalShadows &&
                    secondBullish && secondStrong && secondHasMinimalShadows &&
                    hasSignificantGap && hasStrongGap &&
                    inDowntrend) {
                bullishKickerPatterns.add(second);
            }
        }
        return bullishKickerPatterns;
    }


    @Override
    public List<CandleStick> getFallingThreePatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> fallingThreePatterns = new ArrayList<>();

        for (int i = 6; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 4);
            CandleStick second = candles.get(i - 3);
            CandleStick third = candles.get(i - 2);
            CandleStick fourth = candles.get(i - 1);
            CandleStick fifth = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double fifthRange = getTotalRange(fifth);
            if (firstRange == 0 || fifthRange == 0) continue;

            // Falling Three Methods criteria (bearish continuation):
            // 1. First candle: Long bearish (establishes downtrend)
            // 2. Next three candles: Small-bodied, consolidation within first's range
            // 3. Middle candles preferably bullish (counter-trend pullback)
            // 4. Fifth candle: Long bearish, closes below first's close
            // 5. Appears during downtrend
            // Shows temporary pause before downtrend resumes
            
            boolean firstBearish = isBearish(first);
            double firstBodySize = getBodySize(first);
            boolean firstStrong = firstBodySize >= 0.6 * firstRange;
            
            // Middle three candles: should stay within first's range
            boolean secondInRange = second.getHigh() <= first.getOpen() && 
                    second.getLow() >= first.getClose();
            boolean thirdInRange = third.getHigh() <= first.getOpen() && 
                    third.getLow() >= first.getClose();
            boolean fourthInRange = fourth.getHigh() <= first.getOpen() && 
                    fourth.getLow() >= first.getClose();
            boolean middleInRange = secondInRange && thirdInRange && fourthInRange;
            
            // Middle candles should be small-bodied (consolidation)
            double secondBody = getBodySize(second);
            double thirdBody = getBodySize(third);
            double fourthBody = getBodySize(fourth);
            boolean middleSmall = secondBody < 0.5 * firstBodySize &&
                    thirdBody < 0.5 * firstBodySize &&
                    fourthBody < 0.5 * firstBodySize;
            
            // Preferably, middle candles are bullish (pullback)
            int bullishCount = 0;
            if (isBullish(second)) bullishCount++;
            if (isBullish(third)) bullishCount++;
            if (isBullish(fourth)) bullishCount++;
            boolean middleShowsPullback = bullishCount >= 2;
            
            // Fifth: Strong bearish breakout
            boolean fifthBearish = isBearish(fifth);
            double fifthBodySize = getBodySize(fifth);
            boolean fifthStrong = fifthBodySize >= 0.6 * fifthRange;
            boolean fifthBreaksDown = fifth.getClose() < first.getClose();
            
            boolean inDowntrend = hasDowntrend(candles, i - 4, 3);

            if (firstBearish && firstStrong && 
                    middleInRange && middleSmall && middleShowsPullback &&
                    fifthBearish && fifthStrong && fifthBreaksDown &&
                    inDowntrend) {
                fallingThreePatterns.add(fifth);
            }
        }
        return fallingThreePatterns;
    }


    @Override
    public List<CandleStick> getRisingThreePatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> risingThreePatterns = new ArrayList<>();

        for (int i = 6; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 4);
            CandleStick second = candles.get(i - 3);
            CandleStick third = candles.get(i - 2);
            CandleStick fourth = candles.get(i - 1);
            CandleStick fifth = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double fifthRange = getTotalRange(fifth);
            if (firstRange == 0 || fifthRange == 0) continue;

            // Rising Three Methods criteria (bullish continuation):
            // 1. First candle: Long bullish (establishes uptrend)
            // 2. Next three candles: Small-bodied, consolidation within first's range
            // 3. Middle candles preferably bearish (counter-trend pullback)
            // 4. Fifth candle: Long bullish, closes above first's close
            // 5. Appears during uptrend
            // Shows temporary pause before uptrend resumes
            
            boolean firstBullish = isBullish(first);
            double firstBodySize = getBodySize(first);
            boolean firstStrong = firstBodySize >= 0.6 * firstRange;
            
            // Middle three candles: should stay within first's range
            boolean secondInRange = second.getHigh() <= first.getClose() && 
                    second.getLow() >= first.getOpen();
            boolean thirdInRange = third.getHigh() <= first.getClose() && 
                    third.getLow() >= first.getOpen();
            boolean fourthInRange = fourth.getHigh() <= first.getClose() && 
                    fourth.getLow() >= first.getOpen();
            boolean middleInRange = secondInRange && thirdInRange && fourthInRange;
            
            // Middle candles should be small-bodied (consolidation)
            double secondBody = getBodySize(second);
            double thirdBody = getBodySize(third);
            double fourthBody = getBodySize(fourth);
            boolean middleSmall = secondBody < 0.5 * firstBodySize &&
                    thirdBody < 0.5 * firstBodySize &&
                    fourthBody < 0.5 * firstBodySize;
            
            // Preferably, middle candles are bearish (pullback)
            int bearishCount = 0;
            if (isBearish(second)) bearishCount++;
            if (isBearish(third)) bearishCount++;
            if (isBearish(fourth)) bearishCount++;
            boolean middleShowsPullback = bearishCount >= 2;
            
            // Fifth: Strong bullish breakout
            boolean fifthBullish = isBullish(fifth);
            double fifthBodySize = getBodySize(fifth);
            boolean fifthStrong = fifthBodySize >= 0.6 * fifthRange;
            boolean fifthBreaksUp = fifth.getClose() > first.getClose();
            // Fifth should also open above first's open for confirmation
            boolean fifthOpensStrong = fifth.getOpen() >= first.getOpen();
            
            boolean inUptrend = hasUptrend(candles, i - 4, 3);

            if (firstBullish && firstStrong && 
                    middleInRange && middleSmall && middleShowsPullback &&
                    fifthBullish && fifthStrong && fifthBreaksUp && fifthOpensStrong &&
                    inUptrend) {
                risingThreePatterns.add(fifth);
            }
        }
        return risingThreePatterns;
    }


    @Override
    public List<CandleStick> getDownsideTasukiGapPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> downsideTasukiGapPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            double thirdRange = getTotalRange(third);
            if (firstRange == 0 || secondRange == 0 || thirdRange == 0) continue;

            // Downside Tasuki Gap criteria (bearish continuation):
            // 1. First candle: Bearish
            // 2. Second candle: Bearish with GAP DOWN (continuing downtrend)
            // 3. Third candle: Bullish (attempts to fill gap)
            // 4. Third closes WITHIN the gap but NOT above second's open
            // 5. Gap should NOT be completely filled (shows downtrend strength)
            // 6. Appears during downtrend
            // Pattern confirms downtrend when gap holds
            
            boolean firstBearish = isBearish(first);
            double firstBodySize = getBodySize(first);
            boolean firstSignificant = firstBodySize >= 0.5 * firstRange;
            
            // Second: Bearish with gap down
            boolean secondBearish = isBearish(second);
            boolean hasGapDown = second.getHigh() < first.getLow(); // TRUE gap
            double secondBodySize = getBodySize(second);
            boolean secondSignificant = secondBodySize >= 0.5 * secondRange;
            
            // Third: Bullish but fails to fill gap
            boolean thirdBullish = isBullish(third);
            boolean thirdTriesToFillGap = third.getOpen() < second.getClose();
            boolean thirdPartiallyFillsGap = third.getClose() > second.getClose() && 
                    third.getClose() < second.getOpen();
            boolean gapNotCompletelyFilled = third.getClose() < first.getLow();
            
            boolean inDowntrend = hasDowntrend(candles, i - 2, 3);

            if (firstBearish && firstSignificant && 
                    secondBearish && secondSignificant && hasGapDown &&
                    thirdBullish && thirdTriesToFillGap && thirdPartiallyFillsGap && 
                    gapNotCompletelyFilled &&
                    inDowntrend) {
                downsideTasukiGapPatterns.add(third);
            }
        }
        return downsideTasukiGapPatterns;
    }

    @Override
    public List<CandleStick> getUpsideGapTwoCrowsPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> upsideGapTwoCrowsPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            double thirdRange = getTotalRange(third);
            if (firstRange == 0 || secondRange == 0 || thirdRange == 0) continue;

            // Upside Gap Two Crows criteria (bearish reversal warning):
            // 1. First candle: Strong bullish (continuing uptrend)
            // 2. Second candle: Bearish with GAP UP (shows weakness despite gap)
            // 3. Third candle: Larger bearish, engulfs second but stays above first
            // 4. Gap between first and second remains (no overlap)
            // 5. Appears after uptrend
            // Two "crows" (bearish candles) appear above the bullish candle
            
            boolean firstBullish = isBullish(first);
            double firstBodySize = getBodySize(first);
            boolean firstStrong = firstBodySize >= 0.6 * firstRange;
            boolean firstHasMinimalShadows = (getUpperShadow(first) + getLowerShadow(first)) 
                    <= 0.4 * firstRange;
            
            // Second: Bearish with gap up (unexpected weakness)
            boolean secondBearish = isBearish(second);
            boolean hasGapUp = second.getOpen() > first.getClose() && 
                    second.getClose() > first.getClose();
            
            // Third: Larger bearish, engulfs second
            boolean thirdBearish = isBearish(third);
            boolean thirdEngulfsSecond = third.getOpen() > second.getOpen() &&
                    third.getClose() < second.getClose();
            double thirdBodySize = getBodySize(third);
            double secondBodySize = getBodySize(second);
            boolean thirdLargerThanSecond = thirdBodySize > secondBodySize;
            
            // Third should close above first (maintains gap)
            boolean thirdClosesAboveFirst = third.getClose() > first.getClose();
            
            boolean inUptrend = hasUptrend(candles, i - 2, 3);

            if (firstBullish && firstStrong && firstHasMinimalShadows &&
                    secondBearish && hasGapUp &&
                    thirdBearish && thirdEngulfsSecond && thirdLargerThanSecond && 
                    thirdClosesAboveFirst &&
                    inUptrend) {
                upsideGapTwoCrowsPatterns.add(third);
            }
        }

        return upsideGapTwoCrowsPatterns;
    }

    @Override
    public List<CandleStick> getUpsideTasukiGapPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> upsideTasukiGapPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            double thirdRange = getTotalRange(third);
            if (firstRange == 0 || secondRange == 0 || thirdRange == 0) continue;

            // Upside Tasuki Gap criteria (bullish continuation):
            // 1. First candle: Bullish
            // 2. Second candle: Bullish with GAP UP (continuing uptrend)
            // 3. Third candle: Bearish (attempts to fill gap)
            // 4. Third closes WITHIN the gap but NOT below second's open
            // 5. Gap should NOT be completely filled (shows uptrend strength)
            // 6. Appears during uptrend
            // Pattern confirms uptrend when gap holds
            
            boolean firstBullish = isBullish(first);
            double firstBodySize = getBodySize(first);
            boolean firstSignificant = firstBodySize >= 0.5 * firstRange;
            
            // Second: Bullish with gap up
            boolean secondBullish = isBullish(second);
            boolean hasGapUp = second.getLow() > first.getHigh(); // TRUE gap
            double secondBodySize = getBodySize(second);
            boolean secondSignificant = secondBodySize >= 0.5 * secondRange;
            
            // Third: Bearish but fails to fill gap
            boolean thirdBearish = isBearish(third);
            boolean thirdTriesToFillGap = third.getOpen() > second.getClose();
            boolean thirdPartiallyFillsGap = third.getClose() < second.getClose() && 
                    third.getClose() > second.getOpen();
            boolean gapNotCompletelyFilled = third.getClose() > first.getHigh();
            
            boolean inUptrend = hasUptrend(candles, i - 2, 3);

            if (firstBullish && firstSignificant && 
                    secondBullish && secondSignificant && hasGapUp &&
                    thirdBearish && thirdTriesToFillGap && thirdPartiallyFillsGap && 
                    gapNotCompletelyFilled &&
                    inUptrend) {
                upsideTasukiGapPatterns.add(third);
            }
        }
        return upsideTasukiGapPatterns;
    }

    @Override
    public List<CandleStick> getEveningStarDojiPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> eveningStarDojiPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            double thirdRange = getTotalRange(third);
            if (firstRange == 0 || secondRange == 0 || thirdRange == 0) continue;

            // Evening Star Doji criteria (stronger bearish reversal than regular Evening Star):
            // 1. First candle: Strong bullish
            // 2. Second candle: TRUE DOJI (not just small body) with gap up
            // 3. Third candle: Bearish, closes below first's midpoint
            // 4. Gaps preferred (not required) between candles
            // 5. Appears after uptrend
            // Doji shows complete indecision at the top
            
            boolean firstBullish = isBullish(first);
            double firstBodySize = getBodySize(first);
            boolean firstStrong = firstBodySize >= 0.6 * firstRange;
            
            // Second: MUST be TRUE Doji (using isDoji helper)
            boolean secondIsDoji = isDoji(second);
            boolean secondGapsUp = second.getLow() > first.getClose() || 
                    second.getClose() > first.getClose();
            
            // Third: Strong bearish penetration
            boolean thirdBearish = isBearish(third);
            double thirdBodySize = getBodySize(third);
            boolean thirdStrong = thirdBodySize >= 0.5 * thirdRange;
            
            double firstMidpoint = (first.getOpen() + first.getClose()) / 2;
            boolean thirdPenetratesMidpoint = third.getClose() < firstMidpoint;
            
            // Gap down from second to third (preferred)
            boolean thirdGapsDown = third.getClose() < second.getLow();
            
            boolean inUptrend = hasUptrend(candles, i - 2, 3);

            if (firstBullish && firstStrong && 
                    secondIsDoji && secondGapsUp &&
                    thirdBearish && thirdStrong && thirdPenetratesMidpoint &&
                    inUptrend) {
                eveningStarDojiPatterns.add(third);
            }
        }
        return eveningStarDojiPatterns;
    }

    @Override
    public List<CandleStick> getMorningStarDojiPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> morningStarDojiPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            double thirdRange = getTotalRange(third);
            if (firstRange == 0 || secondRange == 0 || thirdRange == 0) continue;

            // Morning Star Doji criteria (stronger bullish reversal than regular Morning Star):
            // 1. First candle: Strong bearish
            // 2. Second candle: TRUE DOJI (not just small body) with gap down
            // 3. Third candle: Bullish, closes above first's midpoint
            // 4. Gaps preferred (not required) between candles
            // 5. Appears after downtrend
            // Doji shows complete indecision at the bottom
            
            boolean firstBearish = isBearish(first);
            double firstBodySize = getBodySize(first);
            boolean firstStrong = firstBodySize >= 0.6 * firstRange;
            
            // Second: MUST be TRUE Doji (using isDoji helper)
            boolean secondIsDoji = isDoji(second);
            boolean secondGapsDown = second.getHigh() < first.getClose() || 
                    second.getClose() < first.getClose();
            
            // Third: Strong bullish recovery
            boolean thirdBullish = isBullish(third);
            double thirdBodySize = getBodySize(third);
            boolean thirdStrong = thirdBodySize >= 0.5 * thirdRange;
            
            double firstMidpoint = (first.getOpen() + first.getClose()) / 2;
            boolean thirdPenetratesMidpoint = third.getClose() > firstMidpoint;
            
            // Gap up from second to third (preferred)
            boolean thirdGapsUp = third.getClose() > second.getHigh();
            
            boolean inDowntrend = hasDowntrend(candles, i - 2, 3);

            if (firstBearish && firstStrong && 
                    secondIsDoji && secondGapsDown &&
                    thirdBullish && thirdStrong && thirdPenetratesMidpoint &&
                    inDowntrend) {
                morningStarDojiPatterns.add(third);
            }
        }
        return morningStarDojiPatterns;
    }

    @Override
    public List<CandleStick> getBearishTriStarPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bearishTriStarPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            double thirdRange = getTotalRange(third);
            if (firstRange == 0 || secondRange == 0 || thirdRange == 0) continue;

            // Bearish Tri-Star criteria (VERY RARE bearish reversal):
            // 1. Three consecutive TRUE Doji candles
            // 2. Second Doji must be HIGHER (forms peak)
            // 3. Gaps should exist between Dojis (rare condition)
            // 4. Appears after uptrend
            // Extreme indecision at the top signals reversal
            
            boolean firstIsDoji = isDoji(first);
            boolean secondIsDoji = isDoji(second);
            boolean thirdIsDoji = isDoji(third);
            
            // Second must form peak (highest high)
            boolean secondFormsPeak = second.getHigh() > first.getHigh() &&
                    second.getHigh() > third.getHigh();
            
            // Preferably with gaps (makes it even rarer)
            boolean hasGapUpToSecond = second.getLow() > first.getHigh();
            boolean hasGapDownFromSecond = third.getHigh() < second.getLow();
            boolean hasGaps = hasGapUpToSecond && hasGapDownFromSecond;
            
            boolean inUptrend = hasUptrend(candles, i - 2, 3);

            // Pattern is valid even without gaps, but stronger with them
            if (firstIsDoji && secondIsDoji && thirdIsDoji && 
                    secondFormsPeak && 
                    inUptrend) {
                bearishTriStarPatterns.add(third);
            }
        }
        return bearishTriStarPatterns;
    }


    @Override
    public List<CandleStick> getBullishTriStarPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bullishTriStarPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            double thirdRange = getTotalRange(third);
            if (firstRange == 0 || secondRange == 0 || thirdRange == 0) continue;

            // Bullish Tri-Star criteria (VERY RARE bullish reversal):
            // 1. Three consecutive TRUE Doji candles
            // 2. Second Doji must be LOWER (forms valley)
            // 3. Gaps should exist between Dojis (rare condition)
            // 4. Appears after downtrend
            // Extreme indecision at the bottom signals reversal
            
            boolean firstIsDoji = isDoji(first);
            boolean secondIsDoji = isDoji(second);
            boolean thirdIsDoji = isDoji(third);
            
            // Second must form valley (lowest low)
            boolean secondFormsValley = second.getLow() < first.getLow() &&
                    second.getLow() < third.getLow();
            
            // Preferably with gaps (makes it even rarer)
            boolean hasGapDownToSecond = second.getHigh() < first.getLow();
            boolean hasGapUpFromSecond = third.getLow() > second.getHigh();
            boolean hasGaps = hasGapDownToSecond && hasGapUpFromSecond;
            
            boolean inDowntrend = hasDowntrend(candles, i - 2, 3);

            // Pattern is valid even without gaps, but stronger with them
            if (firstIsDoji && secondIsDoji && thirdIsDoji && 
                    secondFormsValley && 
                    inDowntrend) {
                bullishTriStarPatterns.add(third);
            }
        }
        return bullishTriStarPatterns;
    }

    @Override
    public List<CandleStick> getMatchingLowPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> matchingLowPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 1);
            CandleStick second = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            if (firstRange == 0 || secondRange == 0) continue;

            // Matching Low criteria (bullish reversal):
            // 1. Two consecutive candles (preferably bearish)
            // 2. Both close at nearly IDENTICAL prices at/near the lows (support level)
            // 3. Close prices match within 0.3% tolerance
            // 4. Appears after downtrend
            // Shows strong support at this price level
            
            boolean firstBearish = isBearish(first);
            boolean secondBearish = isBearish(second);
            
            // Close prices should match precisely using pricesMatch helper
            boolean closesMatch = pricesMatch(first.getClose(), second.getClose(), PRICE_TOLERANCE);
            
            // Both should have significant bodies (not just dojis)
            double firstBodySize = getBodySize(first);
            double secondBodySize = getBodySize(second);
            boolean bothSignificant = firstBodySize >= 0.4 * firstRange && 
                    secondBodySize >= 0.4 * secondRange;
            
            boolean inDowntrend = hasDowntrend(candles, i - 1, 3);

            if (firstBearish && secondBearish && 
                    closesMatch && bothSignificant && 
                    inDowntrend) {
                matchingLowPatterns.add(second);
            }
        }

        return matchingLowPatterns;
    }

    @Override
    public List<CandleStick> getMatchingHighPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> matchingHighPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 1);
            CandleStick second = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            if (firstRange == 0 || secondRange == 0) continue;

            // Matching High criteria (bearish reversal):
            // 1. Two consecutive candles (preferably bullish)
            // 2. Both close at nearly IDENTICAL prices at/near the highs (resistance level)
            // 3. Close prices match within 0.3% tolerance
            // 4. Appears after uptrend
            // Shows strong resistance at this price level
            
            boolean firstBullish = isBullish(first);
            boolean secondBullish = isBullish(second);
            
            // Close prices should match precisely using pricesMatch helper
            boolean closesMatch = pricesMatch(first.getClose(), second.getClose(), PRICE_TOLERANCE);
            
            // Both should have significant bodies (not just dojis)
            double firstBodySize = getBodySize(first);
            double secondBodySize = getBodySize(second);
            boolean bothSignificant = firstBodySize >= 0.4 * firstRange && 
                    secondBodySize >= 0.4 * secondRange;
            
            boolean inUptrend = hasUptrend(candles, i - 1, 3);

            if (firstBullish && secondBullish && 
                    closesMatch && bothSignificant && 
                    inUptrend) {
                matchingHighPatterns.add(second);
            }
        }

        return matchingHighPatterns;
    }

    @Override
    public List<CandleStick> getBearishBeltHold(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bearishBeltHoldCandles = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick candle = candles.get(i);
            double totalRange = getTotalRange(candle);
            if (totalRange == 0) continue;
            
            // Bearish Belt Hold criteria (bearish reversal):
            // 1. Opens at or near the HIGH of the session
            // 2. Bearish with long body (70%+ of range)
            // 3. Minimal upper shadow (opens at top)
            // 4. Can have lower shadow
            // 5. Appears after uptrend
            // Also known as "Yorikiri" - strong opening followed by selling pressure
            
            boolean bearish = isBearish(candle);
            double bodySize = getBodySize(candle);
            boolean largeBody = bodySize >= 0.7 * totalRange;
            
            // Upper shadow must be minimal (opens near high)
            double upperShadow = getUpperShadow(candle);
            boolean opensNearHigh = upperShadow <= 0.1 * totalRange;
            
            // Can have lower shadow (selling pressure throughout day)
            double lowerShadow = getLowerShadow(candle);
            
            boolean inUptrend = hasUptrend(candles, i, 3);

            if (bearish && largeBody && opensNearHigh && inUptrend) {
                bearishBeltHoldCandles.add(candle);
            }
        }
        return bearishBeltHoldCandles;
    }

    @Override
    public List<CandleStick> getBullishBeltHold(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bullishBeltHoldCandles = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick candle = candles.get(i);
            double totalRange = getTotalRange(candle);
            if (totalRange == 0) continue;
            
            // Bullish Belt Hold criteria (bullish reversal):
            // 1. Opens at or near the LOW of the session
            // 2. Bullish with long body (70%+ of range)
            // 3. Minimal lower shadow (opens at bottom)
            // 4. Can have upper shadow
            // 5. Appears after downtrend
            // Also known as "Yorikiri" - strong opening followed by buying pressure
            
            boolean bullish = isBullish(candle);
            double bodySize = getBodySize(candle);
            boolean largeBody = bodySize >= 0.7 * totalRange;
            
            // Lower shadow must be minimal (opens near low)
            double lowerShadow = getLowerShadow(candle);
            boolean opensNearLow = lowerShadow <= 0.1 * totalRange;
            
            // Can have upper shadow (buying pressure throughout day)
            double upperShadow = getUpperShadow(candle);
            
            boolean inDowntrend = hasDowntrend(candles, i, 3);

            if (bullish && largeBody && opensNearLow && inDowntrend) {
                bullishBeltHoldCandles.add(candle);
            }
        }
        return bullishBeltHoldCandles;
    }


    @Override
    public List<CandleStick> getBearishThreeLineStrikePatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bearishThreeLineStrikePatterns = new ArrayList<>();

        for (int i = 5; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 3);
            CandleStick second = candles.get(i - 2);
            CandleStick third = candles.get(i - 1);
            CandleStick fourth = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double fourthRange = getTotalRange(fourth);
            if (firstRange == 0 || fourthRange == 0) continue;

            // Bearish Three Line Strike criteria (bullish continuation - counterintuitive!):
            // 1. Three consecutive bullish candles with higher closes
            // 2. Fourth candle: Opens above third's close
            // 3. Fourth candle: Bearish and engulfs ALL three previous candles
            // 4. Fourth closes below first's open
            // 5. Appears during uptrend
            // Despite bearish appearance, this is a BULLISH continuation pattern (81% accuracy per Bulkowski)
            
            boolean firstBullish = isBullish(first);
            boolean secondBullish = isBullish(second);
            boolean thirdBullish = isBullish(third);
            boolean allBullish = firstBullish && secondBullish && thirdBullish;
            
            // Progressive higher closes
            boolean higherCloses = first.getClose() < second.getClose() && 
                    second.getClose() < third.getClose();
            
            // Fourth: Bearish and reverses entire range
            boolean fourthBearish = isBearish(fourth);
            boolean fourthOpensAbove = fourth.getOpen() > third.getClose();
            boolean fourthEngulfsAll = fourth.getClose() < first.getOpen();
            double fourthBodySize = getBodySize(fourth);
            boolean fourthStrong = fourthBodySize >= 0.6 * fourthRange;
            
            boolean inUptrend = hasUptrend(candles, i - 3, 3);

            if (allBullish && higherCloses && 
                    fourthBearish && fourthOpensAbove && fourthEngulfsAll && fourthStrong &&
                    inUptrend) {
                bearishThreeLineStrikePatterns.add(fourth);
            }
        }

        return bearishThreeLineStrikePatterns;
    }

    @Override
    public List<CandleStick> getBearishHaramiCrossPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bearishHaramiCrossPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 1);
            CandleStick second = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            if (firstRange == 0 || secondRange == 0) continue;

            // Bearish Harami Cross criteria (bearish reversal - stronger than regular Harami):
            // 1. First candle: Strong bullish
            // 2. Second candle: TRUE DOJI (not just small body)
            // 3. Doji completely contained within first's body
            // 4. Appears after uptrend
            // Doji shows indecision after strong bullish move - warning signal
            
            boolean firstBullish = isBullish(first);
            double firstBodySize = getBodySize(first);
            boolean firstStrong = firstBodySize >= 0.6 * firstRange;
            
            // Second: MUST be TRUE Doji using isDoji helper
            boolean secondIsDoji = isDoji(second);
            
            // Doji must be contained within first's body
            boolean secondWithinFirstBody = second.getHigh() <= first.getClose() &&
                    second.getLow() >= first.getOpen();
            
            boolean inUptrend = hasUptrend(candles, i - 1, 3);

            if (firstBullish && firstStrong && 
                    secondIsDoji && secondWithinFirstBody && 
                    inUptrend) {
                bearishHaramiCrossPatterns.add(second);
            }
        }
        return bearishHaramiCrossPatterns;
    }

    @Override
    public List<CandleStick> getBullishHaramiCrossPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bullishHaramiCrossPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 1);
            CandleStick second = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            if (firstRange == 0 || secondRange == 0) continue;

            // Bullish Harami Cross criteria (bullish reversal - stronger than regular Harami):
            // 1. First candle: Strong bearish
            // 2. Second candle: TRUE DOJI (not just small body)
            // 3. Doji completely contained within first's body
            // 4. Appears after downtrend
            // Doji shows indecision after strong bearish move - warning signal
            
            boolean firstBearish = isBearish(first);
            double firstBodySize = getBodySize(first);
            boolean firstStrong = firstBodySize >= 0.6 * firstRange;
            
            // Second: MUST be TRUE Doji using isDoji helper
            boolean secondIsDoji = isDoji(second);
            
            // Doji must be contained within first's body
            boolean secondWithinFirstBody = second.getHigh() <= first.getOpen() &&
                    second.getLow() >= first.getClose();
            
            boolean inDowntrend = hasDowntrend(candles, i - 1, 3);

            if (firstBearish && firstStrong && 
                    secondIsDoji && secondWithinFirstBody && 
                    inDowntrend) {
                bullishHaramiCrossPatterns.add(second);
            }
        }
        return bullishHaramiCrossPatterns;
    }

    @Override
    public List<CandleStick> getBearishCounterattackPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bearishCounterattackPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 1);
            CandleStick second = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            if (firstRange == 0 || secondRange == 0) continue;

            // Bearish Counterattack criteria (bearish reversal):
            // 1. First candle: Strong bullish
            // 2. Second candle: Opens HIGHER (gap up), then bearish
            // 3. Second CLOSES at same level as first's close (within 0.3%)
            // 4. Both have strong bodies
            // 5. Appears after uptrend
            // Shows buyers being overwhelmed despite strong opening
            
            boolean firstBullish = isBullish(first);
            double firstBodySize = getBodySize(first);
            boolean firstStrong = firstBodySize >= 0.6 * firstRange;
            
            boolean secondBearish = isBearish(second);
            double secondBodySize = getBodySize(second);
            boolean secondStrong = secondBodySize >= 0.6 * secondRange;
            
            // Second should open higher (shows initial strength)
            boolean secondOpensHigher = second.getOpen() > first.getClose();
            
            // Close prices must match (counterattack at same level)
            boolean closesMatch = pricesMatch(first.getClose(), second.getClose(), PRICE_TOLERANCE);
            
            boolean inUptrend = hasUptrend(candles, i - 1, 3);

            if (firstBullish && firstStrong && 
                    secondBearish && secondStrong && secondOpensHigher && 
                    closesMatch && 
                    inUptrend) {
                bearishCounterattackPatterns.add(second);
            }
        }
        return bearishCounterattackPatterns;
    }

    @Override
    public List<CandleStick> getBullishCounterattackPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bullishCounterattackPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 1);
            CandleStick second = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            if (firstRange == 0 || secondRange == 0) continue;

            // Bullish Counterattack criteria (bullish reversal):
            // 1. First candle: Strong bearish
            // 2. Second candle: Opens LOWER (gap down), then bullish
            // 3. Second CLOSES at same level as first's close (within 0.3%)
            // 4. Both have strong bodies
            // 5. Appears after downtrend
            // Shows sellers being overwhelmed despite strong opening
            
            boolean firstBearish = isBearish(first);
            double firstBodySize = getBodySize(first);
            boolean firstStrong = firstBodySize >= 0.6 * firstRange;
            
            boolean secondBullish = isBullish(second);
            double secondBodySize = getBodySize(second);
            boolean secondStrong = secondBodySize >= 0.6 * secondRange;
            
            // Second should open lower (shows initial weakness)
            boolean secondOpensLower = second.getOpen() < first.getClose();
            
            // Close prices must match (counterattack at same level)
            boolean closesMatch = pricesMatch(first.getClose(), second.getClose(), PRICE_TOLERANCE);
            
            boolean inDowntrend = hasDowntrend(candles, i - 1, 3);

            if (firstBearish && firstStrong && 
                    secondBullish && secondStrong && secondOpensLower && 
                    closesMatch && 
                    inDowntrend) {
                bullishCounterattackPatterns.add(second);
            }
        }
        return bullishCounterattackPatterns;
    }


    @Override
    public List<CandleStick> getBullishThreeLineStrikePatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> bullishThreeLineStrikePatterns = new ArrayList<>();

        for (int i = 5; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 3);
            CandleStick second = candles.get(i - 2);
            CandleStick third = candles.get(i - 1);
            CandleStick fourth = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double fourthRange = getTotalRange(fourth);
            if (firstRange == 0 || fourthRange == 0) continue;

            // Bullish Three Line Strike criteria (bearish continuation - counterintuitive!):
            // 1. Three consecutive bearish candles with lower closes
            // 2. Fourth candle: Opens below third's close
            // 3. Fourth candle: Bullish and engulfs ALL three previous candles
            // 4. Fourth closes above first's open
            // 5. Appears during downtrend
            // Despite bullish appearance, this is a BEARISH continuation pattern (65% accuracy per Bulkowski)
            
            boolean firstBearish = isBearish(first);
            boolean secondBearish = isBearish(second);
            boolean thirdBearish = isBearish(third);
            boolean allBearish = firstBearish && secondBearish && thirdBearish;
            
            // Progressive lower closes
            boolean lowerCloses = first.getClose() > second.getClose() && 
                    second.getClose() > third.getClose();
            
            // Fourth: Bullish and reverses entire range
            boolean fourthBullish = isBullish(fourth);
            boolean fourthOpensBelow = fourth.getOpen() < third.getClose();
            boolean fourthEngulfsAll = fourth.getClose() > first.getOpen();
            double fourthBodySize = getBodySize(fourth);
            boolean fourthStrong = fourthBodySize >= 0.6 * fourthRange;
            
            boolean inDowntrend = hasDowntrend(candles, i - 3, 3);

            if (allBearish && lowerCloses && 
                    fourthBullish && fourthOpensBelow && fourthEngulfsAll && fourthStrong &&
                    inDowntrend) {
                bullishThreeLineStrikePatterns.add(fourth);
            }
        }

        return bullishThreeLineStrikePatterns;
    }

    @Override
    public List<CandleStick> getLadderTopPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockIdOrderByIdAsc(stockId);
        List<CandleStick> ladderTopPatterns = new ArrayList<>();

        for (int i = 6; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 4);
            CandleStick second = candles.get(i - 3);
            CandleStick third = candles.get(i - 2);
            CandleStick fourth = candles.get(i - 1);
            CandleStick fifth = candles.get(i);
            
            double firstRange = getTotalRange(first);
            double secondRange = getTotalRange(second);
            double thirdRange = getTotalRange(third);
            double fourthRange = getTotalRange(fourth);
            double fifthRange = getTotalRange(fifth);
            if (firstRange == 0 || secondRange == 0 || thirdRange == 0 || 
                    fourthRange == 0 || fifthRange == 0) continue;

            // Ladder Top criteria (5-candle bearish reversal):
            // 1. First three candles: Consecutive bullish with higher closes
            // 2. All three must have strong bodies (60%+ of range)
            // 3. Fourth candle: Weak or hesitation (small body, Doji, or small bullish)
            // 4. Fifth candle: Bearish, closes below fourth's open
            // 5. Fifth has strong body (60%+)
            // 6. Pattern appears during uptrend
            // Indicates exhaustion at top, sellers taking control (top reversal)
            
            boolean firstBullish = isBullish(first);
            boolean secondBullish = isBullish(second);
            boolean thirdBullish = isBullish(third);
            boolean firstThreeBullish = firstBullish && secondBullish && thirdBullish;
            
            // Progressive higher closes
            boolean higherCloses = first.getClose() < second.getClose() && 
                    second.getClose() < third.getClose();
            
            // Strong bodies for first three
            double firstBodySize = getBodySize(first);
            double secondBodySize = getBodySize(second);
            double thirdBodySize = getBodySize(third);
            boolean firstThreeStrong = (firstBodySize >= 0.6 * firstRange) &&
                    (secondBodySize >= 0.6 * secondRange) &&
                    (thirdBodySize >= 0.6 * thirdRange);
            
            // Fourth: Weak or hesitation (small body, Doji, or small bullish)
            double fourthBodySize = getBodySize(fourth);
            boolean fourthWeak = (fourthBodySize <= SMALL_BODY_THRESHOLD * fourthRange) || 
                    isDoji(fourth) ||
                    (isBullish(fourth) && fourthBodySize <= 0.4 * fourthRange);
            
            // Fifth: Bearish reversal with strong body
            boolean fifthBearish = isBearish(fifth);
            boolean fifthClosesBelowFourth = fifth.getClose() < fourth.getOpen();
            double fifthBodySize = getBodySize(fifth);
            boolean fifthStrong = fifthBodySize >= 0.6 * fifthRange;
            
            boolean inUptrend = hasUptrend(candles, i - 4, 4);

            if (firstThreeBullish && higherCloses && firstThreeStrong &&
                    fourthWeak &&
                    fifthBearish && fifthClosesBelowFourth && fifthStrong &&
                    inUptrend) {
                ladderTopPatterns.add(fifth);
            }
        }

        return ladderTopPatterns;
    }


}

