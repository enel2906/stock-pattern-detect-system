package com.example.alert.controller;

import com.example.alert.constant.CandleNames;
import com.example.alert.constant.ResponseCode;
import com.example.alert.domain.CandleStick;
import com.example.alert.domain.StockMarket;
import com.example.alert.model.CupWithHandle;
import com.example.alert.model.chartpattern.ChartPatternResult;
import com.example.alert.response.Response;
import com.example.alert.service.CandleStickService;
import com.example.alert.service.ComplexPatternDetectorService;
import com.example.alert.service.DetectCandlePatternService;
import com.example.alert.service.StockMarketService;
import com.example.alert.service.chartpattern.ChartPatternDetectionService;
import com.example.alert.util.Indicator;
import lombok.AllArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/alert/candle-stick")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class AlterController {
    private StockMarketService stockMarketService;
    private DetectCandlePatternService detectCandlePatternService;
    private CandleStickService candleStickService;
    private ComplexPatternDetectorService complexPatternDetectorService;
    private ChartPatternDetectionService chartPatternDetectionService;

    @GetMapping("{stockSymbol}")
        public Response alterCandleStick(@PathVariable String stockSymbol,
                                     @RequestParam String candlePattern) {
        StockMarket stockMarket = stockMarketService.getStockBySymbol(stockSymbol);
        if (stockMarket == null || !StringUtils.hasText(stockMarket.getId())) {
            return new Response(ResponseCode.UNKNOWN_ERROR);
        }

        String stockId = stockMarket.getId();
        return switch (candlePattern) {
            // One candle patterns
            case CandleNames.HAMMER -> new Response(detectCandlePatternService.getHammerCandles(stockId));
            case CandleNames.LONG_LEGGED_DOJI -> new Response(detectCandlePatternService.getLongLeggedDoji(stockId));
            case CandleNames.GRAVESTONE_DOJI -> new Response(detectCandlePatternService.getGravestoneDoji(stockId));
            case CandleNames.DRAGONFLY_DOJI -> new Response(detectCandlePatternService.getDragonflyDoji(stockId));
            case CandleNames.INVERTED_HAMMER ->
                    new Response(detectCandlePatternService.getInvertedHammerCandles(stockId));
            case CandleNames.HANGING_MAN -> new Response(detectCandlePatternService.getHangingManCandles(stockId));
            case CandleNames.SHOOTING_STAR -> new Response(detectCandlePatternService.getShootingStarCandles(stockId));
            case CandleNames.BEARISH_MARUBOZU ->
                    new Response(detectCandlePatternService.getBearishMarubozuPatterns(stockId));
            case CandleNames.BULLISH_MARUBOZU ->
                    new Response(detectCandlePatternService.getBullishMarubozuPatterns(stockId));
            case CandleNames.BEARISH_BELT_HOLD -> new Response(detectCandlePatternService.getBearishBeltHold(stockId));
            case CandleNames.BULLISH_BELT_HOLD -> new Response(detectCandlePatternService.getBullishBeltHold(stockId));

            // Two candle patterns
            case CandleNames.BULLISH_ENGULFING ->
                    new Response(detectCandlePatternService.getBullishEngulfingPatterns(stockId));
            case CandleNames.BEARISH_ENGULFING ->
                    new Response(detectCandlePatternService.getBearishEngulfingPatterns(stockId));
            case CandleNames.BEARISH_KICKER ->
                    new Response(detectCandlePatternService.getBearishKickerPatterns(stockId));
            case CandleNames.BULLISH_KICKER ->
                    new Response(detectCandlePatternService.getBullishKickerPatterns(stockId));
            case CandleNames.PIERCING_LINE -> new Response(detectCandlePatternService.getPiercingLinePatterns(stockId));
            case CandleNames.TWEEZER_BOTTOM ->
                    new Response(detectCandlePatternService.getTweezerBottomPatterns(stockId));
            case CandleNames.TWEEZER_TOP -> new Response(detectCandlePatternService.getTweezerTopPatterns(stockId));
            case CandleNames.HARAMI -> new Response(detectCandlePatternService.getHaramiPatterns(stockId));
            case CandleNames.DARK_CLOUD_COVER ->
                    new Response(detectCandlePatternService.getDarkCloudCoverPatterns(stockId));
            case CandleNames.MATCHING_LOW ->
                    new Response(detectCandlePatternService.getMatchingLowPatterns(stockId));
            case CandleNames.MATCHING_HIGH ->
                    new Response(detectCandlePatternService.getMatchingHighPatterns(stockId));
            case CandleNames.THRUSTING -> new Response(detectCandlePatternService.getThrustingPatterns(stockId));
            case CandleNames.BEARISH_HARAMI_CROSS
                    -> new Response(detectCandlePatternService.getBearishHaramiCrossPatterns(stockId));
            case CandleNames.BULLISH_HARAMI_CROSS
                    -> new Response(detectCandlePatternService.getBullishHaramiCrossPatterns(stockId));
            case CandleNames.BEARISH_COUNTERATTACK
                    -> new Response(detectCandlePatternService.getBearishCounterattackPatterns(stockId));
            case CandleNames.BULLISH_COUNTERATTACK
                    -> new Response(detectCandlePatternService.getBullishCounterattackPatterns(stockId));

            // Three candle patterns
            case CandleNames.THREE_WHITE_SOLDIERS ->
                    new Response(detectCandlePatternService.getThreeWhiteSoldiers(stockId));
            case CandleNames.THREE_BLACK_CROWS -> new Response(detectCandlePatternService.getThreeBlackCrows(stockId));
            case CandleNames.EVENING_STAR -> new Response(detectCandlePatternService.getEveningStarPatterns(stockId));
            case CandleNames.MORNING_STAR -> new Response(detectCandlePatternService.getMorningStarPatterns(stockId));
            case CandleNames.THREE_OUTSIDE_UP ->
                    new Response(detectCandlePatternService.getThreeOutsideUpPatterns(stockId));
            case CandleNames.THREE_INSIDE_UP ->
                    new Response(detectCandlePatternService.getThreeInsideUpPatterns(stockId));
            case CandleNames.BEARISH_ABANDONED_BABY ->
                    new Response(detectCandlePatternService.getBearishAbandonedBabyPatterns(stockId));
            case CandleNames.DOWNSIDE_TASUKI_GAP ->
                    new Response(detectCandlePatternService.getDownsideTasukiGapPatterns(stockId));
            case CandleNames.UPSIDE_TASUKI_GAP ->
                    new Response(detectCandlePatternService.getUpsideTasukiGapPatterns(stockId));
            case CandleNames.EVENING_STAR_DOJI ->
                    new Response(detectCandlePatternService.getEveningStarDojiPatterns(stockId));
            case CandleNames.MORNING_STAR_DOJI ->
                    new Response(detectCandlePatternService.getMorningStarDojiPatterns(stockId));
            case CandleNames.BEARISH_TRI_STAR ->
                    new Response(detectCandlePatternService.getBearishTriStarPatterns(stockId));
            case CandleNames.BULLISH_TRI_STAR ->
                    new Response(detectCandlePatternService.getBullishTriStarPatterns(stockId));
            case CandleNames.UPSIDE_GAP_TWO_CROWS ->
                    new Response(detectCandlePatternService.getUpsideGapTwoCrowsPatterns(stockId));
            case CandleNames.THREE_STAR_IN_THE_SOUTH ->
                    new Response(detectCandlePatternService.getThreeStarsInTheSouthPatterns(stockId));
            case CandleNames.DESCENDING_HAWK
                    -> new Response(detectCandlePatternService.getDescendingHawkPatterns(stockId));
            case CandleNames.ADVANCE_BLOCK -> new Response(detectCandlePatternService.getAdvanceBlockPatterns(stockId));
            case CandleNames.DELIBERATION -> new Response(detectCandlePatternService.getDeliberationPatterns(stockId));

            // Many candle patterns
            case CandleNames.FALLING_THREE -> new Response(detectCandlePatternService.getFallingThreePatterns(stockId));
            case CandleNames.RISING_THREE -> new Response(detectCandlePatternService.getRisingThreePatterns(stockId));
            case CandleNames.BEARISH_THREE_LINE_STRIKE
                    -> new Response(detectCandlePatternService.getBearishThreeLineStrikePatterns(stockId));
            case CandleNames.BULLISH_THREE_LINE_STRIKE ->
                    new Response(detectCandlePatternService.getBullishThreeLineStrikePatterns(stockId));
            case CandleNames.LADDER_TOP -> new Response(detectCandlePatternService.getLadderTopPatterns(stockId));

            //Complex candle patterns
            case CandleNames.CUP_WITH_HANDLE -> {
                List<CandleStick> candleSticks = candleStickService.getCandlesByStockId(stockId);
                List<Double> smaValues = Indicator.calculateSMA(candleSticks, 20);
                CupWithHandle cupWithHandle = complexPatternDetectorService.getNearestCupWithHandle(smaValues);
                yield new Response(cupWithHandle);
            }
            
            // Chart patterns
            case CandleNames.FLAG_PATTERN -> 
                new Response(chartPatternDetectionService.analyzeFlagPatterns(stockId));
            case CandleNames.DOUBLE_TOPS -> 
                new Response(chartPatternDetectionService.analyzeDoublePatterns(stockId, "tops"));
            case CandleNames.DOUBLE_BOTTOMS -> 
                new Response(chartPatternDetectionService.analyzeDoublePatterns(stockId, "bottoms"));
            case CandleNames.DOUBLE_PATTERN -> 
                new Response(chartPatternDetectionService.analyzeDoublePatterns(stockId, "both"));
            case CandleNames.HEAD_AND_SHOULDERS -> 
                new Response(chartPatternDetectionService.analyzeHeadAndShouldersPatterns(stockId));
            case CandleNames.INVERSE_HEAD_AND_SHOULDERS -> 
                new Response(chartPatternDetectionService.analyzeInverseHeadAndShouldersPatterns(stockId));
            case CandleNames.PENNANT -> 
                new Response(chartPatternDetectionService.analyzePennantPatterns(stockId));
            case CandleNames.TRIANGLE_ASCENDING -> 
                new Response(chartPatternDetectionService.analyzeTrianglePatterns(stockId, "ascending"));
            case CandleNames.TRIANGLE_DESCENDING -> 
                new Response(chartPatternDetectionService.analyzeTrianglePatterns(stockId, "descending"));
            case CandleNames.TRIANGLE_SYMMETRICAL -> 
                new Response(chartPatternDetectionService.analyzeTrianglePatterns(stockId, "symmetrical"));
            case CandleNames.TRIANGLE_PATTERN -> 
                new Response(chartPatternDetectionService.analyzeTrianglePatterns(stockId, "all"));

            // Default case for unknown patterns
            default -> new Response(ResponseCode.UNKNOWN_ERROR);
        };
    }
    
    /**
     * Endpoint để phân tích tất cả chart patterns cho một stock symbol
     * @param stockSymbol symbol của stock
     * @return Response chứa ChartPatternResult với tất cả patterns được tìm thấy
     */
    @GetMapping("{stockSymbol}/all-patterns")
    public Response analyzeAllChartPatterns(@PathVariable String stockSymbol) {
        StockMarket stockMarket = stockMarketService.getStockBySymbol(stockSymbol);
        if (stockMarket == null || !StringUtils.hasText(stockMarket.getId())) {
            return new Response(ResponseCode.UNKNOWN_ERROR);
        }
        
        String stockId = stockMarket.getId();
        ChartPatternResult result = chartPatternDetectionService.analyzeAllPatterns(stockId);
        return new Response(result);
    }
    
    /**
     * Endpoint để phân tích Flag patterns với custom parameters
     * @param stockSymbol symbol của stock
     * @param lookback số periods để look back (optional, default: 25)
     * @param minPoints số pivot points tối thiểu (optional, default: 3)
     * @param rMax R-squared threshold cho highs (optional, default: 0.9)
     * @param rMin R-squared threshold cho lows (optional, default: 0.9)
     * @return Response chứa danh sách Flag patterns
     */
    @GetMapping("{stockSymbol}/flag-custom")
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
        return new Response(chartPatternDetectionService.analyzeFlagPatternsCustom(
            stockId, lookback, minPoints, rMax, rMin));
    }
    
    /**
     * Endpoint để phân tích Head and Shoulders patterns với custom parameters
     * @param stockSymbol symbol của stock
     * @param lookback số periods để look back (optional, default: 60)
     * @param pivotInterval số candles để xác định pivot point (optional, default: 10)
     * @param headRatioBefore tỷ lệ giữa head và shoulder trái (optional, default: 1.0002)
     * @param headRatioAfter tỷ lệ giữa head và shoulder phải (optional, default: 1.0002)
     * @return Response chứa danh sách Head and Shoulders patterns
     */
    @GetMapping("{stockSymbol}/head-shoulders-custom")
    public Response analyzeHeadAndShouldersCustom(@PathVariable String stockSymbol,
                                                  @RequestParam(defaultValue = "60") int lookback,
                                                  @RequestParam(defaultValue = "10") int pivotInterval,
                                                  @RequestParam(defaultValue = "1.0002") double headRatioBefore,
                                                  @RequestParam(defaultValue = "1.0002") double headRatioAfter) {
        StockMarket stockMarket = stockMarketService.getStockBySymbol(stockSymbol);
        if (stockMarket == null || !StringUtils.hasText(stockMarket.getId())) {
            return new Response(ResponseCode.UNKNOWN_ERROR);
        }
        
        String stockId = stockMarket.getId();
        return new Response(chartPatternDetectionService.analyzeHeadAndShouldersCustom(
            stockId, lookback, pivotInterval, headRatioBefore, headRatioAfter));
    }
    
    /**
     * Endpoint để phân tích Inverse Head and Shoulders patterns với custom parameters
     * @param stockSymbol symbol của stock
     * @param lookback số periods để look back (optional, default: 60)
     * @param pivotInterval số candles để xác định pivot point (optional, default: 10)
     * @param headRatioBefore tỷ lệ giữa head và shoulder trái (optional, default: 0.98)
     * @param headRatioAfter tỷ lệ giữa head và shoulder phải (optional, default: 0.98)
     * @return Response chứa danh sách Inverse Head and Shoulders patterns
     */
    @GetMapping("{stockSymbol}/inverse-head-shoulders-custom")
    public Response analyzeInverseHeadAndShouldersCustom(@PathVariable String stockSymbol,
                                                         @RequestParam(defaultValue = "60") int lookback,
                                                         @RequestParam(defaultValue = "10") int pivotInterval,
                                                         @RequestParam(defaultValue = "0.98") double headRatioBefore,
                                                         @RequestParam(defaultValue = "0.98") double headRatioAfter) {
        StockMarket stockMarket = stockMarketService.getStockBySymbol(stockSymbol);
        if (stockMarket == null || !StringUtils.hasText(stockMarket.getId())) {
            return new Response(ResponseCode.UNKNOWN_ERROR);
        }
        
        String stockId = stockMarket.getId();
        return new Response(chartPatternDetectionService.analyzeInverseHeadAndShouldersCustom(
            stockId, lookback, pivotInterval, headRatioBefore, headRatioAfter));
    }
    
    /**
     * Endpoint để phân tích Pennant patterns với custom parameters
     * @param stockSymbol symbol của stock
     * @param lookback số periods để look back (optional, default: 20)
     * @param minPoints số pivot points tối thiểu (optional, default: 3)
     * @param rMax R-squared threshold cho highs (optional, default: 0.9)
     * @param rMin R-squared threshold cho lows (optional, default: 0.9)
     * @return Response chứa danh sách Pennant patterns
     */
    @GetMapping("{stockSymbol}/pennant-custom")
    public Response analyzePennantPatternsCustom(@PathVariable String stockSymbol,
                                                 @RequestParam(defaultValue = "20") int lookback,
                                                 @RequestParam(defaultValue = "3") int minPoints,
                                                 @RequestParam(defaultValue = "0.9") double rMax,
                                                 @RequestParam(defaultValue = "0.9") double rMin) {
        StockMarket stockMarket = stockMarketService.getStockBySymbol(stockSymbol);
        if (stockMarket == null || !StringUtils.hasText(stockMarket.getId())) {
            return new Response(ResponseCode.UNKNOWN_ERROR);
        }
        
        String stockId = stockMarket.getId();
        return new Response(chartPatternDetectionService.analyzePennantPatternsCustom(
            stockId, lookback, minPoints, rMax, rMin));
    }
    
    /**
     * Endpoint để phân tích Triangle patterns với custom parameters
     * @param stockSymbol symbol của stock
     * @param triangleType loại triangle: "ascending", "descending", "symmetrical", "all" (optional, default: "all")
     * @param lookback số periods để look back (optional, default: 25)
     * @param minPoints số pivot points tối thiểu (optional, default: 3)
     * @param rlimit R-squared threshold (optional, default: 0.9)
     * @return Response chứa danh sách Triangle patterns
     */
    @GetMapping("{stockSymbol}/triangle-custom")
    public Response analyzeTrianglePatternsCustom(@PathVariable String stockSymbol,
                                                  @RequestParam(defaultValue = "all") String triangleType,
                                                  @RequestParam(defaultValue = "25") int lookback,
                                                  @RequestParam(defaultValue = "3") int minPoints,
                                                  @RequestParam(defaultValue = "0.9") double rlimit) {
        StockMarket stockMarket = stockMarketService.getStockBySymbol(stockSymbol);
        if (stockMarket == null || !StringUtils.hasText(stockMarket.getId())) {
            return new Response(ResponseCode.UNKNOWN_ERROR);
        }
        
        String stockId = stockMarket.getId();
        return new Response(chartPatternDetectionService.analyzeTrianglePatternsCustom(
            stockId, triangleType, lookback, minPoints, rlimit));
    }
}

