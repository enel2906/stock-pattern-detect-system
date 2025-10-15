package com.example.alert.service.chartpattern;

import com.example.alert.model.chartpattern.OhlcData;
import com.example.alert.model.chartpattern.TrianglePattern;
import com.example.alert.util.chartpattern.LinearRegressionUtils;
import com.example.alert.util.chartpattern.PivotPointUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Service để phát hiện Triangle patterns (Ascending, Descending, Symmetrical)
 * Dựa trên thuật toán triangles.py
 */
@Service
public class TriangleService {
    
    /**
     * Tìm Triangle patterns trong dữ liệu OHLC
     * 
     * @param ohlcDataList danh sách dữ liệu OHLC
     * @param lookback số periods để look back (default: 25)
     * @param minPoints số pivot points tối thiểu (default: 3)
     * @param rlimit R-squared fit lower limit (default: 0.9)
     * @param slmaxLimit limit cho slope của pivot highs (default: 0.00001)
     * @param slminLimit limit cho slope của pivot lows (default: 0.00001)
     * @param triangleType loại triangle: "ascending", "descending", "symmetrical", "all"
     * @return danh sách Triangle patterns được tìm thấy
     */
    public List<TrianglePattern> findTrianglePatterns(
            List<OhlcData> ohlcDataList,
            int lookback,
            int minPoints,
            double rlimit,
            double slmaxLimit,
            double slminLimit,
            String triangleType) {
        
        List<TrianglePattern> patterns = new ArrayList<>();
        
        // Tìm pivot points
        List<OhlcData> dataWithPivots = PivotPointUtils.findAllPivotPoints(ohlcDataList, 2, 2);
        
        // Lặp qua từng candle để tìm triangle pattern
        for (int candleIdx = lookback; candleIdx < dataWithPivots.size(); candleIdx++) {
            
            List<Double> maxima = new ArrayList<>();
            List<Double> minima = new ArrayList<>();
            List<Integer> xxmin = new ArrayList<>();
            List<Integer> xxmax = new ArrayList<>();
            
            // Thu thập pivot points trong lookback window
            for (int i = candleIdx - lookback; i <= candleIdx; i++) {
                OhlcData data = dataWithPivots.get(i);
                if (data.getPivot() == 1) { // pivot low
                    minima.add(data.getLow());
                    xxmin.add(i);
                }
                if (data.getPivot() == 2) { // pivot high
                    maxima.add(data.getHigh());
                    xxmax.add(i);
                }
            }
            
            // Kiểm tra số lượng pivot points đủ điều kiện
            if ((xxmax.size() < minPoints && xxmin.size() < minPoints) || 
                xxmax.isEmpty() || xxmin.isEmpty()) {
                continue;
            }
            
            // Chạy linear regression
            LinearRegressionUtils.RegressionResult minRegression;
            LinearRegressionUtils.RegressionResult maxRegression;
            try {
                minRegression = LinearRegressionUtils.linregress(xxmin, minima);
                maxRegression = LinearRegressionUtils.linregress(xxmax, maxima);
            } catch (IllegalArgumentException e) {
                // Không đủ dữ liệu để chạy regression, skip pattern này
                continue;
            }
            
            double slmin = minRegression.getSlope();
            double intercmin = minRegression.getIntercept();
            double rmin = Math.abs(minRegression.getRValue());
            
            double slmax = maxRegression.getSlope();
            double intercmax = maxRegression.getIntercept();
            double rmax = Math.abs(maxRegression.getRValue());
            
            // Kiểm tra pattern type và tạo pattern nếu match
            TrianglePattern pattern = null;
            
            if ("symmetrical".equals(triangleType) || "all".equals(triangleType)) {
                // Symmetrical: slmin tăng, slmax giảm
                if (rmax >= rlimit && rmin >= rlimit && 
                    slmin >= slminLimit && slmax <= -1 * slmaxLimit) {
                    
                    pattern = TrianglePattern.builder()
                        .candleIndex(candleIdx)
                        .triangleType("symmetrical")
                        .highIndices(new ArrayList<>(xxmax))
                        .lowIndices(new ArrayList<>(xxmin))
                        .slopeMax(slmax)
                        .slopeMin(slmin)
                        .interceptMin(intercmin)
                        .interceptMax(intercmax)
                        .rSquaredMax(rmax)
                        .rSquaredMin(rmin)
                        .patternType("triangle")
                        .build();
                    
                    patterns.add(pattern);
                }
            }
            
            if ("ascending".equals(triangleType) || "all".equals(triangleType)) {
                // Ascending: slmin tăng, slmax gần như nằm ngang
                if (rmax >= rlimit && rmin >= rlimit && 
                    slmin >= slminLimit && 
                    (slmax >= -1 * slmaxLimit && slmax <= slmaxLimit)) {
                    
                    pattern = TrianglePattern.builder()
                        .candleIndex(candleIdx)
                        .triangleType("ascending")
                        .highIndices(new ArrayList<>(xxmax))
                        .lowIndices(new ArrayList<>(xxmin))
                        .slopeMax(slmax)
                        .slopeMin(slmin)
                        .interceptMin(intercmin)
                        .interceptMax(intercmax)
                        .rSquaredMax(rmax)
                        .rSquaredMin(rmin)
                        .patternType("triangle")
                        .build();
                    
                    patterns.add(pattern);
                }
            }
            
            if ("descending".equals(triangleType) || "all".equals(triangleType)) {
                // Descending: slmax giảm, slmin gần như nằm ngang
                if (rmax >= rlimit && rmin >= rlimit && 
                    slmax <= -1 * slmaxLimit && 
                    (slmin >= -1 * slminLimit && slmin <= slminLimit)) {
                    
                    pattern = TrianglePattern.builder()
                        .candleIndex(candleIdx)
                        .triangleType("descending")
                        .highIndices(new ArrayList<>(xxmax))
                        .lowIndices(new ArrayList<>(xxmin))
                        .slopeMax(slmax)
                        .slopeMin(slmin)
                        .interceptMin(intercmin)
                        .interceptMax(intercmax)
                        .rSquaredMax(rmax)
                        .rSquaredMin(rmin)
                        .patternType("triangle")
                        .build();
                    
                    patterns.add(pattern);
                }
            }
        }
        
        return patterns;
    }
    
    /**
     * Overload method với default parameters
     */
    public List<TrianglePattern> findTrianglePatterns(List<OhlcData> ohlcDataList, String triangleType) {
        return findTrianglePatterns(ohlcDataList, 25, 3, 0.9, 0.00001, 0.00001, triangleType);
    }
    
    /**
     * Overload method với default "all" triangle type
     */
    public List<TrianglePattern> findTrianglePatterns(List<OhlcData> ohlcDataList) {
        return findTrianglePatterns(ohlcDataList, 25, 3, 0.9, 0.00001, 0.00001, "all");
    }
}
