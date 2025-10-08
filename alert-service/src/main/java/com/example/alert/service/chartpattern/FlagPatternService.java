package com.example.alert.service.chartpattern;

import com.example.alert.model.chartpattern.FlagPattern;
import com.example.alert.model.chartpattern.OhlcData;
import com.example.alert.util.chartpattern.LinearRegressionUtils;
import com.example.alert.util.chartpattern.PivotPointUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Service để phát hiện Flag pattern
 * Dựa trên thuật toán flag.py
 */
@Service
public class FlagPatternService {
    
    /**
     * Tìm Flag patterns trong dữ liệu OHLC
     * @param ohlcDataList danh sách dữ liệu OHLC
     * @param lookback số periods để look back (default: 25)
     * @param minPoints số pivot points tối thiểu (default: 3)
     * @param rMax R-squared fit cho high pivot points (default: 0.9)
     * @param rMin R-squared fit cho low pivot points (default: 0.9)
     * @param slopeMax slope cho high pivot points (default: 0)
     * @param slopeMin slope cho low pivot points (default: 0)
     * @param lowerRatioSlope lower limit cho ratio của slope min/max (default: 0.9)
     * @param upperRatioSlope upper limit cho ratio của slope min/max (default: 1.05)
     * @return danh sách Flag patterns được tìm thấy
     */
    public List<FlagPattern> findFlagPatterns(List<OhlcData> ohlcDataList, 
                                            int lookback, 
                                            int minPoints,
                                            double rMax, 
                                            double rMin, 
                                            double slopeMax, 
                                            double slopeMin,
                                            double lowerRatioSlope, 
                                            double upperRatioSlope) {
        
        List<FlagPattern> flagPatterns = new ArrayList<>();
        
        // Tìm pivot points
        List<OhlcData> dataWithPivots = PivotPointUtils.findAllPivotPoints(ohlcDataList, 2, 2);
        
        // Lặp qua từng candle để tìm flag pattern
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
            
            // Kiểm tra thứ tự pivot points (tăng dần cho minima, giảm dần cho maxima)
            if (!isOrderConditionMet(minima, maxima)) {
                continue;
            }
            
            // Chạy linear regression cho cả hai trendlines
            LinearRegressionUtils.RegressionResult minRegression = 
                LinearRegressionUtils.linregress(xxmin, minima);
            LinearRegressionUtils.RegressionResult maxRegression = 
                LinearRegressionUtils.linregress(xxmax, maxima);
            
            double slmin = minRegression.getSlope();
            double intercmin = minRegression.getIntercept();
            double rmin = Math.abs(minRegression.getRValue());
            
            double slmax = maxRegression.getSlope();
            double intercmax = maxRegression.getIntercept();
            double rmax = Math.abs(maxRegression.getRValue());
            
            // Kiểm tra điều kiện parallel lines và slopes
            if (rmax >= rMax && rmin >= rMin && 
                ((slmin > slopeMin && slmax > slopeMax) || 
                 (slmin < slopeMin && slmax < slopeMax))) {
                
                double slopeRatio = slmin / slmax;
                if (slopeRatio > lowerRatioSlope && slopeRatio < upperRatioSlope) {
                    
                    // Xác định hướng flag
                    String direction = (slmin > 0 && slmax > 0) ? "bullish" : "bearish";
                    
                    FlagPattern flagPattern = FlagPattern.builder()
                        .candleIndex(candleIdx)
                        .flagHighs(new ArrayList<>(maxima))
                        .flagLows(new ArrayList<>(minima))
                        .flagHighsIdx(new ArrayList<>(xxmax))
                        .flagLowsIdx(new ArrayList<>(xxmin))
                        .slopeMax(slmax)
                        .slopeMin(slmin)
                        .interceptMin(intercmin)
                        .interceptMax(intercmax)
                        .rSquaredMax(rmax)
                        .rSquaredMin(rmin)
                        .direction(direction)
                        .build();
                    
                    flagPatterns.add(flagPattern);
                }
            }
        }
        
        return flagPatterns;
    }
    
    /**
     * Overload method với default parameters
     */
    public List<FlagPattern> findFlagPatterns(List<OhlcData> ohlcDataList) {
        return findFlagPatterns(ohlcDataList, 25, 3, 0.9, 0.9, 0, 0, 0.9, 1.05);
    }
    
    /**
     * Kiểm tra điều kiện thứ tự của pivot points
     */
    private boolean isOrderConditionMet(List<Double> minima, List<Double> maxima) {
        // Kiểm tra minima không giảm (có thể giữ nguyên hoặc tăng)
        for (int i = 1; i < minima.size(); i++) {
            if (minima.get(i) < minima.get(i - 1)) {
                return false;
            }
        }
        
        // Kiểm tra maxima không giảm (có thể giữ nguyên hoặc tăng)
        for (int i = 1; i < maxima.size(); i++) {
            if (maxima.get(i) < maxima.get(i - 1)) {
                return false;
            }
        }
        
        return true;
    }
}