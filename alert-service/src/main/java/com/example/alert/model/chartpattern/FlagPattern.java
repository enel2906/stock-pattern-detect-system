package com.example.alert.model.chartpattern;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Model đại diện cho Flag pattern detection result
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FlagPattern {
    private int candleIndex;
    private List<Double> flagHighs;
    private List<Double> flagLows;
    private List<Integer> flagHighsIdx;
    private List<Integer> flagLowsIdx;
    private double slopeMax;
    private double slopeMin;
    private double interceptMin;
    private double interceptMax;
    private double rSquaredMax;
    private double rSquaredMin;
    private String direction; // "bullish" hoặc "bearish"
}