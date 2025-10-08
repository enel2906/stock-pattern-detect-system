package com.example.alert.model.chartpattern;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Model đại diện cho data OHLC được sử dụng trong phân tích chart patterns
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OhlcData {
    private double open;
    private double high;
    private double low;
    private double close;
    private double volume;
    private long date;
    private int index; // index trong series
    
    // Fields cho pivot points
    private int pivot; // 0: không phải pivot, 1: pivot thấp, 2: pivot cao
    private double pivotPos; // giá trị tại pivot point
    
    // Fields cho patterns
    private String chartType;
    private List<Double> patternData;
    private List<Integer> patternIndices;
}