package com.example.alert.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "alert_rules")
@CompoundIndexes({
    @CompoundIndex(name = "user_symbol_idx", def = "{'userId': 1, 'symbol': 1}"),
    @CompoundIndex(name = "user_status_idx", def = "{'userId': 1, 'status': 1}")
})
public class AlertRule {
    
    @Id
    private String id;
    
    private String userId;
    
    private String symbol;
    
    private String ruleName;
    
    private String description;
    
    private SignalType signalType;
    
    private RuleStatus status;
    
    private Integer priority; // Default: 0, higher = more priority
    
    private String timeframe; // "1m", "5m", "15m", "1h", "4h", "1d"
    
    private LogicOperator logicOperator;
    
    private List<RuleCondition> conditions;
    
    private List<ConditionGroup> conditionGroups; // For complex logic: (A AND B) OR (C AND D)
    
    private AlertAction action;
    
    private BacktestResult backtestResult;
    
    private RuleStatistics statistics;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Enums
    public enum SignalType {
        BUY,
        SELL,
        EXIT_BUY,
        EXIT_SELL
    }
    
    public enum RuleStatus {
        ACTIVE,
        PAUSED,
        DISABLED
    }
    
    public enum LogicOperator {
        AND,
        OR
    }
    
    // Nested classes
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RuleCondition {
        private ConditionType type;
        private String key; // "rsi", "hammer", "sma", "close", etc.
        private Map<String, Object> params; // { "period": 14, "source": "close" }
        private String operator; // "<", ">", "<=", ">=", "==", "!=", "IS_TRUE", "IS_FALSE", "CROSS_UP", "CROSS_DOWN"
        private Object value; // Có thể là Number, String, hoặc CompareWith object
        private CompareWith compareWith; // So sánh với indicator khác
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompareWith {
        private ConditionType type;
        private String key;
        private Map<String, Object> params;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConditionGroup {
        private LogicOperator operator;
        private List<RuleCondition> conditions;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlertAction {
        private ActionType type;
        private String messageTemplate;
        private Integer cooldownMinutes; // Tránh spam: chỉ gửi 1 lần trong X phút
        private LocalDateTime lastTriggeredAt; // Track last notification time
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BacktestResult {
        private Double winRate;
        private Integer totalSignals;
        private Integer successfulSignals;
        private LocalDateTime lastBacktestDate;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RuleStatistics {
        private Integer triggeredCount;
        private LocalDateTime lastTriggeredAt;
        private Integer successfulSignals;
        private Integer falseSignals;
    }
    
    public enum ConditionType {
        INDICATOR,  // RSI, MACD, SMA, EMA, etc.
        PATTERN,    // Hammer, Doji, Engulfing, etc.
        PRICE,      // Close, High, Low, Open
        VOLUME      // Volume conditions
    }
    
    public enum ActionType {
        NOTIFY_WEB,
        NOTIFY_EMAIL,
        NOTIFY_TELEGRAM,
        WEBHOOK
    }
}
