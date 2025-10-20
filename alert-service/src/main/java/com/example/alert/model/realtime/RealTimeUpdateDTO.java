package com.example.alert.model.realtime;

import com.example.alert.domain.CandleStick;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for real-time candlestick updates with pattern detection
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RealTimeUpdateDTO {
    private String symbol;
    private List<CandleStick> recentCandles; // 5 nến gần nhất
    private String detectedPattern; // Tên mẫu hình được phát hiện (hoặc null)
    private CandleStick patternCandle; // Nến có mẫu hình
    private long timestamp;
}
