package com.example.alert.service;

import com.example.alert.domain.CandleStick;
import com.example.alert.domain.Stock;

import java.util.List;

public interface DetectCandlePatternService {
    List<CandleStick> getHammerCandles(String stockId);
    List<CandleStick> getDojiCandles(String stockId);
    List<CandleStick> getInvertedHammerCandles(String stockId);
    List<CandleStick> getHangingManCandles(String stockId);
    List<CandleStick> getShootingStarCandles(String stockId);
    List<List<CandleStick>> getBullishEngulfingPatterns(String stockId);
    List<List<CandleStick>> getBearishEngulfingPatterns(String stockId);
    List<List<CandleStick>> getTweezerBottomPatterns(String stockId);
    List<List<CandleStick>> getTweezerTopPatterns(String stockId);
    List<List<CandleStick>> getHaramiPatterns(String stockId);
    List<List<CandleStick>> getThreeWhiteSoldiers(String stockId);
    List<List<CandleStick>> getThreeBlackCrows(String stockId);
    List<List<CandleStick>> getEveningStarPatterns(String stockId);
    List<List<CandleStick>> getMorningStarPatterns(String stockId);
    List<List<CandleStick>> getDarkCloudCoverPatterns(String stockId);
    List<List<CandleStick>> getThreeOutsideUpPatterns(String stockId);
    List<List<CandleStick>> getThreeInsideUpPatterns(String stockId);
    List<List<CandleStick>> getBearishAbandonedBabyPatterns(String stockId);
    List<List<CandleStick>> getBearishKickerPatterns(String stockId);
    List<List<CandleStick>> getFallingThreePatterns(String stockId);
    List<List<CandleStick>> getRisingThreePatterns(String stockId);
}

