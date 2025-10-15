package com.example.alert.service.chartpattern;

import com.example.alert.model.chartpattern.InverseHeadAndShouldersPattern;
import com.example.alert.model.chartpattern.OhlcData;
import com.example.alert.util.chartpattern.ChartPatternsUtils;
import com.example.alert.util.chartpattern.LinearRegressionUtils;
import com.example.alert.util.chartpattern.PivotPointUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Service để phát hiện Inverse Head and Shoulders pattern
 * Dựa trên thuật toán inverse_head_and_shoulders.py
 */
@Service
public class InverseHeadAndShouldersService {
    
    /**
     * Tìm Inverse Head and Shoulders patterns trong dữ liệu OHLC
     * 
     * @param ohlcDataList danh sách dữ liệu OHLC
     * @param lookback số periods để look back (default: 60)
     * @param pivotInterval số candles để xác định pivot point (default: 10)
     * @param shortPivotInterval pivot interval ngắn hơn (default: 5)
     * @param headRatioBefore tỷ lệ giữa head và shoulder trái (default: 0.98)
     * @param headRatioAfter tỷ lệ giữa head và shoulder phải (default: 0.98)
     * @param upperSlmax upper limit của neckline slope (default: 1e-4)
     * @return danh sách Inverse Head and Shoulders patterns được tìm thấy
     */
    public List<InverseHeadAndShouldersPattern> findInverseHeadAndShouldersPatterns(
            List<OhlcData> ohlcDataList,
            int lookback,
            int pivotInterval,
            int shortPivotInterval,
            double headRatioBefore,
            double headRatioAfter,
            double upperSlmax) {
        
        List<InverseHeadAndShouldersPattern> patterns = new ArrayList<>();
        
        // Validation
        if (shortPivotInterval <= 0 || pivotInterval <= 0) {
            throw new IllegalArgumentException("Pivot intervals must be greater than 0");
        }
        
        if (shortPivotInterval >= pivotInterval) {
            throw new IllegalArgumentException("short_pivot_interval must be less than pivot_interval");
        }
        
        // Tìm pivot points với hai intervals khác nhau
        List<OhlcData> dataWithPivots = PivotPointUtils.findAllPivotPoints(
            ohlcDataList, pivotInterval, pivotInterval);
        
        // Tìm short pivot points
        List<OhlcData> dataWithShortPivots = PivotPointUtils.findAllPivotPoints(
            dataWithPivots, shortPivotInterval, shortPivotInterval);
        
        // Lặp qua từng candle để tìm inverse head and shoulders pattern
        for (int candleIdx = lookback; candleIdx < dataWithShortPivots.size(); candleIdx++) {
            OhlcData currentCandle = dataWithShortPivots.get(candleIdx);
            
            // Kiểm tra xem có phải pivot low không (pivot = 1)
            if (currentCandle.getPivot() != 1) {
                continue;
            }
            
            // Tìm các pivot points trong lookback window
            ChartPatternsUtils.FindPointsResult points = 
                ChartPatternsUtils.findPoints(dataWithShortPivots, candleIdx, lookback);
            
            List<Double> maxima = points.getMaxima();
            List<Double> minima = points.getMinima();
            List<Integer> xxmax = points.getXxmax();
            List<Integer> xxmin = points.getXxmin();
            
            // Kiểm tra số lượng pivot points đủ điều kiện
            if (points.getMinbcount() < 1 || points.getMinacount() < 1 || 
                points.getMaxbcount() < 1 || points.getMaxacount() < 1) {
                continue;
            }
            
            // Chạy linear regression cho neckline (maxima)
            LinearRegressionUtils.RegressionResult maxRegression;
            try {
                maxRegression = LinearRegressionUtils.linregress(xxmax, maxima);
            } catch (IllegalArgumentException e) {
                // Không đủ dữ liệu để chạy regression, skip pattern này
                continue;
            }
            double slmax = maxRegression.getSlope();
            
            // Tìm head index (giá trị thấp nhất)
            int headIdx = ChartPatternsUtils.argmin(minima);
            
            // Nếu head là giá trị cuối cùng thì bỏ qua
            if (headIdx == minima.size() - 1 || headIdx < 1) {
                continue;
            }
            
            // Kiểm tra điều kiện inverse head and shoulders
            boolean isValidPattern = 
                // Head thấp hơn left shoulder
                (minima.get(headIdx - 1) - minima.get(headIdx) > 0) &&
                (minima.get(headIdx) / minima.get(headIdx - 1) < 1) &&
                (minima.get(headIdx) / minima.get(headIdx - 1) >= headRatioBefore) &&
                // Head thấp hơn right shoulder
                (minima.get(headIdx) / minima.get(headIdx + 1) < 1) &&
                (minima.get(headIdx) / minima.get(headIdx + 1) >= headRatioAfter) &&
                (minima.get(headIdx + 1) - minima.get(headIdx) > 0) &&
                // Neckline slope trong giới hạn
                (Math.abs(slmax) <= upperSlmax) &&
                // Neckline positions đúng thứ tự
                (xxmax.get(0) > xxmin.get(headIdx - 1)) &&
                (xxmax.get(1) < xxmin.get(headIdx + 1));
            
            if (isValidPattern) {
                // Tạo pattern với các indices và values
                List<Integer> indices = Arrays.asList(
                    xxmin.get(headIdx - 1),  // left shoulder
                    xxmax.get(0),             // left neckline
                    xxmin.get(headIdx),       // head
                    xxmax.get(1),             // right neckline
                    xxmin.get(headIdx + 1)    // right shoulder
                );
                
                List<Double> values = Arrays.asList(
                    minima.get(headIdx - 1),
                    maxima.get(0),
                    minima.get(headIdx),
                    maxima.get(1),
                    minima.get(headIdx + 1)
                );
                
                InverseHeadAndShouldersPattern pattern = InverseHeadAndShouldersPattern.builder()
                    .candleIndex(candleIdx)
                    .patternIndices(indices)
                    .patternPoints(values)
                    .necklineSlope(slmax)
                    .lookback(lookback)
                    .patternType("inverse_head_and_shoulders")
                    .build();
                
                patterns.add(pattern);
            }
        }
        
        return patterns;
    }
    
    /**
     * Overload method với default parameters
     */
    public List<InverseHeadAndShouldersPattern> findInverseHeadAndShouldersPatterns(
            List<OhlcData> ohlcDataList) {
        return findInverseHeadAndShouldersPatterns(ohlcDataList, 60, 10, 5, 0.98, 0.98, 1e-4);
    }
}
