package com.example.alert.service;

import com.example.alert.domain.AlertRule;
import com.example.alert.domain.CandleStick;
import com.example.alert.dto.AlertSignal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Rule Engine - Evaluates alert rules against candle data
 * Supports indicators (RSI, MACD, SMA, etc.), patterns (Hammer, Doji, etc.), 
 * and complex conditions with AND/OR logic
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RuleEngineService {
    
    private final AlertRuleService alertRuleService;
    private final TechnicalIndicatorService technicalIndicatorService;
    private final PatternDetectionService patternDetectionService;
    
    /**
     * Evaluate all active rules for a symbol against current candle data
     */
    public List<AlertSignal> evaluateRules(String symbol, List<CandleStick> candleData) {
        if (candleData == null || candleData.isEmpty()) {
            log.warn("No candle data provided for symbol: {}", symbol);
            return Collections.emptyList();
        }
        
        List<AlertRule> activeRules = alertRuleService.getActiveRulesBySymbol(symbol);
        if (activeRules.isEmpty()) {
            log.debug("No active rules for symbol: {}", symbol);
            return Collections.emptyList();
        }
        
        log.info("Evaluating {} active rules for symbol: {}", activeRules.size(), symbol);
        
        List<AlertSignal> signals = new ArrayList<>();
        CandleStick currentCandle = candleData.get(candleData.size() - 1);
        
        for (AlertRule rule : activeRules) {
            try {
                // Check cooldown
                if (isInCooldown(rule)) {
                    log.debug("Rule {} is in cooldown period", rule.getRuleName());
                    continue;
                }
                
                // Evaluate rule
                boolean triggered = evaluateRule(rule, candleData, currentCandle);
                
                if (triggered) {
                    log.info("Rule triggered: {} for symbol: {}", rule.getRuleName(), symbol);
                    
                    AlertSignal signal = createSignal(rule, currentCandle, candleData);
                    signals.add(signal);
                    
                    // Update statistics and cooldown
                    updateRuleTrigger(rule);
                }
            } catch (Exception e) {
                log.error("Error evaluating rule: {} for symbol: {}", rule.getRuleName(), symbol, e);
            }
        }
        
        return signals;
    }
    
    /**
     * Evaluate a single rule against candle data
     */
    private boolean evaluateRule(AlertRule rule, List<CandleStick> candleData, CandleStick currentCandle) {
        // If using condition groups (complex logic)
        if (rule.getConditionGroups() != null && !rule.getConditionGroups().isEmpty()) {
            return evaluateConditionGroups(rule.getConditionGroups(), candleData, currentCandle);
        }
        
        // Simple conditions with single operator (AND/OR)
        if (rule.getConditions() != null && !rule.getConditions().isEmpty()) {
            return evaluateConditions(rule.getConditions(), rule.getLogicOperator(), candleData, currentCandle);
        }
        
        log.warn("Rule {} has no conditions defined", rule.getRuleName());
        return false;
    }
    
    /**
     * Evaluate condition groups: (A AND B) OR (C AND D)
     */
    private boolean evaluateConditionGroups(List<AlertRule.ConditionGroup> groups, 
                                           List<CandleStick> candleData, 
                                           CandleStick currentCandle) {
        // Groups are implicitly OR'd together
        for (AlertRule.ConditionGroup group : groups) {
            boolean groupResult = evaluateConditions(
                group.getConditions(), 
                group.getOperator(), 
                candleData, 
                currentCandle
            );
            
            if (groupResult) {
                return true; // At least one group is satisfied
            }
        }
        return false;
    }
    
    /**
     * Evaluate a list of conditions with AND/OR logic
     */
    private boolean evaluateConditions(List<AlertRule.RuleCondition> conditions,
                                      AlertRule.LogicOperator operator,
                                      List<CandleStick> candleData,
                                      CandleStick currentCandle) {
        if (conditions == null || conditions.isEmpty()) {
            return false;
        }
        
        for (AlertRule.RuleCondition condition : conditions) {
            boolean conditionResult = evaluateCondition(condition, candleData, currentCandle);
            
            if (operator == AlertRule.LogicOperator.AND && !conditionResult) {
                return false; // AND: all must be true
            }
            
            if (operator == AlertRule.LogicOperator.OR && conditionResult) {
                return true; // OR: at least one must be true
            }
        }
        
        // If we reach here with AND operator, all conditions passed
        // If we reach here with OR operator, none passed
        return operator == AlertRule.LogicOperator.AND;
    }
    
    /**
     * Evaluate a single condition
     */
    private boolean evaluateCondition(AlertRule.RuleCondition condition,
                                     List<CandleStick> candleData,
                                     CandleStick currentCandle) {
        try {
            switch (condition.getType()) {
                case INDICATOR:
                    return evaluateIndicatorCondition(condition, candleData, currentCandle);
                    
                case PATTERN:
                    return evaluatePatternCondition(condition, candleData, currentCandle);
                    
                case PRICE:
                    return evaluatePriceCondition(condition, currentCandle);
                    
                case VOLUME:
                    return evaluateVolumeCondition(condition, candleData, currentCandle);
                    
                default:
                    log.warn("Unknown condition type: {}", condition.getType());
                    return false;
            }
        } catch (Exception e) {
            log.error("Error evaluating condition: {}", condition, e);
            return false;
        }
    }
    
    /**
     * Evaluate indicator condition (RSI, MACD, SMA, EMA, etc.)
     */
    private boolean evaluateIndicatorCondition(AlertRule.RuleCondition condition,
                                               List<CandleStick> candleData,
                                               CandleStick currentCandle) {
        String indicatorKey = condition.getKey().toLowerCase();
        Map<String, Object> params = condition.getParams();
        
        // Get indicator value
        Double indicatorValue = technicalIndicatorService.calculateIndicator(
            indicatorKey, 
            candleData, 
            params
        );
        
        if (indicatorValue == null) {
            log.warn("Could not calculate indicator: {}", indicatorKey);
            return false;
        }
        
        // Handle comparison
        String operator = condition.getOperator();
        
        // Compare with static value
        if (condition.getValue() != null) {
            Double threshold = convertToDouble(condition.getValue());
            if (threshold == null) {
                log.warn("Invalid threshold value: {}", condition.getValue());
                return false;
            }
            
            return compareValues(indicatorValue, operator, threshold);
        }
        
        // Compare with another indicator (e.g., close CROSS_UP sma20)
        if (condition.getCompareWith() != null) {
            return evaluateCrossCondition(
                indicatorValue,
                condition.getCompareWith(),
                operator,
                candleData
            );
        }
        
        return false;
    }
    
    /**
     * Evaluate pattern condition (Hammer, Doji, Engulfing, etc.)
     */
    private boolean evaluatePatternCondition(AlertRule.RuleCondition condition,
                                            List<CandleStick> candleData,
                                            CandleStick currentCandle) {
        String patternKey = condition.getKey().toLowerCase();
        String operator = condition.getOperator();
        
        // Check if pattern exists at current candle
        boolean patternDetected = patternDetectionService.detectPattern(
            patternKey, 
            candleData
        );
        
        // Operators: IS_TRUE or IS_FALSE
        if ("IS_TRUE".equals(operator)) {
            return patternDetected;
        } else if ("IS_FALSE".equals(operator)) {
            return !patternDetected;
        }
        
        return patternDetected; // Default: IS_TRUE
    }
    
    /**
     * Evaluate price condition (close, high, low, open)
     */
    private boolean evaluatePriceCondition(AlertRule.RuleCondition condition,
                                          CandleStick currentCandle) {
        String priceKey = condition.getKey().toLowerCase();
        Double priceValue;
        
        switch (priceKey) {
            case "close":
                priceValue = currentCandle.getClose();
                break;
            case "high":
                priceValue = currentCandle.getHigh();
                break;
            case "low":
                priceValue = currentCandle.getLow();
                break;
            case "open":
                priceValue = currentCandle.getOpen();
                break;
            default:
                log.warn("Unknown price key: {}", priceKey);
                return false;
        }
        
        Double threshold = convertToDouble(condition.getValue());
        if (threshold == null) {
            return false;
        }
        
        return compareValues(priceValue, condition.getOperator(), threshold);
    }
    
    /**
     * Evaluate volume condition
     */
    private boolean evaluateVolumeCondition(AlertRule.RuleCondition condition,
                                           List<CandleStick> candleData,
                                           CandleStick currentCandle) {
        Double currentVolume = currentCandle.getVolume();
        
        // Compare with static value
        if (condition.getValue() != null) {
            Double threshold = convertToDouble(condition.getValue());
            if (threshold == null) {
                return false;
            }
            
            return compareValues(currentVolume, condition.getOperator(), threshold);
        }
        
        // Compare with average volume
        if (condition.getCompareWith() != null && "avg_volume".equals(condition.getCompareWith().getKey())) {
            Map<String, Object> params = condition.getCompareWith().getParams();
            Integer period = params != null ? (Integer) params.get("period") : 20;
            
            Double avgVolume = technicalIndicatorService.calculateAverageVolume(candleData, period);
            if (avgVolume == null) {
                return false;
            }
            
            return compareValues(currentVolume, condition.getOperator(), avgVolume);
        }
        
        return false;
    }
    
    /**
     * Evaluate cross conditions (CROSS_UP, CROSS_DOWN)
     */
    private boolean evaluateCrossCondition(Double currentValue,
                                          AlertRule.CompareWith compareWith,
                                          String operator,
                                          List<CandleStick> candleData) {
        // Get comparison indicator value
        Double compareValue = technicalIndicatorService.calculateIndicator(
            compareWith.getKey(),
            candleData,
            compareWith.getParams()
        );
        
        if (compareValue == null) {
            return false;
        }
        
        // For cross detection, we need historical data
        if ("CROSS_UP".equals(operator)) {
            // Previous value was below, current is above
            if (candleData.size() < 2) return false;
            
            List<CandleStick> prevData = candleData.subList(0, candleData.size() - 1);
            Double prevValue = technicalIndicatorService.calculateIndicator(
                compareWith.getKey(),
                prevData,
                compareWith.getParams()
            );
            
            if (prevValue == null) return false;
            
            Double prevCurrentValue = candleData.get(candleData.size() - 2).getClose();
            
            return prevCurrentValue <= prevValue && currentValue > compareValue;
        }
        
        if ("CROSS_DOWN".equals(operator)) {
            // Previous value was above, current is below
            if (candleData.size() < 2) return false;
            
            List<CandleStick> prevData = candleData.subList(0, candleData.size() - 1);
            Double prevValue = technicalIndicatorService.calculateIndicator(
                compareWith.getKey(),
                prevData,
                compareWith.getParams()
            );
            
            if (prevValue == null) return false;
            
            Double prevCurrentValue = candleData.get(candleData.size() - 2).getClose();
            
            return prevCurrentValue >= prevValue && currentValue < compareValue;
        }
        
        // Simple comparison
        return compareValues(currentValue, operator, compareValue);
    }
    
    /**
     * Compare two values using operator
     */
    private boolean compareValues(Double value1, String operator, Double value2) {
        switch (operator) {
            case "<":
                return value1 < value2;
            case ">":
                return value1 > value2;
            case "<=":
                return value1 <= value2;
            case ">=":
                return value1 >= value2;
            case "==":
                return Math.abs(value1 - value2) < 0.0001; // Floating point comparison
            case "!=":
                return Math.abs(value1 - value2) >= 0.0001;
            default:
                log.warn("Unknown operator: {}", operator);
                return false;
        }
    }
    
    /**
     * Check if rule is in cooldown period
     */
    private boolean isInCooldown(AlertRule rule) {
        if (rule.getAction() == null || rule.getAction().getLastTriggeredAt() == null) {
            return false;
        }
        
        Integer cooldownMinutes = rule.getAction().getCooldownMinutes();
        if (cooldownMinutes == null || cooldownMinutes <= 0) {
            return false;
        }
        
        LocalDateTime lastTriggered = rule.getAction().getLastTriggeredAt();
        LocalDateTime now = LocalDateTime.now();
        
        return lastTriggered.plusMinutes(cooldownMinutes).isAfter(now);
    }
    
    /**
     * Update rule trigger timestamp and statistics
     */
    private void updateRuleTrigger(AlertRule rule) {
        // Update action cooldown
        if (rule.getAction() != null) {
            rule.getAction().setLastTriggeredAt(LocalDateTime.now());
        }
        
        // Update statistics
        alertRuleService.updateRuleStatistics(rule.getId(), true);
    }
    
    /**
     * Create alert signal from triggered rule
     */
    private AlertSignal createSignal(AlertRule rule, CandleStick currentCandle, List<CandleStick> candleData) {
        String message = rule.getAction().getMessageTemplate();
        
        // Replace template variables
        message = message.replace("{{signalType}}", rule.getSignalType().toString());
        message = message.replace("{{symbol}}", rule.getSymbol());
        message = message.replace("{{ruleName}}", rule.getRuleName());
        
        return AlertSignal.builder()
            .ruleId(rule.getId())
            .ruleName(rule.getRuleName())
            .userId(rule.getUserId())
            .symbol(rule.getSymbol())
            .signalType(rule.getSignalType())
            .price(currentCandle.getClose())
            .candleIndex((long) (candleData.size() - 1))
            .timestamp(LocalDateTime.now())
            .message(message)
            .confidence(0.8) // Can be calculated based on condition strength
            .build();
    }
    
    // Helper methods
    
    private Double convertToDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
    
    private Long convertToLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
