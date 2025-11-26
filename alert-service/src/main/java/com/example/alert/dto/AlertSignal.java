package com.example.alert.dto;

import com.example.alert.domain.AlertRule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Signal generated when an alert rule is triggered
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertSignal {
    
    private String ruleId;
    private String ruleName;
    private String userId;
    private String symbol;
    private AlertRule.SignalType signalType;
    private Double price;
    private Long candleIndex;
    private LocalDateTime timestamp;
    private String message;
    private Double confidence; // 0.0 to 1.0
    
    // Additional context
    private SignalContext context;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignalContext {
        private Double rsi;
        private String patternName;
        private String indicatorValues;
        private String conditionsMet;
    }
}
