package com.example.alert.controller;

import com.example.alert.dto.AlertSettingDTO;
import com.example.alert.response.Response;
import com.example.alert.security.UserPrincipal;
import com.example.alert.service.AlertSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cho AlertSetting APIs
 * Quản lý việc bật/tắt combo signal alerts cho user
 */
@RestController
@RequestMapping("/api/alert-settings")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AlertSettingController {
    
    private final AlertSettingService alertSettingService;
    
    /**
     * Lấy tất cả alert settings của user hiện tại
     * GET /api/alert-settings
     */
    @GetMapping
    public ResponseEntity<Response> getMyAlertSettings(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<AlertSettingDTO> settings = alertSettingService.getAlertSettingsByUserId(userPrincipal.getUser().getId());
        return ResponseEntity.ok(Response.success(settings));
    }
    
    /**
     * Lấy danh sách comboSignalId mà user đã bật
     * GET /api/alert-settings/active-ids
     */
    @GetMapping("/active-ids")
    public ResponseEntity<Response> getActiveComboSignalIds(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<String> ids = alertSettingService.getActiveComboSignalIds(userPrincipal.getUser().getId());
        return ResponseEntity.ok(Response.success(ids));
    }
    
    /**
     * Lấy alert settings kèm thông tin chi tiết combo signal
     * GET /api/alert-settings/with-details
     */
    @GetMapping("/with-details")
    public ResponseEntity<Response> getAlertSettingsWithDetails(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<AlertSettingDTO> settings = alertSettingService.getAlertSettingsWithComboSignal(userPrincipal.getUser().getId());
        return ResponseEntity.ok(Response.success(settings));
    }
    
    /**
     * Bật alert cho một combo signal
     * POST /api/alert-settings/{comboSignalId}
     */
    @PostMapping("/{comboSignalId}")
    public ResponseEntity<Response> enableComboSignal(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String comboSignalId) {
        try {
            AlertSettingDTO setting = alertSettingService.enableComboSignal(
                    userPrincipal.getUser().getId(), comboSignalId);
            return ResponseEntity.ok(Response.success(setting));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Response.error(e.getMessage()));
        }
    }
    
    /**
     * Tắt alert cho một combo signal
     * DELETE /api/alert-settings/{comboSignalId}
     */
    @DeleteMapping("/{comboSignalId}")
    public ResponseEntity<Response> disableComboSignal(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String comboSignalId) {
        alertSettingService.disableComboSignal(userPrincipal.getUser().getId(), comboSignalId);
        return ResponseEntity.ok(Response.success("Đã tắt combo signal: " + comboSignalId));
    }
    
    /**
     * Toggle (bật/tắt) alert cho một combo signal
     * PUT /api/alert-settings/{comboSignalId}/toggle
     */
    @PutMapping("/{comboSignalId}/toggle")
    public ResponseEntity<Response> toggleComboSignal(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String comboSignalId) {
        try {
            AlertSettingService.ToggleResponse response = alertSettingService.toggleComboSignal(
                    userPrincipal.getUser().getId(), comboSignalId);
            return ResponseEntity.ok(Response.success(response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Response.error(e.getMessage()));
        }
    }
    
    /**
     * Kiểm tra user có bật combo signal này không
     * GET /api/alert-settings/{comboSignalId}/status
     */
    @GetMapping("/{comboSignalId}/status")
    public ResponseEntity<Response> checkComboSignalStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String comboSignalId) {
        boolean enabled = alertSettingService.isComboSignalEnabled(userPrincipal.getUser().getId(), comboSignalId);
        return ResponseEntity.ok(Response.success(enabled));
    }
    
    /**
     * Xóa tất cả alert settings của user
     * DELETE /api/alert-settings/all
     */
    @DeleteMapping("/all")
    public ResponseEntity<Response> clearAllAlertSettings(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        alertSettingService.clearAllAlertSettings(userPrincipal.getUser().getId());
        return ResponseEntity.ok(Response.success("Đã xóa tất cả alert settings"));
    }
}
