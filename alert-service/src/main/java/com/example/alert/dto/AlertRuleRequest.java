package com.example.alert.dto;

import com.example.alert.domain.AlertRule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertRuleRequest {
    
    @NotBlank(message = "Symbol is required")
    private String symbol;
    
    @NotBlank(message = "Rule name is required")
    private String ruleName;
    
    private String description;
    
    @NotNull(message = "Signal type is required")
    private AlertRule.SignalType signalType;
    
    private AlertRule.RuleStatus status;
    
    private Integer priority;
    
    private String timeframe;
    
    @NotNull(message = "Logic operator is required")
    private AlertRule.LogicOperator logicOperator;
    
    @Valid
    @NotNull(message = "At least one condition is required")
    private List<ConditionRequest> conditions;
    
    private List<ConditionGroupRequest> conditionGroups;
    
    @Valid
    @NotNull(message = "Action is required")
    private ActionRequest action;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConditionRequest {
        @NotNull(message = "Condition type is required")
        private AlertRule.ConditionType type;
        
        @NotBlank(message = "Key is required")
        private String key;
        
        private Map<String, Object> params;
        
        @NotBlank(message = "Operator is required")
        private String operator;
        
        private Object value;
        
        private CompareWithRequest compareWith;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompareWithRequest {
        @NotNull
        private AlertRule.ConditionType type;
        
        @NotBlank
        private String key;
        
        private Map<String, Object> params;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConditionGroupRequest {
        @NotNull
        private AlertRule.LogicOperator operator;
        
        @Valid
        @NotNull
        private List<ConditionRequest> conditions;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionRequest {
        @NotNull(message = "Action type is required")
        private AlertRule.ActionType type;
        
        private String messageTemplate;
        
        private Integer cooldownMinutes;
    }
}
