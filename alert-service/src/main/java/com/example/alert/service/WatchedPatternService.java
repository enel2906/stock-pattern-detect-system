package com.example.alert.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service to track which pattern each user/session is watching
 */
@Service
public class WatchedPatternService {
    
    // Map: sessionId -> patternName
    private final Map<String, String> watchedPatterns = new ConcurrentHashMap<>();
    
    // Map: stockSymbol -> Set of sessionIds watching it
    private final Map<String, java.util.Set<String>> symbolWatchers = new ConcurrentHashMap<>();
    
    /**
     * User starts watching a pattern for a stock
     */
    public void setWatchedPattern(String sessionId, String stockSymbol, String patternName) {
        watchedPatterns.put(sessionId, patternName != null ? patternName.toLowerCase() : null);
        
        // Track which sessions are watching this symbol
        symbolWatchers.computeIfAbsent(stockSymbol, k -> ConcurrentHashMap.newKeySet())
                     .add(sessionId);
    }
    
    /**
     * Get the pattern name that a session is watching
     */
    public String getWatchedPattern(String sessionId) {
        return watchedPatterns.get(sessionId);
    }
    
    /**
     * Remove session when user disconnects
     */
    public void removeSession(String sessionId) {
        watchedPatterns.remove(sessionId);
        symbolWatchers.values().forEach(set -> set.remove(sessionId));
    }
    
    /**
     * Get all sessions watching a specific stock symbol
     */
    public java.util.Set<String> getWatchersForSymbol(String stockSymbol) {
        return symbolWatchers.getOrDefault(stockSymbol, java.util.Collections.emptySet());
    }
    
    /**
     * Check if anyone is watching a symbol
     */
    public boolean hasWatchersForSymbol(String stockSymbol) {
        java.util.Set<String> watchers = symbolWatchers.get(stockSymbol);
        return watchers != null && !watchers.isEmpty();
    }
}
