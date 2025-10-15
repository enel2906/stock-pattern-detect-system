package com.example.alert.service.chartpattern;

import com.example.alert.model.chartpattern.OhlcData;
import com.example.alert.model.chartpattern.PennantPattern;
import com.example.alert.util.chartpattern.LinearRegressionUtils;
import com.example.alert.util.chartpattern.PivotPointUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Service để phát hiện Pennant pattern
 * Dựa trên thuật toán pennant.py
 */
@Service
public class PennantService {
    
    /**
     * Tìm Pennant patterns trong dữ liệu OHLC
     * 
     * @param ohlcDataList danh sách dữ liệu OHLC
     * @param lookback số periods để look back (default: 20)
     * @param minPoints số pivot points tối thiểu (default: 3)
     * @param rMax R-squared fit cho high pivot points (default: 0.9)
     * @param rMin R-squared fit cho low pivot points (default: 0.9)
     * @param slopeMax slope cho high pivot points (default: -0.0001)
     * @param slopeMin slope cho low pivot points (default: 0.0001)
     * @param lowerRatioSlope lower limit cho ratio của slope min/max (default: 0.95)
     * @param upperRatioSlope upper limit cho ratio của slope min/max (default: 1.0)
     * @return danh sách Pennant patterns được tìm thấy
     */
    public List<PennantPattern> findPennantPatterns(
            List<OhlcData> ohlcDataList,
            int lookback,
            int minPoints,
            double rMax,
            double rMin,
            double slopeMax,
            double slopeMin,
            double lowerRatioSlope,
            double upperRatioSlope) {
        
        List<PennantPattern> patterns = new ArrayList<>();
        
        // Tìm pivot points
        List<OhlcData> dataWithPivots = PivotPointUtils.findAllPivotPoints(ohlcDataList, 2, 2);
        
        // Lặp qua từng candle để tìm pennant pattern
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
            
            // Chạy linear regression cho cả hai trendlines
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
            
            // Kiểm tra điều kiện pennant: converging lines
            // slmin phải dương (tăng), slmax phải âm (giảm)
            // và tỷ lệ giữa chúng phải trong khoảng cho phép
            if (rmax >= rMax && rmin >= rMin && 
                slmin >= slopeMin && slmax <= slopeMax) {
                
                double slopeRatio = Math.abs(slmax / slmin);
                if (slopeRatio > lowerRatioSlope && slopeRatio < upperRatioSlope) {
                    
                    PennantPattern pattern = PennantPattern.builder()
                        .candleIndex(candleIdx)
                        .pennantHighs(new ArrayList<>(maxima))
                        .pennantLows(new ArrayList<>(minima))
                        .pennantHighsIdx(new ArrayList<>(xxmax))
                        .pennantLowsIdx(new ArrayList<>(xxmin))
                        .slopeMax(slmax)
                        .slopeMin(slmin)
                        .interceptMin(intercmin)
                        .interceptMax(intercmax)
                        .rSquaredMax(rmax)
                        .rSquaredMin(rmin)
                        .patternType("pennant")
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
    public List<PennantPattern> findPennantPatterns(List<OhlcData> ohlcDataList) {
        return findPennantPatterns(ohlcDataList, 20, 3, 0.9, 0.9, -0.0001, 0.0001, 0.95, 1.0);
    }
}
