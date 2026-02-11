package com.example.alert.service;

import com.example.alert.domain.PatternNotification;
import com.example.alert.dto.CreateNotificationRequest;
import com.example.alert.dto.PatternNotificationDTO;
import com.example.alert.repository.PatternNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý logic cho PatternNotification
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PatternNotificationService {
    
    private final PatternNotificationRepository notificationRepository;
    
    // Số ngày giữ notification (30 ngày)
    private static final int NOTIFICATION_RETENTION_DAYS = 30;
    
    /**
     * Tạo notification mới khi phát hiện mô hình
     */
    @Transactional
    public PatternNotificationDTO createNotification(String userId, CreateNotificationRequest request) {
        // Kiểm tra notification đã tồn tại chưa (tránh duplicate)
        PatternNotification existing = notificationRepository.findExistingNotification(
                userId, 
                request.getStockSymbol(), 
                request.getPatternName(), 
                request.getPatternDate()
        );
        
        if (existing != null) {
            log.debug("Notification already exists for user {}, stock {}, pattern {}, date {}", 
                    userId, request.getStockSymbol(), request.getPatternName(), request.getPatternDate());
            return toDTO(existing);
        }
        
        // Tạo message cho notification
        String message = generateMessage(request);
        
        PatternNotification notification = PatternNotification.builder()
                .userId(userId)
                .stockSymbol(request.getStockSymbol())
                .patternName(request.getPatternName())
                .patternDisplayName(request.getPatternDisplayName())
                .sentiment(request.getSentiment())
                .patternDate(request.getPatternDate())
                .closePrice(request.getClosePrice())
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        PatternNotification saved = notificationRepository.save(notification);
        log.info("Created notification for user {}: {}", userId, message);
        
        return toDTO(saved);
    }
    
    /**
     * Lấy tất cả notification của user
     */
    public List<PatternNotificationDTO> getNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy notification của user với phân trang
     */
    public List<PatternNotificationDTO> getNotifications(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy notification chưa đọc của user
     */
    public List<PatternNotificationDTO> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Đếm số notification chưa đọc
     */
    public long countUnreadNotifications(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
    
    /**
     * Đánh dấu notification đã đọc
     */
    @Transactional
    public PatternNotificationDTO markAsRead(String userId, String notificationId) {
        PatternNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
        
        // Kiểm tra quyền sở hữu
        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to notification");
        }
        
        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        PatternNotification saved = notificationRepository.save(notification);
        
        log.debug("Marked notification {} as read for user {}", notificationId, userId);
        return toDTO(saved);
    }
    
    /**
     * Đánh dấu tất cả notification đã đọc
     */
    @Transactional
    public void markAllAsRead(String userId) {
        List<PatternNotification> unreadNotifications = 
                notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        
        LocalDateTime now = LocalDateTime.now();
        unreadNotifications.forEach(notification -> {
            notification.setIsRead(true);
            notification.setReadAt(now);
        });
        
        notificationRepository.saveAll(unreadNotifications);
        log.info("Marked {} notifications as read for user {}", unreadNotifications.size(), userId);
    }
    
    /**
     * Xóa một notification
     */
    @Transactional
    public void deleteNotification(String userId, String notificationId) {
        PatternNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
        
        // Kiểm tra quyền sở hữu
        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to notification");
        }
        
        notificationRepository.delete(notification);
        log.debug("Deleted notification {} for user {}", notificationId, userId);
    }
    
    /**
     * Xóa tất cả notification của user
     */
    @Transactional
    public void deleteAllNotifications(String userId) {
        notificationRepository.deleteByUserId(userId);
        log.info("Deleted all notifications for user {}", userId);
    }
    
    /**
     * Lấy notification của user theo stock symbol
     */
    public List<PatternNotificationDTO> getNotificationsByStock(String userId, String stockSymbol) {
        return notificationRepository.findByUserIdAndStockSymbolOrderByCreatedAtDesc(userId, stockSymbol)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Xóa notification cũ (chạy hàng ngày lúc 2h sáng)
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupOldNotifications() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(NOTIFICATION_RETENTION_DAYS);
        notificationRepository.deleteByCreatedAtBefore(cutoff);
        log.info("Cleaned up notifications older than {} days", NOTIFICATION_RETENTION_DAYS);
    }
    
    /**
     * Tạo message cho notification
     */
    private String generateMessage(CreateNotificationRequest request) {
        String sentimentEmoji = getSentimentEmoji(request.getSentiment());
        String sentimentText = getSentimentText(request.getSentiment());
        
        return String.format("%s Xuất hiện mô hình %s (%s) tại mã %s vào ngày %s - Giá: %.2f",
                sentimentEmoji,
                request.getPatternDisplayName(),
                sentimentText,
                request.getStockSymbol(),
                request.getPatternDate(),
                request.getClosePrice() != null ? request.getClosePrice() : 0.0
        );
    }
    
    private String getSentimentEmoji(String sentiment) {
        if (sentiment == null) return "⚪";
        return switch (sentiment.toLowerCase()) {
            case "bullish" -> "🟢";
            case "bearish" -> "🔴";
            default -> "⚪";
        };
    }
    
    private String getSentimentText(String sentiment) {
        if (sentiment == null) return "Trung lập";
        return switch (sentiment.toLowerCase()) {
            case "bullish" -> "Tăng giá";
            case "bearish" -> "Giảm giá";
            default -> "Trung lập";
        };
    }
    
    /**
     * Convert entity to DTO
     */
    private PatternNotificationDTO toDTO(PatternNotification entity) {
        return PatternNotificationDTO.builder()
                .id(entity.getId())
                .stockSymbol(entity.getStockSymbol())
                .patternName(entity.getPatternName())
                .patternDisplayName(entity.getPatternDisplayName())
                .sentiment(entity.getSentiment())
                .patternDate(entity.getPatternDate())
                .closePrice(entity.getClosePrice())
                .message(entity.getMessage())
                .isRead(entity.getIsRead())
                .createdAt(entity.getCreatedAt())
                .readAt(entity.getReadAt())
                .build();
    }
}
