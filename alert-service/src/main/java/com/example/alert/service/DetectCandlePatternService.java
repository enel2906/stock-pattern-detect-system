package com.example.alert.service;

import com.example.alert.domain.CandleStick;

import java.util.List;

public interface DetectCandlePatternService {
    //One candle patterns
    List<CandleStick> getHammerCandles(String stockId);
    List<CandleStick> getLongLeggedDoji(String stockId);
    List<CandleStick> getGravestoneDoji(String stockId);
    List<CandleStick> getDragonflyDoji(String stockId);
    List<CandleStick> getInvertedHammerCandles(String stockId);
    List<CandleStick> getHangingManCandles(String stockId);
    List<CandleStick> getShootingStarCandles(String stockId);
    List<CandleStick> getBearishMarubozuPatterns(String stockId);
    List<CandleStick> getBullishMarubozuPatterns(String stockId);
    List<CandleStick> getBearishBeltHold(String stockId);
    List<CandleStick> getBullishBeltHold(String stockId);

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
    List<List<CandleStick>> getBearishHaramiCrossPatterns(String stockId);
    List<List<CandleStick>> getBullishHaramiCrossPatterns(String stockId);
    List<List<CandleStick>> getBearishCounterattackPatterns(String stockId);
    List<List<CandleStick>> getBullishCounterattackPatterns(String stockId);

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
    List<List<CandleStick>> getThrustingPatterns(String stockId);
    List<List<CandleStick>> getUpsideGapTwoCrowsPatterns(String stockId);
    List<List<CandleStick>> getThreeStarsInTheSouthPatterns(String stockId);
    List<List<CandleStick>> getAdvanceBlockPatterns(String stockId);
    List<List<CandleStick>> getDescendingHawkPatterns(String stockId);
    List<List<CandleStick>> getDeliberationPatterns(String stockId);

    //Many candle patterns
    List<List<CandleStick>> getFallingThreePatterns(String stockId);
    List<List<CandleStick>> getRisingThreePatterns(String stockId);
    List<List<CandleStick>> getBullishThreeLineStrikePatterns(String stockId);
    List<List<CandleStick>> getBearishThreeLineStrikePatterns(String stockId);
    List<List<CandleStick>> getLadderTopPatterns(String stockId);
}

