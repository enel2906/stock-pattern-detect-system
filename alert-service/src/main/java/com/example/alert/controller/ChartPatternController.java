package com.example.alert.controller;

import com.example.alert.constant.ResponseCode;
import com.example.alert.domain.StockMarket;
import com.example.alert.model.chartpattern.ChartPatternResult;
import com.example.alert.model.chartpattern.DoublePattern;
import com.example.alert.model.chartpattern.FlagPattern;
import com.example.alert.response.Response;
import com.example.alert.service.StockMarketService;
import com.example.alert.service.chartpattern.ChartPatternDetectionService;
import lombok.AllArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller chuyên dụng cho Chart Pattern Analysis
 */
@RestController
@RequestMapping("/chart-patterns")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class ChartPatternController {
    
    private final StockMarketService stockMarketService;
    private final ChartPatternDetectionService chartPatternDetectionService;
    
    /**
     * Phân tích tất cả chart patterns cho một stock symbol
     * @param stockSymbol symbol của stock
     * @return Response chứa ChartPatternResult với tất cả patterns được tìm thấy
     */
    @GetMapping("/{stockSymbol}/analyze")
    public Response analyzeAllPatterns(@PathVariable String stockSymbol) {
        StockMarket stockMarket = stockMarketService.getStockBySymbol(stockSymbol);
        if (stockMarket == null || !StringUtils.hasText(stockMarket.getId())) {
            return new Response(ResponseCode.UNKNOWN_ERROR);
        }
        
        String stockId = stockMarket.getId();
        ChartPatternResult result = chartPatternDetectionService.analyzeAllPatterns(stockId);
        return new Response(result);
    }
    
    /**
     * Phân tích chỉ Flag patterns
     * @param stockSymbol symbol của stock
     * @return Response chứa danh sách Flag patterns
     */
    @GetMapping("/{stockSymbol}/flag")
    public Response analyzeFlagPatterns(@PathVariable String stockSymbol) {
        StockMarket stockMarket = stockMarketService.getStockBySymbol(stockSymbol);
        if (stockMarket == null || !StringUtils.hasText(stockMarket.getId())) {
            return new Response(ResponseCode.UNKNOWN_ERROR);
        }
        
        String stockId = stockMarket.getId();
        List<FlagPattern> flagPatterns = chartPatternDetectionService.analyzeFlagPatterns(stockId);
        return new Response(flagPatterns);
    }
    
    /**
     * Phân tích Flag patterns với custom parameters
     * @param stockSymbol symbol của stock
     * @param lookback số periods để look back (optional, default: 25)
     * @param minPoints số pivot points tối thiểu (optional, default: 3)
     * @param rMax R-squared threshold cho highs (optional, default: 0.9)
     * @param rMin R-squared threshold cho lows (optional, default: 0.9)
     * @return Response chứa danh sách Flag patterns
     */
    @GetMapping("/{stockSymbol}/flag/custom")
    public Response analyzeFlagPatternsCustom(@PathVariable String stockSymbol,
                                             @RequestParam(defaultValue = "25") int lookback,
                                             @RequestParam(defaultValue = "3") int minPoints,
                                             @RequestParam(defaultValue = "0.9") double rMax,
                                             @RequestParam(defaultValue = "0.9") double rMin) {
        StockMarket stockMarket = stockMarketService.getStockBySymbol(stockSymbol);
        if (stockMarket == null || !StringUtils.hasText(stockMarket.getId())) {
            return new Response(ResponseCode.UNKNOWN_ERROR);
        }
        
        String stockId = stockMarket.getId();
        List<FlagPattern> flagPatterns = chartPatternDetectionService.analyzeFlagPatternsCustom(
            stockId, lookback, minPoints, rMax, rMin);
        return new Response(flagPatterns);
    }
    
    /**
     * Phân tích Double patterns
     * @param stockSymbol symbol của stock
     * @param patternType loại pattern: "tops", "bottoms", "both" (optional, default: "both")
     * @return Response chứa danh sách Double patterns
     */
    @GetMapping("/{stockSymbol}/double")
    public Response analyzeDoublePatterns(@PathVariable String stockSymbol,
                                        @RequestParam(defaultValue = "both") String patternType) {
        StockMarket stockMarket = stockMarketService.getStockBySymbol(stockSymbol);
        if (stockMarket == null || !StringUtils.hasText(stockMarket.getId())) {
            return new Response(ResponseCode.UNKNOWN_ERROR);
        }
        
        String stockId = stockMarket.getId();
        List<DoublePattern> doublePatterns = chartPatternDetectionService.analyzeDoublePatterns(stockId, patternType);
        return new Response(doublePatterns);
    }
    
    /**
     * Phân tích chỉ Double Tops patterns
     * @param stockSymbol symbol của stock
     * @return Response chứa danh sách Double Tops patterns
     */
    @GetMapping("/{stockSymbol}/double-tops")
    public Response analyzeDoubleTopsPatterns(@PathVariable String stockSymbol) {
        return analyzeDoublePatterns(stockSymbol, "tops");
    }
    
    /**
     * Phân tích chỉ Double Bottoms patterns
     * @param stockSymbol symbol của stock
     * @return Response chứa danh sách Double Bottoms patterns
     */
    @GetMapping("/{stockSymbol}/double-bottoms")
    public Response analyzeDoubleBottomsPatterns(@PathVariable String stockSymbol) {
        return analyzeDoublePatterns(stockSymbol, "bottoms");
    }
}