package com.example.alert.controller;

import com.example.alert.dto.AlertRuleRequest;
import com.example.alert.dto.AlertRuleResponse;
import com.example.alert.response.Response;
import com.example.alert.security.UserPrincipal;
import com.example.alert.service.AlertRuleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/alert-rules")
@RequiredArgsConstructor
@Slf4j
public class AlertRuleController {
    
    private final AlertRuleService alertRuleService;
    
    /**
     * Create a new alert rule
     */
    @PostMapping
    public ResponseEntity<Response> createRule(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AlertRuleRequest request) {
        try {
            log.info("Creating alert rule for user: {}", userPrincipal.getId());
            AlertRuleResponse rule = alertRuleService.createRule(userPrincipal.getId(), request);
            return ResponseEntity.ok(Response.success(rule));
        } catch (IllegalArgumentException e) {
            log.error("Error creating alert rule: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Response.error(400, e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating alert rule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Response.error(500, "Failed to create alert rule"));
        }
    }
    
    /**
     * Update an existing alert rule
     */
    @PutMapping("/{ruleId}")
    public ResponseEntity<Response> updateRule(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String ruleId,
            @Valid @RequestBody AlertRuleRequest request) {
        try {
            log.info("Updating alert rule: {} for user: {}", ruleId, userPrincipal.getId());
            AlertRuleResponse rule = alertRuleService.updateRule(userPrincipal.getId(), ruleId, request);
            return ResponseEntity.ok(Response.success(rule));
        } catch (IllegalArgumentException e) {
            log.error("Error updating alert rule: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Response.error(400, e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error updating alert rule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Response.error(500, "Failed to update alert rule"));
        }
    }
    
    /**
     * Delete an alert rule
     */
    @DeleteMapping("/{ruleId}")
    public ResponseEntity<Response> deleteRule(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String ruleId) {
        try {
            log.info("Deleting alert rule: {} for user: {}", ruleId, userPrincipal.getId());
            alertRuleService.deleteRule(userPrincipal.getId(), ruleId);
            return ResponseEntity.ok(Response.SUCCESS_RESPONSE);
        } catch (IllegalArgumentException e) {
            log.error("Error deleting alert rule: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Response.error(400, e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error deleting alert rule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Response.error(500, "Failed to delete alert rule"));
        }
    }
    
    /**
     * Get a single alert rule
     */
    @GetMapping("/{ruleId}")
    public ResponseEntity<Response> getRule(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String ruleId) {
        try {
            AlertRuleResponse rule = alertRuleService.getRule(userPrincipal.getId(), ruleId);
            return ResponseEntity.ok(Response.success(rule));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Response.error(400, e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error retrieving alert rule", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Response.error(500, "Failed to retrieve alert rule"));
        }
    }
    
    /**
     * Get all alert rules for the current user
     */
    @GetMapping
    public ResponseEntity<Response> getUserRules(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            log.info("Fetching all alert rules for user: {}", userPrincipal.getId());
            List<AlertRuleResponse> rules = alertRuleService.getUserRules(userPrincipal.getId());
            return ResponseEntity.ok(Response.success(rules));
        } catch (Exception e) {
            log.error("Unexpected error fetching alert rules", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Response.error(500, "Failed to retrieve alert rules"));
        }
    }
    
    /**
     * Get alert rules for a specific symbol
     */
    @GetMapping("/symbol/{symbol}")
    public ResponseEntity<Response> getUserRulesBySymbol(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String symbol) {
        try {
            log.info("Fetching alert rules for user: {} and symbol: {}", userPrincipal.getId(), symbol);
            List<AlertRuleResponse> rules = alertRuleService.getUserRulesBySymbol(userPrincipal.getId(), symbol);
            return ResponseEntity.ok(Response.success(rules));
        } catch (Exception e) {
            log.error("Unexpected error fetching alert rules for symbol", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Response.error(500, "Failed to retrieve alert rules"));
        }
    }
    
    /**
     * Toggle rule status (ACTIVE <-> PAUSED)
     */
    @PatchMapping("/{ruleId}/toggle")
    public ResponseEntity<Response> toggleRuleStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String ruleId) {
        try {
            log.info("Toggling status for alert rule: {} by user: {}", ruleId, userPrincipal.getId());
            AlertRuleResponse rule = alertRuleService.toggleRuleStatus(userPrincipal.getId(), ruleId);
            return ResponseEntity.ok(Response.success(rule));
        } catch (IllegalArgumentException e) {
            log.error("Error toggling rule status: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(Response.error(400, e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error toggling rule status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Response.error(500, "Failed to toggle rule status"));
        }
    }
}
