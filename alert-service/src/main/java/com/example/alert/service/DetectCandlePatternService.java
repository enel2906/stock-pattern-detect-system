package com.example.alert.service;

import com.example.alert.domain.CandleStick;
import com.example.alert.domain.Stock;

import java.util.List;

public interface DetectCandlePatternService {
    List<CandleStick> getHammerCandles(String stockId);
    List<CandleStick> getDojiCandles(String stockId);
    List<CandleStick> getInvertedHammerCandles(String stockId);
    public List<CandleStick> getHangingManCandles(String stockId);
    List<List<CandleStick>> getBullishEngulfingPatterns(String stockId);
    List<List<CandleStick>> getBearishEngulfingPatterns(String stockId);
    List<List<CandleStick>> getTweezerBottomPatterns(String stockId);
    List<List<CandleStick>> getHaramiPatterns(String stockId);
    List<List<CandleStick>> getThreeWhiteSoldiers(String stockId);
    List<List<CandleStick>> getThreeBlackCrows(String stockId);
}

