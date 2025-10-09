package com.example.alert.model.chartpattern;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Model đại diện cho Head and Shoulders pattern detection result
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class HeadAndShouldersPattern {
    private int candleIndex;
    private List<Integer> patternIndices; // [leftShoulder, leftNeckline, head, rightNeckline, rightShoulder]
    private List<Double> patternPoints;   // giá trị tương ứng
    private double necklineSlope;
    private int lookback;
    private String patternType; // "head_and_shoulders"
}
