package com.example.alert.service.impl;

import com.example.alert.domain.CandleStick;
import com.example.alert.domain.Stock;
import com.example.alert.repository.CandleStickRepository;
import com.example.alert.service.DetectCandlePatternService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class DetectCandlePatternServiceImpl implements DetectCandlePatternService {
    private final CandleStickRepository candleStickRepository;

    @Override
    public List<CandleStick> getHammerCandles(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        return findHammerPatterns(candles);
    }

    private List<CandleStick> findHammerPatterns(List<CandleStick> candles) {
        List<CandleStick> hammerCandles = new ArrayList<>();

        for (CandleStick candle : candles) {
            double bodySize = Math.abs(candle.getClose() - candle.getOpen());
            double upperShadow = candle.getHigh() - Math.max(candle.getOpen(), candle.getClose());
            double lowerShadow = Math.min(candle.getOpen(), candle.getClose()) - candle.getLow();
            double totalRange = candle.getHigh() - candle.getLow();

            if (bodySize <= 0.2 * totalRange && // Thân nến nhỏ
                    lowerShadow >= 2 * bodySize && // Bóng dưới lớn
                    upperShadow <= 0.2 * totalRange) { // Bóng trên nhỏ
                hammerCandles.add(candle);
            }
        }

        return hammerCandles;
    }
}
