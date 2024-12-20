package com.example.alert.service;

import com.example.alert.domain.CandleStick;

import java.util.List;

public interface DetectCandlePatternService {
    //One candle patterns
    List<CandleStick> getHammerCandles(String stockId);
    List<CandleStick> getDojiCandles(String stockId);
    List<CandleStick> getInvertedHammerCandles(String stockId);
    List<CandleStick> getHangingManCandles(String stockId);
    List<CandleStick> getShootingStarCandles(String stockId);
    List<CandleStick> getBearishMarubozuPatterns(String stockId);
    List<CandleStick> getBullishMarubozuPatterns(String stockId);

    //Two candle patterns
    List<List<CandleStick>> getBullishEngulfingPatterns(String stockId);
    List<List<CandleStick>> getBearishEngulfingPatterns(String stockId);
    List<List<CandleStick>> getBearishKickerPatterns(String stockId);
    List<List<CandleStick>> getBullishKickerPatterns(String stockId);
    List<List<CandleStick>> getPiercingLinePatterns(String stockId);
    List<List<CandleStick>> getTweezerBottomPatterns(String stockId);
    List<List<CandleStick>> getTweezerTopPatterns(String stockId);
    List<List<CandleStick>> getHaramiPatterns(String stockId);
    List<List<CandleStick>> getDarkCloudCoverPatterns(String stockId);
    List<List<CandleStick>> getMatchingLowPatterns(String stockId);
    List<List<CandleStick>> getMatchingHighPatterns(String stockId);

    //Three candle patterns
    List<List<CandleStick>> getThreeWhiteSoldiers(String stockId);
    List<List<CandleStick>> getThreeBlackCrows(String stockId);
    List<List<CandleStick>> getEveningStarPatterns(String stockId);
    List<List<CandleStick>> getMorningStarPatterns(String stockId);
    List<List<CandleStick>> getThreeOutsideUpPatterns(String stockId);
    List<List<CandleStick>> getThreeInsideUpPatterns(String stockId);
    List<List<CandleStick>> getBearishAbandonedBabyPatterns(String stockId);
    List<List<CandleStick>> getDownsideTasukiGapPatterns(String stockId);
    List<List<CandleStick>> getUpsideTasukiGapPatterns(String stockId);
    List<List<CandleStick>> getEveningStarDojiPatterns(String stockId);
    List<List<CandleStick>> getMorningStarDojiPatterns(String stockId);
    List<List<CandleStick>> getBearishTriStarPatterns(String stockId);
    List<List<CandleStick>> getBullishTriStarPatterns(String stockId);

    //Many candle patterns
    List<List<CandleStick>> getFallingThreePatterns(String stockId);
    List<List<CandleStick>> getRisingThreePatterns(String stockId);
    List<List<CandleStick>> getBullishThreeLineStrikePatterns(String stockId);
    List<List<CandleStick>> getBearishThreeLineStrikePatterns(String stockId);
}

