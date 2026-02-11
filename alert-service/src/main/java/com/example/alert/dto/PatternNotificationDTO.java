package com.example.alert.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO cho PatternNotification
 * Dùng để trả về thông tin notification cho client
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatternNotificationDTO {
    
    private String id;
    
    private String stockSymbol;
    
    private String patternName;
    
    private String patternDisplayName;
    
    private String sentiment;
    
    private String patternDate;
    
    private Double closePrice;
    
    private String message;
    
    private Boolean isRead;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime readAt;
}
