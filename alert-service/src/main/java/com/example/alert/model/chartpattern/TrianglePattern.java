package com.example.alert.model.chartpattern;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Model đại diện cho Triangle pattern detection result
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TrianglePattern {
    private int candleIndex;
    private String triangleType; // "ascending", "descending", "symmetrical"
    private List<Integer> highIndices;
    private List<Integer> lowIndices;
    private double slopeMax;
    private double slopeMin;
    private double interceptMin;
    private double interceptMax;
    private double rSquaredMax;
    private double rSquaredMin;
    private String patternType; // "triangle"
}
