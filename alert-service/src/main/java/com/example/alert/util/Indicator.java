package com.example.alert.util;

import com.example.alert.domain.CandleStick;

import java.util.ArrayList;
import java.util.List;

public class Indicator {
    public static List<Double> calculateSMA(List<CandleStick> candles, int period) {
        List<Double> smaValues = new ArrayList<>();

        for (int i = 0; i < candles.size(); i++) {
            if (i >= period - 1) {
                double sum = 0.0;
                for (int j = i; j > i - period; j--) {
                    sum += candles.get(j).getClose();
                }
                smaValues.add(sum / period);
            } else {
                smaValues.add(null); // Không đủ dữ liệu để tính SMA
            }
        }

        return smaValues;
    }
}
