package com.example.alert.model.chartpattern;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Model đại diện cho Pennant pattern detection result
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PennantPattern {
    private int candleIndex;
    private List<Double> pennantHighs;
    private List<Double> pennantLows;
    private List<Integer> pennantHighsIdx;
    private List<Integer> pennantLowsIdx;
    private double slopeMax;
    private double slopeMin;
    private double interceptMin;
    private double interceptMax;
    private double rSquaredMax;
    private double rSquaredMin;
    private String patternType; // "pennant"
}
