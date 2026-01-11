package com.example.alert.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ComboSignal - Định nghĩa combo tín hiệu kết hợp mô hình nến với chỉ báo kỹ thuật
 * Sử dụng ATR-Based Risk Management (R/R = 1:2)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "combo_signals")
public class ComboSignal {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    @Field("combo_id")
    private String comboId;
    
    private String name;
    
    private String description;
    
    /**
     * Tên pattern nến (hammer, bullish_engulfing, shooting_star, doji, three_white_soldiers...)
     */
    private String pattern;
    
    /**
     * Danh sách điều kiện chỉ báo kỹ thuật
     */
    private List<IndicatorCondition> indicators;
    
    /**
     * Cấu hình dự báo và đánh giá
     */
    private Prediction prediction;
    
    /**
     * Sentiment: bullish, bearish, neutral
     */
    private String sentiment;
    
    /**
     * Độ tin cậy: high, very_high, medium
     */
    private String reliability;
    
    /**
     * Icon hiển thị (emoji)
     */
    private String icon;
    
    /**
     * Màu hiển thị (hex color)
     */
    private String color;
    
    /**
     * Trạng thái active (admin có thể disable combo)
     */
    @Builder.Default
    private Boolean enabled = true;
    
    @Field("created_at")
    private LocalDateTime createdAt;
    
    @Field("updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * Embedded class cho điều kiện chỉ báo
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndicatorCondition {
        /**
         * Loại chỉ báo: rsi, macd_crossover, bollinger_squeeze, volume_spike, ma_slope, price_vs_ma
         */
        private String type;
        
        /**
         * Period của chỉ báo (vd: RSI 14, MA 20, MA 50...)
         */
        private Integer period;
        
        /**
         * Điều kiện so sánh: lessThan, greaterThan, crossUp, crossDown, squeeze, slopeUp, slopeDown, nearOrAbove, greaterThanMultiple
         */
        private String condition;
        
        /**
         * Ngưỡng so sánh
         */
        private Double threshold;
        
        // Các field mở rộng cho MACD
        private Integer fastPeriod;
        private Integer slowPeriod;
        private Integer signalPeriod;
        
        // Các field mở rộng cho Bollinger Bands
        private Integer stdDev;
        
        // Các field mở rộng cho MA
        private String maType; // sma, ema
    }
    
    /**
     * Embedded class cho cấu hình dự báo
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Prediction {
        /**
         * Hướng dự báo: bullish, bearish, neutral
         */
        private String direction;
        
        /**
         * Số phiên đánh giá
         */
        private Integer timeframe;
        
        /**
         * Target gain % (fallback khi không đủ dữ liệu ATR)
         */
        private Double targetGain;
        
        /**
         * Stop loss % (fallback khi không đủ dữ liệu ATR)
         */
        private Double stopLoss;
        
        /**
         * ATR multiplier cho stop loss (mặc định 1.0)
         */
        @Builder.Default
        private Double atrStopMultiplier = 1.0;
        
        /**
         * ATR multiplier cho target (mặc định 2.0)
         */
        @Builder.Default
        private Double atrTargetMultiplier = 2.0;
    }
}
