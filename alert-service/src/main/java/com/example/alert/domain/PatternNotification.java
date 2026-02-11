package com.example.alert.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

/**
 * PatternNotification - Lưu trữ thông báo khi phát hiện mô hình nến
 * Mỗi khi hệ thống phát hiện một mô hình nến mới, sẽ tạo một notification mới
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "pattern_notifications")
@CompoundIndexes({
    @CompoundIndex(name = "user_read_idx", def = "{'user_id': 1, 'is_read': 1}"),
    @CompoundIndex(name = "user_created_idx", def = "{'user_id': 1, 'created_at': -1}")
})
public class PatternNotification {
    
    @Id
    private String id;
    
    /**
     * ID của user nhận notification
     */
    @Indexed
    @Field("user_id")
    private String userId;
    
    /**
     * Mã cổ phiếu (VD: ACB, VNM, FPT)
     */
    @Field("stock_symbol")
    private String stockSymbol;
    
    /**
     * Tên mô hình nến (VD: hammer, engulfing, morning_star)
     */
    @Field("pattern_name")
    private String patternName;
    
    /**
     * Tên hiển thị của mô hình (VD: Hammer, Bullish Engulfing, Morning Star)
     */
    @Field("pattern_display_name")
    private String patternDisplayName;
    
    /**
     * Xu hướng của mô hình: bullish, bearish, neutral
     */
    @Field("sentiment")
    private String sentiment;
    
    /**
     * Ngày phát hiện mô hình (thời gian của nến)
     */
    @Field("pattern_date")
    private String patternDate;
    
    /**
     * Giá đóng cửa tại thời điểm phát hiện
     */
    @Field("close_price")
    private Double closePrice;
    
    /**
     * Nội dung thông báo
     */
    @Field("message")
    private String message;
    
    /**
     * Đã đọc hay chưa
     */
    @Field("is_read")
    @Builder.Default
    private Boolean isRead = false;
    
    /**
     * Thời gian tạo notification
     */
    @Field("created_at")
    private LocalDateTime createdAt;
    
    /**
     * Thời gian đọc notification
     */
    @Field("read_at")
    private LocalDateTime readAt;
}
