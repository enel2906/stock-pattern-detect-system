package com.example.alert.controller;

import com.example.alert.dto.CreateNotificationRequest;
import com.example.alert.dto.PatternNotificationDTO;
import com.example.alert.response.Response;
import com.example.alert.security.UserPrincipal;
import com.example.alert.service.PatternNotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller cho PatternNotification APIs
 * Quản lý thông báo phát hiện mô hình nến
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PatternNotificationController {
    
    private final PatternNotificationService notificationService;
    
    /**
     * Tạo notification mới khi phát hiện mô hình
     * POST /api/notifications
     */
    @PostMapping
    public ResponseEntity<Response> createNotification(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreateNotificationRequest request) {
        try {
            PatternNotificationDTO notification = notificationService.createNotification(
                    userPrincipal.getUser().getId(), request);
            return ResponseEntity.ok(Response.success(notification));
        } catch (Exception e) {
            log.error("Error creating notification", e);
            return ResponseEntity.badRequest()
                    .body(Response.error("Failed to create notification: " + e.getMessage()));
        }
    }
    
    /**
     * Lấy tất cả notification của user
     * GET /api/notifications
     */
    @GetMapping
    public ResponseEntity<Response> getNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "50") int size) {
        List<PatternNotificationDTO> notifications;
        if (page > 0 || size != 50) {
            notifications = notificationService.getNotifications(
                    userPrincipal.getUser().getId(), page, size);
        } else {
            notifications = notificationService.getNotifications(
                    userPrincipal.getUser().getId());
        }
        return ResponseEntity.ok(Response.success(notifications));
    }
    
    /**
     * Lấy notification chưa đọc của user
     * GET /api/notifications/unread
     */
    @GetMapping("/unread")
    public ResponseEntity<Response> getUnreadNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<PatternNotificationDTO> notifications = notificationService.getUnreadNotifications(
                userPrincipal.getUser().getId());
        return ResponseEntity.ok(Response.success(notifications));
    }
    
    /**
     * Đếm số notification chưa đọc
     * GET /api/notifications/unread/count
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Response> countUnreadNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        long count = notificationService.countUnreadNotifications(
                userPrincipal.getUser().getId());
        return ResponseEntity.ok(Response.success(Map.of("count", count)));
    }
    
    /**
     * Đánh dấu notification đã đọc
     * PUT /api/notifications/{id}/read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Response> markAsRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id) {
        try {
            PatternNotificationDTO notification = notificationService.markAsRead(
                    userPrincipal.getUser().getId(), id);
            return ResponseEntity.ok(Response.success(notification));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Response.error(e.getMessage()));
        }
    }
    
    /**
     * Đánh dấu tất cả notification đã đọc
     * PUT /api/notifications/read-all
     */
    @PutMapping("/read-all")
    public ResponseEntity<Response> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.markAllAsRead(userPrincipal.getUser().getId());
        return ResponseEntity.ok(Response.success("All notifications marked as read"));
    }
    
    /**
     * Xóa một notification
     * DELETE /api/notifications/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Response> deleteNotification(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String id) {
        try {
            notificationService.deleteNotification(userPrincipal.getUser().getId(), id);
            return ResponseEntity.ok(Response.success("Notification deleted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Response.error(e.getMessage()));
        }
    }
    
    /**
     * Xóa tất cả notification của user
     * DELETE /api/notifications/all
     */
    @DeleteMapping("/all")
    public ResponseEntity<Response> deleteAllNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.deleteAllNotifications(userPrincipal.getUser().getId());
        return ResponseEntity.ok(Response.success("All notifications deleted"));
    }
    
    /**
     * Lấy notification của user theo stock symbol
     * GET /api/notifications/stock/{symbol}
     */
    @GetMapping("/stock/{symbol}")
    public ResponseEntity<Response> getNotificationsByStock(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable String symbol) {
        List<PatternNotificationDTO> notifications = notificationService.getNotificationsByStock(
                userPrincipal.getUser().getId(), symbol);
        return ResponseEntity.ok(Response.success(notifications));
    }
}
