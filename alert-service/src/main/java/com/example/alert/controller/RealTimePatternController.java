package com.example.alert.controller;

import com.example.alert.service.WatchedPatternService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * WebSocket controller for real-time pattern detection
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class RealTimePatternController {
    
    private final WatchedPatternService watchedPatternService;
    
    /**
     * Handle user selecting a pattern to watch
     * Message destination: /app/watch-pattern/{symbol}
     * 
     * Example payload: {"patternName": "hammer"}
     */
    @MessageMapping("/watch-pattern/{symbol}")
    public void watchPattern(@DestinationVariable String symbol,
                            @Payload Map<String, String> payload,
                            SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String patternName = payload.get("patternName");
        
        log.info("Session {} is now watching pattern '{}' for symbol '{}'", 
                 sessionId, patternName, symbol);
        
        // Save the watched pattern for this session
        watchedPatternService.setWatchedPattern(sessionId, symbol, patternName);
    }
    
    /**
     * Handle user stopping pattern watch
     * Message destination: /app/unwatch-pattern/{symbol}
     */
    @MessageMapping("/unwatch-pattern/{symbol}")
    public void unwatchPattern(@DestinationVariable String symbol,
                              SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        
        log.info("Session {} stopped watching patterns for symbol '{}'", sessionId, symbol);
        
        // Remove the watched pattern for this session
        watchedPatternService.setWatchedPattern(sessionId, symbol, null);
    }
}
