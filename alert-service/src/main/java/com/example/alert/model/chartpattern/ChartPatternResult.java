package com.example.alert.model.chartpattern;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Model tổng hợp kết quả phát hiện tất cả các chart patterns
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChartPatternResult {
    private String stockSymbol;
    private long analysisTime;
    private List<FlagPattern> flagPatterns;
    private List<DoublePattern> doublePatterns;
    // Có thể thêm các pattern khác
    private int totalPatternsFound;
}