package com.example.alert.dto;

import com.example.alert.domain.AlertRule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertRuleResponse {
    
    private String id;
    private String userId;
    private String symbol;
    private String ruleName;
    private String description;
    private AlertRule.SignalType signalType;
    private AlertRule.RuleStatus status;
    private Integer priority;
    private String timeframe;
    private AlertRule.LogicOperator logicOperator;
    private List<AlertRule.RuleCondition> conditions;
    private List<AlertRule.ConditionGroup> conditionGroups;
    private AlertRule.AlertAction action;
    private AlertRule.BacktestResult backtestResult;
    private AlertRule.RuleStatistics statistics;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static AlertRuleResponse fromEntity(AlertRule rule) {
        return AlertRuleResponse.builder()
            .id(rule.getId())
            .userId(rule.getUserId())
            .symbol(rule.getSymbol())
            .ruleName(rule.getRuleName())
            .description(rule.getDescription())
            .signalType(rule.getSignalType())
            .status(rule.getStatus())
            .priority(rule.getPriority())
            .timeframe(rule.getTimeframe())
            .logicOperator(rule.getLogicOperator())
            .conditions(rule.getConditions())
            .conditionGroups(rule.getConditionGroups())
            .action(rule.getAction())
            .backtestResult(rule.getBacktestResult())
            .statistics(rule.getStatistics())
            .createdAt(rule.getCreatedAt())
            .updatedAt(rule.getUpdatedAt())
            .build();
    }
}
