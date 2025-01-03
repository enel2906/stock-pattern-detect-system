package com.example.alert.controller;

import com.example.alert.constant.CandleNames;
import com.example.alert.constant.ResponseCode;
import com.example.alert.domain.CandleStick;
import com.example.alert.domain.StockMarket;
import com.example.alert.model.CupWithHandle;
import com.example.alert.response.Response;
import com.example.alert.service.CandleStickService;
import com.example.alert.service.ComplexPatternDetectorService;
import com.example.alert.service.DetectCandlePatternService;
import com.example.alert.service.StockMarketService;
import com.example.alert.util.Indicator;
import lombok.AllArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/alter/candle-stick")
@AllArgsConstructor
public class AlterController {
    private StockMarketService stockMarketService;
    private DetectCandlePatternService detectCandlePatternService;
    private CandleStickService candleStickService;
    private ComplexPatternDetectorService complexPatternDetectorService;

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

            // Default case for unknown patterns
            default -> new Response(ResponseCode.UNKNOWN_ERROR);
        };
    }
}

