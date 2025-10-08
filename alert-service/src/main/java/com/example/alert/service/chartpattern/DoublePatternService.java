package com.example.alert.service.chartpattern;

import com.example.alert.model.chartpattern.DoublePattern;
import com.example.alert.model.chartpattern.OhlcData;
import com.example.alert.util.chartpattern.PivotPointUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Service để phát hiện Double patterns (Double Tops và Double Bottoms)
 * Dựa trên thuật toán doubles.py
 */
@Service
public class DoublePatternService {
    
    /**
     * Tìm Double patterns trong dữ liệu OHLC
     * @param ohlcDataList danh sách dữ liệu OHLC
     * @param lookback số periods để look back (default: 25)
     * @param doubleType loại pattern cần tìm: "tops", "bottoms", "both"
     * @param topsMaxRatio tỷ lệ max giữa peak points trong tops pattern (default: 1.01)
     * @param bottomsMinRatio tỷ lệ min giữa trough points trong bottoms pattern (default: 0.98)
     * @return danh sách Double patterns được tìm thấy
     */
    public List<DoublePattern> findDoublePatterns(List<OhlcData> ohlcDataList,
                                                int lookback,
                                                String doubleType,
                                                double topsMaxRatio,
                                                double bottomsMinRatio) {
        
        List<DoublePattern> doublePatterns = new ArrayList<>();
        
        // Tìm pivot points
        List<OhlcData> dataWithPivots = PivotPointUtils.findAllPivotPoints(ohlcDataList, 2, 2);
        
        // Lặp qua từng candle để tìm double pattern
        for (int candleIdx = lookback; candleIdx < dataWithPivots.size(); candleIdx++) {
            
            // Lấy sub-data trong lookback window
            List<OhlcData> subOhlc = new ArrayList<>();
            List<Integer> pivotIndices = new ArrayList<>();
            
            for (int i = candleIdx - lookback; i <= candleIdx; i++) {
                subOhlc.add(dataWithPivots.get(i));
                if (dataWithPivots.get(i).getPivot() != 0) {
                    pivotIndices.add(i);
                }
            }
            
            // Phải có đúng 5 pivot points
            if (pivotIndices.size() != 5) {
                continue;
            }
            
            // Lấy giá trị tại các pivot points
            List<Double> pivots = new ArrayList<>();
            for (int idx : pivotIndices) {
                pivots.add(dataWithPivots.get(idx).getPivotPos());
            }
            
            // Tìm Double Tops
            if ("tops".equals(doubleType) || "both".equals(doubleType)) {
                if (isDoubleTopsPattern(pivots, topsMaxRatio)) {
                    DoublePattern pattern = DoublePattern.builder()
                        .candleIndex(candleIdx)
                        .doubleType("tops")
                        .pivotIndices(new ArrayList<>(pivotIndices))
                        .pivotPoints(new ArrayList<>(pivots))
                        .ratio(pivots.get(1) / pivots.get(3))
                        .build();
                    
                    doublePatterns.add(pattern);
                }
            }
            
            // Tìm Double Bottoms
            if ("bottoms".equals(doubleType) || "both".equals(doubleType)) {
                if (isDoubleBottomsPattern(pivots, bottomsMinRatio)) {
                    DoublePattern pattern = DoublePattern.builder()
                        .candleIndex(candleIdx)
                        .doubleType("bottoms")
                        .pivotIndices(new ArrayList<>(pivotIndices))
                        .pivotPoints(new ArrayList<>(pivots))
                        .ratio(pivots.get(1) / pivots.get(3))
                        .build();
                    
                    doublePatterns.add(pattern);
                }
            }
        }
        
        return doublePatterns;
    }
    
    /**
     * Overload method với default parameters
     */
    public List<DoublePattern> findDoublePatterns(List<OhlcData> ohlcDataList) {
        return findDoublePatterns(ohlcDataList, 25, "both", 1.01, 0.98);
    }
    
    /**
     * Kiểm tra pattern Double Tops
     * Điều kiện: pivots[0] < pivots[1] && pivots[0] < pivots[3] && 
     *           pivots[2] < pivots[1] && pivots[2] < pivots[3] && 
     *           pivots[4] < pivots[1] && pivots[4] < pivots[3] && 
     *           pivots[1] > pivots[3] && pivots[1]/pivots[3] <= topsMaxRatio
     */
    private boolean isDoubleTopsPattern(List<Double> pivots, double topsMaxRatio) {
        return (pivots.get(0) < pivots.get(1)) && 
               (pivots.get(0) < pivots.get(3)) && 
               (pivots.get(2) < pivots.get(1)) && 
               (pivots.get(2) < pivots.get(3)) && 
               (pivots.get(4) < pivots.get(1)) && 
               (pivots.get(4) < pivots.get(3)) && 
               (pivots.get(1) > pivots.get(3)) && 
               (pivots.get(1) / pivots.get(3) <= topsMaxRatio);
    }
    
    /**
     * Kiểm tra pattern Double Bottoms
     * Điều kiện: pivots[0] > pivots[1] && pivots[0] > pivots[3] && 
     *           pivots[2] > pivots[1] && pivots[2] > pivots[3] && 
     *           pivots[4] > pivots[1] && pivots[4] > pivots[3] && 
     *           pivots[1] < pivots[3] && pivots[1]/pivots[3] >= bottomsMinRatio
     */
    private boolean isDoubleBottomsPattern(List<Double> pivots, double bottomsMinRatio) {
        return (pivots.get(0) > pivots.get(1)) && 
               (pivots.get(0) > pivots.get(3)) && 
               (pivots.get(2) > pivots.get(1)) && 
               (pivots.get(2) > pivots.get(3)) && 
               (pivots.get(4) > pivots.get(1)) && 
               (pivots.get(4) > pivots.get(3)) && 
               (pivots.get(1) < pivots.get(3)) && 
               (pivots.get(1) / pivots.get(3) >= bottomsMinRatio);
    }
}