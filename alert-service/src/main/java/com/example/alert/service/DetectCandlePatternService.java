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
    List<CandleStick> getBullishEngulfingPatterns(String stockId);
    List<CandleStick> getBearishEngulfingPatterns(String stockId);
    List<CandleStick> getBearishKickerPatterns(String stockId);
    List<CandleStick> getBullishKickerPatterns(String stockId);
    List<CandleStick> getPiercingLinePatterns(String stockId);
    List<CandleStick> getTweezerBottomPatterns(String stockId);
    List<CandleStick> getTweezerTopPatterns(String stockId);
    List<CandleStick> getHaramiPatterns(String stockId);
    List<CandleStick> getDarkCloudCoverPatterns(String stockId);
    List<CandleStick> getMatchingLowPatterns(String stockId);
    List<CandleStick> getMatchingHighPatterns(String stockId);
    List<CandleStick> getBearishHaramiCrossPatterns(String stockId);
    List<CandleStick> getBullishHaramiCrossPatterns(String stockId);
    List<CandleStick> getBearishCounterattackPatterns(String stockId);
    List<CandleStick> getBullishCounterattackPatterns(String stockId);

    //Three candle patterns
    List<CandleStick> getThreeWhiteSoldiers(String stockId);
    List<CandleStick> getThreeBlackCrows(String stockId);
    List<CandleStick> getEveningStarPatterns(String stockId);
    List<CandleStick> getMorningStarPatterns(String stockId);
    List<CandleStick> getThreeOutsideUpPatterns(String stockId);
    List<CandleStick> getThreeInsideUpPatterns(String stockId);
    List<CandleStick> getBearishAbandonedBabyPatterns(String stockId);
    List<CandleStick> getDownsideTasukiGapPatterns(String stockId);
    List<CandleStick> getUpsideTasukiGapPatterns(String stockId);
    List<CandleStick> getEveningStarDojiPatterns(String stockId);
    List<CandleStick> getMorningStarDojiPatterns(String stockId);
    List<CandleStick> getBearishTriStarPatterns(String stockId);
    List<CandleStick> getBullishTriStarPatterns(String stockId);
    List<CandleStick> getThrustingPatterns(String stockId);
    List<CandleStick> getUpsideGapTwoCrowsPatterns(String stockId);
    List<CandleStick> getThreeStarsInTheSouthPatterns(String stockId);
    List<CandleStick> getAdvanceBlockPatterns(String stockId);
    List<CandleStick> getDescendingHawkPatterns(String stockId);
    List<CandleStick> getDeliberationPatterns(String stockId);

    //Many candle patterns
    List<CandleStick> getFallingThreePatterns(String stockId);
    List<CandleStick> getRisingThreePatterns(String stockId);
    List<CandleStick> getBullishThreeLineStrikePatterns(String stockId);
    List<CandleStick> getBearishThreeLineStrikePatterns(String stockId);
    List<CandleStick> getLadderTopPatterns(String stockId);
}

