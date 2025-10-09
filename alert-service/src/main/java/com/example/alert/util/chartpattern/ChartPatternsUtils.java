package com.example.alert.util.chartpattern;

import com.example.alert.model.chartpattern.OhlcData;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Utility class cho các hàm xử lý chart patterns
 * Dựa trên charts_utils.py
 */
public class ChartPatternsUtils {
    
    /**
     * Data class để lưu kết quả của find_points
     */
    @Data
    @AllArgsConstructor
    public static class FindPointsResult {
        private List<Double> maxima;
        private List<Double> minima;
        private List<Integer> xxmax;
        private List<Integer> xxmin;
        private int maxacount; // maximas after head
        private int minacount; // minimas after head
        private int maxbcount; // maximas before head
        private int minbcount; // minimas before head
    }
    
    /**
     * Tìm các pivot points xung quanh một candle index
     * Tương đương với find_points trong Python
     * 
     * @param ohlcDataList danh sách OHLC data với pivot points
     * @param candleIdx index của candle quan tâm
     * @param lookback số lượng candles để look back
     * @return FindPointsResult chứa các arrays và counts
     */
    public static FindPointsResult findPoints(List<OhlcData> ohlcDataList, int candleIdx, int lookback) {
        List<Double> maxima = new ArrayList<>();
        List<Double> minima = new ArrayList<>();
        List<Integer> xxmin = new ArrayList<>();
        List<Integer> xxmax = new ArrayList<>();
        
        int minbcount = 0; // minimas before head
        int maxbcount = 0; // maximas before head
        int minacount = 0; // minimas after head
        int maxacount = 0; // maximas after head
        
        int halfLookback = lookback / 2;
        int idx = candleIdx - halfLookback;
        
        for (int i = idx - halfLookback; i < idx + halfLookback; i++) {
            if (i < 0 || i >= ohlcDataList.size()) {
                continue;
            }
            
            OhlcData data = ohlcDataList.get(i);
            
            // Kiểm tra pivot low (sử dụng short_pivot từ Python)
            // Trong implementation này, giả sử chúng ta đã set pivot trong OhlcData
            if (data.getPivot() == 1) {
                minima.add(data.getLow());
                xxmin.add(i);
                if (i < idx) {
                    minbcount++;
                } else if (i > idx) {
                    minacount++;
                }
            }
            
            // Kiểm tra pivot high
            if (data.getPivot() == 2) {
                maxima.add(data.getHigh());
                xxmax.add(i);
                if (i < idx) {
                    maxbcount++;
                } else if (i > idx) {
                    maxacount++;
                }
            }
        }
        
        return new FindPointsResult(maxima, minima, xxmax, xxmin, 
                                   maxacount, minacount, maxbcount, minbcount);
    }
    
    /**
     * Tìm index của giá trị max trong list
     */
    public static int argmax(List<Double> values) {
        if (values == null || values.isEmpty()) {
            return -1;
        }
        
        int maxIndex = 0;
        double maxValue = values.get(0);
        
        for (int i = 1; i < values.size(); i++) {
            if (values.get(i) > maxValue) {
                maxValue = values.get(i);
                maxIndex = i;
            }
        }
        
        return maxIndex;
    }
    
    /**
     * Tìm index của giá trị min trong list
     */
    public static int argmin(List<Double> values) {
        if (values == null || values.isEmpty()) {
            return -1;
        }
        
        int minIndex = 0;
        double minValue = values.get(0);
        
        for (int i = 1; i < values.size(); i++) {
            if (values.get(i) < minValue) {
                minValue = values.get(i);
                minIndex = i;
            }
        }
        
        return minIndex;
    }
}
