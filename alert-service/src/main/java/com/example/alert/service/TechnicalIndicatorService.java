package com.example.alert.service;

import com.example.alert.domain.CandleStick;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Service to calculate technical indicators
 */
@Service
@Slf4j
public class TechnicalIndicatorService {
    
    /**
     * Calculate indicator based on key and parameters
     */
    public Double calculateIndicator(String indicatorKey, List<CandleStick> candleData, Map<String, Object> params) {
        if (candleData == null || candleData.isEmpty()) {
            return null;
        }
        
        indicatorKey = indicatorKey.toLowerCase();
        
        try {
            switch (indicatorKey) {
                case "rsi":
                    return calculateRSI(candleData, getIntParam(params, "period", 14));
                    
                case "sma":
                    return calculateSMA(candleData, getIntParam(params, "period", 20));
                    
                case "ema":
                    return calculateEMA(candleData, getIntParam(params, "period", 20));
                    
                case "macd":
                    return calculateMACD(candleData, params);
                    
                case "bollinger_upper":
                    return calculateBollingerBands(candleData, getIntParam(params, "period", 20), 
                                                   getDoubleParam(params, "stdDev", 2.0))[0];
                    
                case "bollinger_middle":
                    return calculateBollingerBands(candleData, getIntParam(params, "period", 20), 
                                                   getDoubleParam(params, "stdDev", 2.0))[1];
                    
                case "bollinger_lower":
                    return calculateBollingerBands(candleData, getIntParam(params, "period", 20), 
                                                   getDoubleParam(params, "stdDev", 2.0))[2];
                    
                case "close":
                    return candleData.get(candleData.size() - 1).getClose();
                    
                case "high":
                    return candleData.get(candleData.size() - 1).getHigh();
                    
                case "low":
                    return candleData.get(candleData.size() - 1).getLow();
                    
                case "open":
                    return candleData.get(candleData.size() - 1).getOpen();
                    
                default:
                    log.warn("Unknown indicator: {}", indicatorKey);
                    return null;
            }
        } catch (Exception e) {
            log.error("Error calculating indicator {}: {}", indicatorKey, e.getMessage());
            return null;
        }
    }
    
    /**
     * Calculate RSI (Relative Strength Index)
     */
    private Double calculateRSI(List<CandleStick> candleData, int period) {
        if (candleData.size() < period + 1) {
            return null;
        }
        
        double gainSum = 0.0;
        double lossSum = 0.0;
        
        // Calculate initial average gain and loss
        for (int i = candleData.size() - period; i < candleData.size(); i++) {
            double change = candleData.get(i).getClose() - candleData.get(i - 1).getClose();
            if (change > 0) {
                gainSum += change;
            } else {
                lossSum += Math.abs(change);
            }
        }
        
        double avgGain = gainSum / period;
        double avgLoss = lossSum / period;
        
        if (avgLoss == 0) {
            return 100.0;
        }
        
        double rs = avgGain / avgLoss;
        return 100.0 - (100.0 / (1.0 + rs));
    }
    
    /**
     * Calculate SMA (Simple Moving Average)
     */
    private Double calculateSMA(List<CandleStick> candleData, int period) {
        if (candleData.size() < period) {
            return null;
        }
        
        double sum = 0.0;
        for (int i = candleData.size() - period; i < candleData.size(); i++) {
            sum += candleData.get(i).getClose();
        }
        
        return sum / period;
    }
    
    /**
     * Calculate EMA (Exponential Moving Average)
     */
    private Double calculateEMA(List<CandleStick> candleData, int period) {
        if (candleData.size() < period) {
            return null;
        }
        
        // Calculate initial SMA
        double sum = 0.0;
        for (int i = 0; i < period; i++) {
            sum += candleData.get(i).getClose();
        }
        double ema = sum / period;
        
        // Calculate EMA
        double multiplier = 2.0 / (period + 1);
        for (int i = period; i < candleData.size(); i++) {
            ema = (candleData.get(i).getClose() - ema) * multiplier + ema;
        }
        
        return ema;
    }
    
    /**
     * Calculate MACD (Moving Average Convergence Divergence)
     * Returns MACD line value
     */
    private Double calculateMACD(List<CandleStick> candleData, Map<String, Object> params) {
        int fastPeriod = getIntParam(params, "fastPeriod", 12);
        int slowPeriod = getIntParam(params, "slowPeriod", 26);
        
        Double fastEMA = calculateEMA(candleData, fastPeriod);
        Double slowEMA = calculateEMA(candleData, slowPeriod);
        
        if (fastEMA == null || slowEMA == null) {
            return null;
        }
        
        return fastEMA - slowEMA;
    }
    
    /**
     * Calculate Bollinger Bands
     * Returns [upper, middle, lower]
     */
    private Double[] calculateBollingerBands(List<CandleStick> candleData, int period, double stdDevMultiplier) {
        Double sma = calculateSMA(candleData, period);
        if (sma == null) {
            return new Double[]{null, null, null};
        }
        
        // Calculate standard deviation
        double sumSquaredDiff = 0.0;
        for (int i = candleData.size() - period; i < candleData.size(); i++) {
            double diff = candleData.get(i).getClose() - sma;
            sumSquaredDiff += diff * diff;
        }
        double stdDev = Math.sqrt(sumSquaredDiff / period);
        
        double upper = sma + (stdDev * stdDevMultiplier);
        double lower = sma - (stdDev * stdDevMultiplier);
        
        return new Double[]{upper, sma, lower};
    }
    
    /**
     * Calculate average volume
     */
    public Double calculateAverageVolume(List<CandleStick> candleData, int period) {
        if (candleData.size() < period) {
            return null;
        }
        
        long sum = 0;
        for (int i = candleData.size() - period; i < candleData.size(); i++) {
            sum += candleData.get(i).getVolume();
        }
        
        return (double) sum / period;
    }
    
    // Helper methods to extract parameters
    
    private int getIntParam(Map<String, Object> params, String key, int defaultValue) {
        if (params == null || !params.containsKey(key)) {
            return defaultValue;
        }
        Object value = params.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
    
    private double getDoubleParam(Map<String, Object> params, String key, double defaultValue) {
        if (params == null || !params.containsKey(key)) {
            return defaultValue;
        }
        Object value = params.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
