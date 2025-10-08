package com.example.alert.util.chartpattern;

import com.example.alert.model.chartpattern.OhlcData;
import java.util.ArrayList;
import java.util.List;

/**
 * Utility class để tìm pivot points trong dữ liệu OHLC
 * Dựa trên thuật toán pivot_points.py
 */
public class PivotPointUtils {
    
    /**
     * Tìm tất cả pivot points trong dữ liệu OHLC
     * @param ohlcData danh sách dữ liệu OHLC
     * @param leftLookback số candle nhìn về phía trước
     * @param rightLookback số candle nhìn về phía sau
     * @return danh sách OhlcData với pivot points được đánh dấu
     */
    public static List<OhlcData> findAllPivotPoints(List<OhlcData> ohlcData, 
                                                   int leftLookback, 
                                                   int rightLookback) {
        List<OhlcData> result = new ArrayList<>(ohlcData);
        
        for (int i = 0; i < result.size(); i++) {
            result.get(i).setPivot(0); // Khởi tạo không phải pivot
            result.get(i).setPivotPos(0.0);
        }
        
        // Tìm pivot highs và pivot lows
        for (int i = leftLookback; i < result.size() - rightLookback; i++) {
            // Kiểm tra pivot high
            if (isPivotHigh(result, i, leftLookback, rightLookback)) {
                result.get(i).setPivot(2); // 2 = pivot high
                result.get(i).setPivotPos(result.get(i).getHigh());
            }
            // Kiểm tra pivot low
            else if (isPivotLow(result, i, leftLookback, rightLookback)) {
                result.get(i).setPivot(1); // 1 = pivot low
                result.get(i).setPivotPos(result.get(i).getLow());
            }
        }
        
        return result;
    }
    
    /**
     * Kiểm tra xem một điểm có phải là pivot high không
     */
    private static boolean isPivotHigh(List<OhlcData> data, int index, 
                                      int leftLookback, int rightLookback) {
        double currentHigh = data.get(index).getHigh();
        
        // Kiểm tra tất cả các điểm bên trái
        for (int i = index - leftLookback; i < index; i++) {
            if (data.get(i).getHigh() >= currentHigh) {
                return false;
            }
        }
        
        // Kiểm tra tất cả các điểm bên phải
        for (int i = index + 1; i <= index + rightLookback; i++) {
            if (data.get(i).getHigh() >= currentHigh) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Kiểm tra xem một điểm có phải là pivot low không
     */
    private static boolean isPivotLow(List<OhlcData> data, int index, 
                                     int leftLookback, int rightLookback) {
        double currentLow = data.get(index).getLow();
        
        // Kiểm tra tất cả các điểm bên trái
        for (int i = index - leftLookback; i < index; i++) {
            if (data.get(i).getLow() <= currentLow) {
                return false;
            }
        }
        
        // Kiểm tra tất cả các điểm bên phải
        for (int i = index + 1; i <= index + rightLookback; i++) {
            if (data.get(i).getLow() <= currentLow) {
                return false;
            }
        }
        
        return true;
    }
}