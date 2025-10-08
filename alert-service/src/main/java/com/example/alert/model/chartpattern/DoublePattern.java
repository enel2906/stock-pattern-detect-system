package com.example.alert.model.chartpattern;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Model đại diện cho Double pattern detection result
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DoublePattern {
    private int candleIndex;
    private String doubleType; // "tops" hoặc "bottoms"
    private List<Integer> pivotIndices;
    private List<Double> pivotPoints;
    private double ratio; // tỷ lệ giữa hai đỉnh/đáy
}