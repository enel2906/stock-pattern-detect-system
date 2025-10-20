package com.example.alert.service;

import com.example.alert.domain.CandleStick;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Service to fetch intraday data from Python Data Service
 */
@Service
@Slf4j
public class IntradayDataService {
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${data.service.url:http://localhost:5000}")
    private String dataServiceUrl;
    
    public IntradayDataService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Fetch recent intraday candles from Python service
     * @param symbol Stock symbol (e.g., "VIC")
     * @param limit Number of recent candles to fetch (default: 5)
     * @return List of CandleStick objects
     */
    public List<CandleStick> fetchRecentCandles(String symbol, int limit) {
        try {
            String url = String.format("%s/intraday/%s?limit=%d", dataServiceUrl, symbol, limit);
            log.info("Fetching intraday data from: {}", url);
            
            String response = restTemplate.getForObject(url, String.class);
            
            if (response == null || response.isEmpty()) {
                log.warn("Empty response from data service for symbol: {}", symbol);
                return new ArrayList<>();
            }
            
            // Parse JSON response to List<Map>
            List<Map<String, Object>> dataList = objectMapper.readValue(
                response, 
                new TypeReference<List<Map<String, Object>>>() {}
            );
            
            // Convert to CandleStick objects
            List<CandleStick> candles = new ArrayList<>();
            for (Map<String, Object> data : dataList) {
                CandleStick candle = convertToCandleStick(symbol, data);
                if (candle != null) {
                    candles.add(candle);
                }
            }
            
            log.info("Successfully fetched {} candles for {}", candles.size(), symbol);
            return candles;
            
        } catch (Exception e) {
            log.error("Error fetching intraday data for {}: {}", symbol, e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Convert Map data to CandleStick object
     */
    private CandleStick convertToCandleStick(String symbol, Map<String, Object> data) {
        try {
            CandleStick candle = new CandleStick();
            candle.setStockId(symbol);
            
            // Parse time/date - handle different formats
            Object timeObj = data.get("time");
            if (timeObj != null) {
                // Convert time string to timestamp (you may need to adjust based on actual format)
                try {
                    candle.setDate(parseLong(timeObj));
                } catch (Exception e) {
                    candle.setDate(System.currentTimeMillis());
                }
            } else {
                candle.setDate(System.currentTimeMillis());
            }
            
            // Parse OHLCV data
            candle.setOpen(parseDouble(data.get("open")));
            candle.setHigh(parseDouble(data.get("high")));
            candle.setLow(parseDouble(data.get("low")));
            candle.setClose(parseDouble(data.get("close")));
            candle.setVolume(parseDouble(data.get("volume")));
            
            return candle;
            
        } catch (Exception e) {
            log.error("Error converting data to CandleStick: {}", e.getMessage());
            return null;
        }
    }
    
    private double parseDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
    
    private long parseLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(value.toString().replace(",", ""));
        } catch (NumberFormatException e) {
            return 0L;
        }
    }
}
