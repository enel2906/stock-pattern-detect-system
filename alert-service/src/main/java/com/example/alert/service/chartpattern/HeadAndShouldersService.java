package com.example.alert.service.chartpattern;

import com.example.alert.model.chartpattern.HeadAndShouldersPattern;
import com.example.alert.model.chartpattern.OhlcData;
import com.example.alert.util.chartpattern.ChartPatternsUtils;
import com.example.alert.util.chartpattern.LinearRegressionUtils;
import com.example.alert.util.chartpattern.PivotPointUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Service để phát hiện Head and Shoulders pattern
 * Dựa trên thuật toán head_and_shoulders.py
 */
@Service
public class HeadAndShouldersService {
    
    /**
     * Tìm Head and Shoulders patterns trong dữ liệu OHLC
     * 
     * @param ohlcDataList danh sách dữ liệu OHLC
     * @param lookback số periods để look back (default: 60)
     * @param pivotInterval số candles để xác định pivot point (default: 10)
     * @param shortPivotInterval pivot interval ngắn hơn (default: 5)
     * @param headRatioBefore tỷ lệ giữa head và shoulder trái (default: 1.0002)
     * @param headRatioAfter tỷ lệ giữa head và shoulder phải (default: 1.0002)
     * @param upperSlmin upper limit của neckline slope (default: 1e-4)
     * @return danh sách Head and Shoulders patterns được tìm thấy
     */
    public List<HeadAndShouldersPattern> findHeadAndShouldersPatterns(
            List<OhlcData> ohlcDataList,
            int lookback,
            int pivotInterval,
            int shortPivotInterval,
            double headRatioBefore,
            double headRatioAfter,
            double upperSlmin) {
        
        List<HeadAndShouldersPattern> patterns = new ArrayList<>();
        
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
        
        // Tìm short pivot points (lưu trong một field riêng nếu cần)
        // Để đơn giản, ta sẽ sử dụng lại pivot field
        List<OhlcData> dataWithShortPivots = PivotPointUtils.findAllPivotPoints(
            dataWithPivots, shortPivotInterval, shortPivotInterval);
        
        // Lặp qua từng candle để tìm head and shoulders pattern
        for (int candleIdx = lookback; candleIdx < dataWithShortPivots.size(); candleIdx++) {
            OhlcData currentCandle = dataWithShortPivots.get(candleIdx);
            
            // Kiểm tra xem có phải pivot high không (pivot = 2)
            if (currentCandle.getPivot() != 2) {
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
            
            // Chạy linear regression cho neckline (minima)
            LinearRegressionUtils.RegressionResult minRegression;
            try {
                minRegression = LinearRegressionUtils.linregress(xxmin, minima);
            } catch (IllegalArgumentException e) {
                // Không đủ dữ liệu để chạy regression, skip pattern này
                continue;
            }
            double slmin = minRegression.getSlope();
            
            // Tìm head index (giá trị cao nhất)
            int headIdx = ChartPatternsUtils.argmax(maxima);
            
            // Nếu head là giá trị cuối cùng thì bỏ qua
            if (headIdx == maxima.size() - 1 || headIdx < 1) {
                continue;
            }
            
            // Kiểm tra điều kiện head and shoulders
            boolean isValidPattern = 
                // Head cao hơn left shoulder
                (maxima.get(headIdx) - maxima.get(headIdx - 1) > 0) &&
                (maxima.get(headIdx) / maxima.get(headIdx - 1) > headRatioBefore) &&
                // Head cao hơn right shoulder
                (maxima.get(headIdx) - maxima.get(headIdx + 1) > 0) &&
                (maxima.get(headIdx) / maxima.get(headIdx + 1) > headRatioAfter) &&
                // Neckline slope trong giới hạn
                (Math.abs(slmin) <= upperSlmin) &&
                // Neckline positions đúng thứ tự
                (xxmin.get(0) > xxmax.get(headIdx - 1)) &&
                (xxmin.get(1) < xxmax.get(headIdx + 1));
            
            if (isValidPattern) {
                // Tạo pattern với các indices và values
                List<Integer> indices = Arrays.asList(
                    xxmax.get(headIdx - 1),  // left shoulder
                    xxmin.get(0),             // left neckline
                    xxmax.get(headIdx),       // head
                    xxmin.get(1),             // right neckline
                    xxmax.get(headIdx + 1)    // right shoulder
                );
                
                List<Double> values = Arrays.asList(
                    maxima.get(headIdx - 1),
                    minima.get(0),
                    maxima.get(headIdx),
                    minima.get(1),
                    maxima.get(headIdx + 1)
                );
                
                HeadAndShouldersPattern pattern = HeadAndShouldersPattern.builder()
                    .candleIndex(candleIdx)
                    .patternIndices(indices)
                    .patternPoints(values)
                    .necklineSlope(slmin)
                    .lookback(lookback)
                    .patternType("head_and_shoulders")
                    .build();
                
                patterns.add(pattern);
            }
        }
        
        return patterns;
    }
    
    /**
     * Overload method với default parameters
     */
    public List<HeadAndShouldersPattern> findHeadAndShouldersPatterns(List<OhlcData> ohlcDataList) {
        return findHeadAndShouldersPatterns(ohlcDataList, 60, 10, 5, 1.0002, 1.0002, 1e-4);
    }
}
