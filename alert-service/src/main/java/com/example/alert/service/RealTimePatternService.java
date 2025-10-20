package com.example.alert.service;

import com.example.alert.domain.CandleStick;
import com.example.alert.model.realtime.RealTimeUpdateDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for real-time pattern detection and broadcasting
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RealTimePatternService {
    
    private final IntradayDataService intradayDataService;
    private final DetectCandlePatternService detectCandlePatternService;
    private final WatchedPatternService watchedPatternService;
    private final SimpMessagingTemplate messagingTemplate;
    
    // Stocks to monitor (can be made configurable)
    private static final String[] MONITORED_SYMBOLS = {"VIC", "VNM", "FPT", "HPG"};
    
    /**
     * Scheduled task: Fetch intraday data and detect patterns every 5 seconds
     */
    @Scheduled(fixedRate = 5000) // 5 seconds
    public void updateAndDetectPatterns() {
        for (String symbol : MONITORED_SYMBOLS) {
            // Only fetch data if someone is watching this symbol
            if (!watchedPatternService.hasWatchersForSymbol(symbol)) {
                continue;
            }
            
            try {
                // Fetch 5 recent candles
                List<CandleStick> recentCandles = intradayDataService.fetchRecentCandles(symbol, 5);
                
                if (recentCandles.isEmpty()) {
                    log.debug("No candles fetched for {}", symbol);
                    continue;
                }
                
                // Detect pattern and broadcast
                detectAndBroadcast(symbol, recentCandles);
                
            } catch (Exception e) {
                log.error("Error updating patterns for {}: {}", symbol, e.getMessage());
            }
        }
    }
    
    /**
     * Detect pattern based on watched pattern and broadcast to clients
     */
    private void detectAndBroadcast(String symbol, List<CandleStick> recentCandles) {
        // Get all sessions watching this symbol
        var watchers = watchedPatternService.getWatchersForSymbol(symbol);
        
        for (String sessionId : watchers) {
            String watchedPattern = watchedPatternService.getWatchedPattern(sessionId);
            
            if (watchedPattern == null || watchedPattern.isEmpty()) {
                // No specific pattern selected, just send data update
                broadcastUpdate(symbol, recentCandles, null, null);
                continue;
            }
            
            // Detect the specific pattern
            String detectedPattern = null;
            CandleStick patternCandle = null;
            
            List<CandleStick> matchedCandles = detectPattern(watchedPattern, recentCandles);
            
            if (!matchedCandles.isEmpty()) {
                // Pattern detected! Get the last matching candle
                patternCandle = matchedCandles.get(matchedCandles.size() - 1);
                detectedPattern = watchedPattern;
                log.info("Pattern {} detected for {} at candle with close: {}", 
                         detectedPattern, symbol, patternCandle.getClose());
            }
            
            // Broadcast to this specific session
            broadcastUpdate(symbol, recentCandles, detectedPattern, patternCandle);
        }
    }
    
    /**
     * Detect pattern based on pattern name
     */
    private List<CandleStick> detectPattern(String patternName, List<CandleStick> candles) {
        // Map pattern name to detection method
        return switch (patternName.toLowerCase()) {
            case "hammer" -> detectCandlePatternService.getHammerCandlesFromList(candles);
            case "inverted_hammer" -> detectCandlePatternService.getInvertedHammerCandlesFromList(candles);
            case "hanging_man" -> detectCandlePatternService.getHangingManCandlesFromList(candles);
            case "shooting_star" -> detectCandlePatternService.getShootingStarCandlesFromList(candles);
            case "bullish_engulfing" -> detectCandlePatternService.getBullishEngulfingFromList(candles);
            case "bearish_engulfing" -> detectCandlePatternService.getBearishEngulfingFromList(candles);
            case "morning_star" -> detectCandlePatternService.getMorningStarFromList(candles);
            case "evening_star" -> detectCandlePatternService.getEveningStarFromList(candles);
            case "three_white_soldiers" -> detectCandlePatternService.getThreeWhiteSoldiersFromList(candles);
            case "three_black_crows" -> detectCandlePatternService.getThreeBlackCrowsFromList(candles);
            case "doji" -> detectCandlePatternService.getDojiFromList(candles);
            default -> List.of();
        };
    }
    
    /**
     * Broadcast update to WebSocket topic
     */
    private void broadcastUpdate(String symbol, List<CandleStick> recentCandles, 
                                 String detectedPattern, CandleStick patternCandle) {
        RealTimeUpdateDTO update = new RealTimeUpdateDTO(
            symbol,
            recentCandles,
            detectedPattern,
            patternCandle,
            System.currentTimeMillis()
        );
        
        // Broadcast to topic: /topic/updates/{SYMBOL}
        String destination = "/topic/updates/" + symbol;
        messagingTemplate.convertAndSend(destination, update);
        
        if (detectedPattern != null) {
            log.info("Broadcast pattern {} for {} to {}", detectedPattern, symbol, destination);
        }
    }
}
