package com.example.alert.service;

import com.example.alert.domain.AlertRule;
import com.example.alert.dto.AlertRuleRequest;
import com.example.alert.dto.AlertRuleResponse;
import com.example.alert.repository.AlertRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertRuleService {
    
    private final AlertRuleRepository alertRuleRepository;
    
    /**
     * Create a new alert rule
     */
    public AlertRuleResponse createRule(String userId, AlertRuleRequest request) {
        log.info("Creating alert rule for user: {}, symbol: {}", userId, request.getSymbol());
        
        // Check if rule name already exists for this user
        if (alertRuleRepository.existsByUserIdAndRuleName(userId, request.getRuleName())) {
            throw new IllegalArgumentException("Rule name already exists");
        }
        
        AlertRule rule = mapRequestToEntity(userId, request);
        rule.setCreatedAt(LocalDateTime.now());
        rule.setUpdatedAt(LocalDateTime.now());
        
        // Initialize statistics
        rule.setStatistics(AlertRule.RuleStatistics.builder()
            .triggeredCount(0)
            .successfulSignals(0)
            .falseSignals(0)
            .build());
        
        AlertRule savedRule = alertRuleRepository.save(rule);
        log.info("Alert rule created successfully with id: {}", savedRule.getId());
        
        return AlertRuleResponse.fromEntity(savedRule);
    }
    
    /**
     * Update an existing alert rule
     */
    public AlertRuleResponse updateRule(String userId, String ruleId, AlertRuleRequest request) {
        log.info("Updating alert rule: {} for user: {}", ruleId, userId);
        
        AlertRule existingRule = alertRuleRepository.findById(ruleId)
            .orElseThrow(() -> new IllegalArgumentException("Rule not found"));
        
        // Verify ownership
        if (!existingRule.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to update this rule");
        }
        
        // Check if new rule name conflicts (if changed)
        if (!existingRule.getRuleName().equals(request.getRuleName()) &&
            alertRuleRepository.existsByUserIdAndRuleName(userId, request.getRuleName())) {
            throw new IllegalArgumentException("Rule name already exists");
        }
        
        // Update fields
        updateRuleFields(existingRule, request);
        existingRule.setUpdatedAt(LocalDateTime.now());
        
        AlertRule updatedRule = alertRuleRepository.save(existingRule);
        log.info("Alert rule updated successfully: {}", ruleId);
        
        return AlertRuleResponse.fromEntity(updatedRule);
    }
    
    /**
     * Delete an alert rule
     */
    public void deleteRule(String userId, String ruleId) {
        log.info("Deleting alert rule: {} for user: {}", ruleId, userId);
        
        AlertRule rule = alertRuleRepository.findById(ruleId)
            .orElseThrow(() -> new IllegalArgumentException("Rule not found"));
        
        // Verify ownership
        if (!rule.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to delete this rule");
        }
        
        alertRuleRepository.delete(rule);
        log.info("Alert rule deleted successfully: {}", ruleId);
    }
    
    /**
     * Get a single alert rule
     */
    public AlertRuleResponse getRule(String userId, String ruleId) {
        AlertRule rule = alertRuleRepository.findById(ruleId)
            .orElseThrow(() -> new IllegalArgumentException("Rule not found"));
        
        // Verify ownership
        if (!rule.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to view this rule");
        }
        
        return AlertRuleResponse.fromEntity(rule);
    }
    
    /**
     * Get all rules for a user
     */
    public List<AlertRuleResponse> getUserRules(String userId) {
        List<AlertRule> rules = alertRuleRepository.findByUserId(userId);
        return rules.stream()
            .map(AlertRuleResponse::fromEntity)
            .collect(Collectors.toList());
    }
    
    /**
     * Get rules for a specific symbol
     */
    public List<AlertRuleResponse> getUserRulesBySymbol(String userId, String symbol) {
        List<AlertRule> rules = alertRuleRepository.findByUserIdAndSymbol(userId, symbol);
        return rules.stream()
            .map(AlertRuleResponse::fromEntity)
            .collect(Collectors.toList());
    }
    
    /**
     * Get active rules for a symbol (used by rule engine)
     */
    public List<AlertRule> getActiveRulesBySymbol(String symbol) {
        return alertRuleRepository.findBySymbolAndStatus(symbol, AlertRule.RuleStatus.ACTIVE);
    }
    
    /**
     * Toggle rule status (ACTIVE <-> PAUSED)
     */
    public AlertRuleResponse toggleRuleStatus(String userId, String ruleId) {
        log.info("Toggling status for rule: {} by user: {}", ruleId, userId);
        
        AlertRule rule = alertRuleRepository.findById(ruleId)
            .orElseThrow(() -> new IllegalArgumentException("Rule not found"));
        
        // Verify ownership
        if (!rule.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to modify this rule");
        }
        
        // Toggle status
        if (rule.getStatus() == AlertRule.RuleStatus.ACTIVE) {
            rule.setStatus(AlertRule.RuleStatus.PAUSED);
        } else if (rule.getStatus() == AlertRule.RuleStatus.PAUSED) {
            rule.setStatus(AlertRule.RuleStatus.ACTIVE);
        }
        
        rule.setUpdatedAt(LocalDateTime.now());
        AlertRule updatedRule = alertRuleRepository.save(rule);
        
        log.info("Rule status toggled to: {}", updatedRule.getStatus());
        return AlertRuleResponse.fromEntity(updatedRule);
    }
    
    /**
     * Update rule statistics when triggered
     */
    public void updateRuleStatistics(String ruleId, boolean successful) {
        alertRuleRepository.findById(ruleId).ifPresent(rule -> {
            AlertRule.RuleStatistics stats = rule.getStatistics();
            if (stats == null) {
                stats = AlertRule.RuleStatistics.builder()
                    .triggeredCount(0)
                    .successfulSignals(0)
                    .falseSignals(0)
                    .build();
            }
            
            stats.setTriggeredCount(stats.getTriggeredCount() + 1);
            stats.setLastTriggeredAt(LocalDateTime.now());
            
            if (successful) {
                stats.setSuccessfulSignals(stats.getSuccessfulSignals() + 1);
            } else {
                stats.setFalseSignals(stats.getFalseSignals() + 1);
            }
            
            rule.setStatistics(stats);
            alertRuleRepository.save(rule);
        });
    }
    
    // Helper methods
    
    private AlertRule mapRequestToEntity(String userId, AlertRuleRequest request) {
        return AlertRule.builder()
            .userId(userId)
            .symbol(request.getSymbol())
            .ruleName(request.getRuleName())
            .description(request.getDescription())
            .signalType(request.getSignalType())
            .status(request.getStatus() != null ? request.getStatus() : AlertRule.RuleStatus.ACTIVE)
            .priority(request.getPriority() != null ? request.getPriority() : 0)
            .timeframe(request.getTimeframe() != null ? request.getTimeframe() : "1d")
            .logicOperator(request.getLogicOperator())
            .conditions(mapConditions(request.getConditions()))
            .conditionGroups(mapConditionGroups(request.getConditionGroups()))
            .action(mapAction(request.getAction()))
            .build();
    }
    
    private void updateRuleFields(AlertRule rule, AlertRuleRequest request) {
        rule.setSymbol(request.getSymbol());
        rule.setRuleName(request.getRuleName());
        rule.setDescription(request.getDescription());
        rule.setSignalType(request.getSignalType());
        if (request.getStatus() != null) {
            rule.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            rule.setPriority(request.getPriority());
        }
        if (request.getTimeframe() != null) {
            rule.setTimeframe(request.getTimeframe());
        }
        rule.setLogicOperator(request.getLogicOperator());
        rule.setConditions(mapConditions(request.getConditions()));
        rule.setConditionGroups(mapConditionGroups(request.getConditionGroups()));
        rule.setAction(mapAction(request.getAction()));
    }
    
    private List<AlertRule.RuleCondition> mapConditions(List<AlertRuleRequest.ConditionRequest> requests) {
        if (requests == null) return null;
        
        return requests.stream()
            .map(req -> AlertRule.RuleCondition.builder()
                .type(req.getType())
                .key(req.getKey())
                .params(req.getParams())
                .operator(req.getOperator())
                .value(req.getValue())
                .compareWith(req.getCompareWith() != null ? 
                    AlertRule.CompareWith.builder()
                        .type(req.getCompareWith().getType())
                        .key(req.getCompareWith().getKey())
                        .params(req.getCompareWith().getParams())
                        .build() : null)
                .build())
            .collect(Collectors.toList());
    }
    
    private List<AlertRule.ConditionGroup> mapConditionGroups(List<AlertRuleRequest.ConditionGroupRequest> requests) {
        if (requests == null) return null;
        
        return requests.stream()
            .map(req -> AlertRule.ConditionGroup.builder()
                .operator(req.getOperator())
                .conditions(mapConditions(req.getConditions()))
                .build())
            .collect(Collectors.toList());
    }
    
    private AlertRule.AlertAction mapAction(AlertRuleRequest.ActionRequest request) {
        return AlertRule.AlertAction.builder()
            .type(request.getType())
            .messageTemplate(request.getMessageTemplate())
            .cooldownMinutes(request.getCooldownMinutes() != null ? request.getCooldownMinutes() : 5)
            .build();
    }
}
