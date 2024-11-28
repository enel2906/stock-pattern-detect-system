package com.example.alert.util;

import com.example.alert.domain.CandleStick;

import java.util.ArrayList;
import java.util.List;

public class CandleDetect {
    public static List<CandleStick> findHammerPatterns(List<CandleStick> candles) {
        List<CandleStick> hammerCandles = new ArrayList<>();

        for (CandleStick candle : candles) {
            double bodySize = Math.abs(candle.getClose() - candle.getOpen());
            double upperShadow = candle.getHigh() - Math.max(candle.getOpen(), candle.getClose());
            double lowerShadow = Math.min(candle.getOpen(), candle.getClose()) - candle.getLow();
            double totalRange = candle.getHigh() - candle.getLow();

            if (bodySize <= 0.2 * totalRange &&
                    lowerShadow >= 2 * bodySize &&
                    upperShadow <= 0.2 * totalRange) {
                hammerCandles.add(candle);
            }
        }

        return hammerCandles;
    }


}
