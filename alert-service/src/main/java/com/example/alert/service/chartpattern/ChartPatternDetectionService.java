package com.example.alert.service.chartpattern;

import com.example.alert.domain.CandleStick;
import com.example.alert.model.chartpattern.*;
import com.example.alert.service.CandleStickService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Service chính để phát hiện các chart patterns
 * Orchestrates các pattern detection services khác
 */
@Service
@AllArgsConstructor
public class ChartPatternDetectionService {
    
    private final CandleStickService candleStickService;
    private final FlagPatternService flagPatternService;
    private final DoublePatternService doublePatternService;
    
    /**
     * Phân tích tất cả chart patterns cho một stock symbol
     * @param stockId ID của stock
     * @return ChartPatternResult chứa tất cả patterns được tìm thấy
     */
    public ChartPatternResult analyzeAllPatterns(String stockId) {
        // Lấy dữ liệu candle sticks
        List<CandleStick> candleSticks = candleStickService.getCandlesByStockId(stockId);
        
        if (candleSticks == null || candleSticks.isEmpty()) {
            return ChartPatternResult.builder()
                .stockSymbol("UNKNOWN")
                .analysisTime(System.currentTimeMillis())
                .flagPatterns(new ArrayList<>())
                .doublePatterns(new ArrayList<>())
                .totalPatternsFound(0)
                .build();
        }
        
        // Convert sang OhlcData
        List<OhlcData> ohlcDataList = convertToOhlcData(candleSticks);
        
        // Phát hiện các patterns
        List<FlagPattern> flagPatterns = flagPatternService.findFlagPatterns(ohlcDataList);
        List<DoublePattern> doublePatterns = doublePatternService.findDoublePatterns(ohlcDataList);
        
        int totalPatterns = flagPatterns.size() + doublePatterns.size();
        
        return ChartPatternResult.builder()
            .stockSymbol(stockId)
            .analysisTime(System.currentTimeMillis())
            .flagPatterns(flagPatterns)
            .doublePatterns(doublePatterns)
            .totalPatternsFound(totalPatterns)
            .build();
    }
    
    /**
     * Phân tích chỉ Flag patterns
     * @param stockId ID của stock
     * @return danh sách Flag patterns
     */
    public List<FlagPattern> analyzeFlagPatterns(String stockId) {
        List<CandleStick> candleSticks = candleStickService.getCandlesByStockId(stockId);
        if (candleSticks == null || candleSticks.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<OhlcData> ohlcDataList = convertToOhlcData(candleSticks);
        return flagPatternService.findFlagPatterns(ohlcDataList);
    }
    
    /**
     * Phân tích chỉ Double patterns
     * @param stockId ID của stock
     * @param patternType "tops", "bottoms", hoặc "both"
     * @return danh sách Double patterns
     */
    public List<DoublePattern> analyzeDoublePatterns(String stockId, String patternType) {
        List<CandleStick> candleSticks = candleStickService.getCandlesByStockId(stockId);
        if (candleSticks == null || candleSticks.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<OhlcData> ohlcDataList = convertToOhlcData(candleSticks);
        return doublePatternService.findDoublePatterns(ohlcDataList, 25, patternType, 1.01, 0.98);
    }
    
    /**
     * Phân tích Flag patterns với custom parameters
     * @param stockId ID của stock
     * @param lookback số periods để look back
     * @param minPoints số pivot points tối thiểu
     * @param rMax R-squared threshold cho highs
     * @param rMin R-squared threshold cho lows
     * @return danh sách Flag patterns
     */
    public List<FlagPattern> analyzeFlagPatternsCustom(String stockId, 
                                                     int lookback, 
                                                     int minPoints,
                                                     double rMax, 
                                                     double rMin) {
        List<CandleStick> candleSticks = candleStickService.getCandlesByStockId(stockId);
        if (candleSticks == null || candleSticks.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<OhlcData> ohlcDataList = convertToOhlcData(candleSticks);
        return flagPatternService.findFlagPatterns(ohlcDataList, lookback, minPoints, 
                                                 rMax, rMin, 0, 0, 0.9, 1.05);
    }
    
    /**
     * Convert từ CandleStick sang OhlcData
     * @param candleSticks danh sách CandleStick
     * @return danh sách OhlcData
     */
    private List<OhlcData> convertToOhlcData(List<CandleStick> candleSticks) {
        List<OhlcData> ohlcDataList = new ArrayList<>();
        
        for (int i = 0; i < candleSticks.size(); i++) {
            CandleStick candle = candleSticks.get(i);
            
            OhlcData ohlcData = OhlcData.builder()
                .open(candle.getOpen())
                .high(candle.getHigh())
                .low(candle.getLow())
                .close(candle.getClose())
                .volume(candle.getVolume())
                .date(candle.getDate())
                .index(i)
                .pivot(0) // sẽ được set trong pivot point detection
                .pivotPos(0.0)
                .chartType("")
                .patternData(new ArrayList<>())
                .patternIndices(new ArrayList<>())
                .build();
                
            ohlcDataList.add(ohlcData);
        }
        
        return ohlcDataList;
    }
}