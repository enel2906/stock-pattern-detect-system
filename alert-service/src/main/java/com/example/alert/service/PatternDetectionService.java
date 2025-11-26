package com.example.alert.service;

import com.example.alert.domain.CandleStick;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service to detect candlestick patterns
 * Implements pattern detection logic for alert rules
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PatternDetectionService {
    
    /**
     * Detect if a pattern exists in the candle data
     * Returns true if pattern is found at the most recent candle
     */
    public boolean detectPattern(String patternKey, List<CandleStick> candleData) {
        if (candleData == null || candleData.isEmpty()) {
            return false;
        }
        
        int index = candleData.size() - 1;
        patternKey = patternKey.toLowerCase();
        
        try {
            // Map pattern keys to detection methods
            switch (patternKey) {
                // Single candle patterns
                case "hammer":
                    return isHammer(candleData, index);
                    
                case "inverted_hammer":
                    return isInvertedHammer(candleData, index);
                    
                case "doji":
                    return isDoji(candleData, index);
                    
                case "shooting_star":
                    return isShootingStar(candleData, index);
                    
                case "hanging_man":
                    return isHangingMan(candleData, index);
                    
                case "dragonfly_doji":
                    return isDragonflyDoji(candleData, index);
                    
                case "gravestone_doji":
                    return isGravestoneDoji(candleData, index);
                    
                case "spinning_top":
                    return isSpinningTop(candleData, index);
                    
                case "marubozu":
                    return isMarubozu(candleData, index);
                    
                // Two candle patterns
                case "bullish_engulfing":
                    return isBullishEngulfing(candleData, index);
                    
                case "bearish_engulfing":
                    return isBearishEngulfing(candleData, index);
                    
                case "bullish_harami":
                    return isBullishHarami(candleData, index);
                    
                case "bearish_harami":
                    return isBearishHarami(candleData, index);
                    
                case "piercing_line":
                    return isPiercingLine(candleData, index);
                    
                case "dark_cloud_cover":
                    return isDarkCloudCover(candleData, index);
                    
                case "tweezer_top":
                    return isTweezerTop(candleData, index);
                    
                case "tweezer_bottom":
                    return isTweezerBottom(candleData, index);
                    
                // Three candle patterns
                case "morning_star":
                    return isMorningStar(candleData, index);
                    
                case "evening_star":
                    return isEveningStar(candleData, index);
                    
                case "three_white_soldiers":
                    return isThreeWhiteSoldiers(candleData, index);
                    
                case "three_black_crows":
                    return isThreeBlackCrows(candleData, index);
                    
                case "three_inside_up":
                    return isThreeInsideUp(candleData, index);
                    
                case "three_inside_down":
                    return isThreeInsideDown(candleData, index);
                    
                default:
                    log.warn("Unknown pattern: {}", patternKey);
                    return false;
            }
        } catch (Exception e) {
            log.error("Error detecting pattern {}: {}", patternKey, e.getMessage());
            return false;
        }
    }
    
    // Helper methods for pattern detection
    private double getBodySize(CandleStick candle) {
        return Math.abs(candle.getClose() - candle.getOpen());
    }
    
    private double getUpperShadow(CandleStick candle) {
        return candle.getHigh() - Math.max(candle.getOpen(), candle.getClose());
    }
    
    private double getLowerShadow(CandleStick candle) {
        return Math.min(candle.getOpen(), candle.getClose()) - candle.getLow();
    }
    
    private double getRange(CandleStick candle) {
        return candle.getHigh() - candle.getLow();
    }
    
    private boolean isBullish(CandleStick candle) {
        return candle.getClose() > candle.getOpen();
    }
    
    private boolean isBearish(CandleStick candle) {
        return candle.getClose() < candle.getOpen();
    }
    
    // Single candle pattern detection methods
    private boolean isHammer(List<CandleStick> candleData, int index) {
        if (index < 0 || index >= candleData.size()) return false;
        CandleStick candle = candleData.get(index);
        
        double body = getBodySize(candle);
        double lowerShadow = getLowerShadow(candle);
        double upperShadow = getUpperShadow(candle);
        
        return lowerShadow >= 2 * body && upperShadow <= 0.1 * body && body > 0;
    }
    
    private boolean isInvertedHammer(List<CandleStick> candleData, int index) {
        if (index < 0 || index >= candleData.size()) return false;
        CandleStick candle = candleData.get(index);
        
        double body = getBodySize(candle);
        double upperShadow = getUpperShadow(candle);
        double lowerShadow = getLowerShadow(candle);
        
        return upperShadow >= 2 * body && lowerShadow <= 0.1 * body && body > 0;
    }
    
    private boolean isDoji(List<CandleStick> candleData, int index) {
        if (index < 0 || index >= candleData.size()) return false;
        CandleStick candle = candleData.get(index);
        
        double body = getBodySize(candle);
        double range = getRange(candle);
        
        return body <= 0.1 * range;
    }
    
    private boolean isShootingStar(List<CandleStick> candleData, int index) {
        if (index < 1 || index >= candleData.size()) return false;
        CandleStick candle = candleData.get(index);
        CandleStick prev = candleData.get(index - 1);
        
        double body = getBodySize(candle);
        double upperShadow = getUpperShadow(candle);
        double lowerShadow = getLowerShadow(candle);
        
        return upperShadow >= 2 * body && lowerShadow <= 0.1 * body && 
               isBullish(prev) && candle.getOpen() > prev.getClose();
    }
    
    private boolean isHangingMan(List<CandleStick> candleData, int index) {
        if (index < 1 || index >= candleData.size()) return false;
        CandleStick candle = candleData.get(index);
        CandleStick prev = candleData.get(index - 1);
        
        double body = getBodySize(candle);
        double lowerShadow = getLowerShadow(candle);
        double upperShadow = getUpperShadow(candle);
        
        return lowerShadow >= 2 * body && upperShadow <= 0.1 * body && 
               isBullish(prev) && candle.getOpen() > prev.getClose();
    }
    
    private boolean isDragonflyDoji(List<CandleStick> candleData, int index) {
        if (index < 0 || index >= candleData.size()) return false;
        CandleStick candle = candleData.get(index);
        
        double body = getBodySize(candle);
        double upperShadow = getUpperShadow(candle);
        double lowerShadow = getLowerShadow(candle);
        double range = getRange(candle);
        
        return body <= 0.1 * range && upperShadow <= 0.1 * range && lowerShadow > 0.5 * range;
    }
    
    private boolean isGravestoneDoji(List<CandleStick> candleData, int index) {
        if (index < 0 || index >= candleData.size()) return false;
        CandleStick candle = candleData.get(index);
        
        double body = getBodySize(candle);
        double upperShadow = getUpperShadow(candle);
        double lowerShadow = getLowerShadow(candle);
        double range = getRange(candle);
        
        return body <= 0.1 * range && lowerShadow <= 0.1 * range && upperShadow > 0.5 * range;
    }
    
    private boolean isSpinningTop(List<CandleStick> candleData, int index) {
        if (index < 0 || index >= candleData.size()) return false;
        CandleStick candle = candleData.get(index);
        
        double body = getBodySize(candle);
        double upperShadow = getUpperShadow(candle);
        double lowerShadow = getLowerShadow(candle);
        
        return body > 0 && upperShadow >= body && lowerShadow >= body;
    }
    
    private boolean isMarubozu(List<CandleStick> candleData, int index) {
        if (index < 0 || index >= candleData.size()) return false;
        CandleStick candle = candleData.get(index);
        
        double body = getBodySize(candle);
        double upperShadow = getUpperShadow(candle);
        double lowerShadow = getLowerShadow(candle);
        
        return body > 0 && upperShadow <= 0.01 * body && lowerShadow <= 0.01 * body;
    }
    
    // Two candle pattern detection methods
    private boolean isBullishEngulfing(List<CandleStick> candleData, int index) {
        if (index < 1 || index >= candleData.size()) return false;
        CandleStick current = candleData.get(index);
        CandleStick prev = candleData.get(index - 1);
        
        return isBearish(prev) && isBullish(current) &&
               current.getOpen() < prev.getClose() && current.getClose() > prev.getOpen();
    }
    
    private boolean isBearishEngulfing(List<CandleStick> candleData, int index) {
        if (index < 1 || index >= candleData.size()) return false;
        CandleStick current = candleData.get(index);
        CandleStick prev = candleData.get(index - 1);
        
        return isBullish(prev) && isBearish(current) &&
               current.getOpen() > prev.getClose() && current.getClose() < prev.getOpen();
    }
    
    private boolean isBullishHarami(List<CandleStick> candleData, int index) {
        if (index < 1 || index >= candleData.size()) return false;
        CandleStick current = candleData.get(index);
        CandleStick prev = candleData.get(index - 1);
        
        return isBearish(prev) && isBullish(current) &&
               current.getOpen() > prev.getClose() && current.getClose() < prev.getOpen() &&
               getBodySize(current) < getBodySize(prev);
    }
    
    private boolean isBearishHarami(List<CandleStick> candleData, int index) {
        if (index < 1 || index >= candleData.size()) return false;
        CandleStick current = candleData.get(index);
        CandleStick prev = candleData.get(index - 1);
        
        return isBullish(prev) && isBearish(current) &&
               current.getOpen() < prev.getClose() && current.getClose() > prev.getOpen() &&
               getBodySize(current) < getBodySize(prev);
    }
    
    private boolean isPiercingLine(List<CandleStick> candleData, int index) {
        if (index < 1 || index >= candleData.size()) return false;
        CandleStick current = candleData.get(index);
        CandleStick prev = candleData.get(index - 1);
        
        double prevMidpoint = (prev.getOpen() + prev.getClose()) / 2;
        
        return isBearish(prev) && isBullish(current) &&
               current.getOpen() < prev.getLow() && 
               current.getClose() > prevMidpoint && 
               current.getClose() < prev.getOpen();
    }
    
    private boolean isDarkCloudCover(List<CandleStick> candleData, int index) {
        if (index < 1 || index >= candleData.size()) return false;
        CandleStick current = candleData.get(index);
        CandleStick prev = candleData.get(index - 1);
        
        double prevMidpoint = (prev.getOpen() + prev.getClose()) / 2;
        
        return isBullish(prev) && isBearish(current) &&
               current.getOpen() > prev.getHigh() && 
               current.getClose() < prevMidpoint && 
               current.getClose() > prev.getOpen();
    }
    
    private boolean isTweezerTop(List<CandleStick> candleData, int index) {
        if (index < 1 || index >= candleData.size()) return false;
        CandleStick current = candleData.get(index);
        CandleStick prev = candleData.get(index - 1);
        
        double highDiff = Math.abs(current.getHigh() - prev.getHigh());
        double avgHigh = (current.getHigh() + prev.getHigh()) / 2;
        
        return isBullish(prev) && isBearish(current) && 
               highDiff / avgHigh < 0.01; // Highs are within 1%
    }
    
    private boolean isTweezerBottom(List<CandleStick> candleData, int index) {
        if (index < 1 || index >= candleData.size()) return false;
        CandleStick current = candleData.get(index);
        CandleStick prev = candleData.get(index - 1);
        
        double lowDiff = Math.abs(current.getLow() - prev.getLow());
        double avgLow = (current.getLow() + prev.getLow()) / 2;
        
        return isBearish(prev) && isBullish(current) && 
               lowDiff / avgLow < 0.01; // Lows are within 1%
    }
    
    // Three candle pattern detection methods
    private boolean isMorningStar(List<CandleStick> candleData, int index) {
        if (index < 2 || index >= candleData.size()) return false;
        CandleStick first = candleData.get(index - 2);
        CandleStick second = candleData.get(index - 1);
        CandleStick third = candleData.get(index);
        
        return isBearish(first) && 
               getBodySize(second) < getBodySize(first) * 0.3 && 
               isBullish(third) && 
               third.getClose() > (first.getOpen() + first.getClose()) / 2;
    }
    
    private boolean isEveningStar(List<CandleStick> candleData, int index) {
        if (index < 2 || index >= candleData.size()) return false;
        CandleStick first = candleData.get(index - 2);
        CandleStick second = candleData.get(index - 1);
        CandleStick third = candleData.get(index);
        
        return isBullish(first) && 
               getBodySize(second) < getBodySize(first) * 0.3 && 
               isBearish(third) && 
               third.getClose() < (first.getOpen() + first.getClose()) / 2;
    }
    
    private boolean isThreeWhiteSoldiers(List<CandleStick> candleData, int index) {
        if (index < 2 || index >= candleData.size()) return false;
        CandleStick first = candleData.get(index - 2);
        CandleStick second = candleData.get(index - 1);
        CandleStick third = candleData.get(index);
        
        return isBullish(first) && isBullish(second) && isBullish(third) &&
               second.getClose() > first.getClose() && 
               third.getClose() > second.getClose() &&
               second.getOpen() > first.getOpen() && second.getOpen() < first.getClose() &&
               third.getOpen() > second.getOpen() && third.getOpen() < second.getClose();
    }
    
    private boolean isThreeBlackCrows(List<CandleStick> candleData, int index) {
        if (index < 2 || index >= candleData.size()) return false;
        CandleStick first = candleData.get(index - 2);
        CandleStick second = candleData.get(index - 1);
        CandleStick third = candleData.get(index);
        
        return isBearish(first) && isBearish(second) && isBearish(third) &&
               second.getClose() < first.getClose() && 
               third.getClose() < second.getClose() &&
               second.getOpen() < first.getOpen() && second.getOpen() > first.getClose() &&
               third.getOpen() < second.getOpen() && third.getOpen() > second.getClose();
    }
    
    private boolean isThreeInsideUp(List<CandleStick> candleData, int index) {
        if (index < 2 || index >= candleData.size()) return false;
        
        // Check if index-1 and index-2 form bullish harami
        boolean haramiPattern = isBullishHarami(candleData, index - 1);
        if (!haramiPattern) return false;
        
        CandleStick third = candleData.get(index);
        CandleStick second = candleData.get(index - 1);
        
        return isBullish(third) && third.getClose() > second.getClose();
    }
    
    private boolean isThreeInsideDown(List<CandleStick> candleData, int index) {
        if (index < 2 || index >= candleData.size()) return false;
        
        // Check if index-1 and index-2 form bearish harami
        boolean haramiPattern = isBearishHarami(candleData, index - 1);
        if (!haramiPattern) return false;
        
        CandleStick third = candleData.get(index);
        CandleStick second = candleData.get(index - 1);
        
        return isBearish(third) && third.getClose() < second.getClose();
    }
}
