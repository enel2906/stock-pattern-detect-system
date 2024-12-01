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

    @Override
    public List<CandleStick> getInvertedHammerCandles(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> invertedHammerCandles = new ArrayList<>();
        for (int i = 1; i < candles.size(); i++) {
            CandleStick candle = candles.get(i);

            // Kiểm tra các điều kiện hình dạng nến
            double bodySize = Math.abs(candle.getClose() - candle.getOpen());
            double upperShadow = candle.getHigh() - Math.max(candle.getOpen(), candle.getClose());
            double lowerShadow = Math.min(candle.getOpen(), candle.getClose()) - candle.getLow();
            double totalRange = candle.getHigh() - candle.getLow();

            boolean isInvertedHammer = bodySize <= 0.2 * totalRange && // Thân nến nhỏ
                    upperShadow >= 2 * bodySize && // Bóng trên dài
                    lowerShadow <= 0.2 * totalRange; // Bóng dưới ngắn

            // Kiểm tra bối cảnh xu hướng giảm
            CandleStick prevCandle = candles.get(i - 1);
            boolean isDowntrend = prevCandle.getClose() < prevCandle.getOpen(); // Nến trước giảm

            if (isInvertedHammer && isDowntrend) {
                invertedHammerCandles.add(candle);
            }
        }
        return invertedHammerCandles;
    }

    @Override
    public List<CandleStick> getHangingManCandles(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> hangingManCandles = new ArrayList<>();
        for (int i = 1; i < candles.size(); i++) {
            CandleStick candle = candles.get(i);

            // Kiểm tra các điều kiện hình dạng nến
            double bodySize = Math.abs(candle.getClose() - candle.getOpen());
            double upperShadow = candle.getHigh() - Math.max(candle.getOpen(), candle.getClose());
            double lowerShadow = Math.min(candle.getOpen(), candle.getClose()) - candle.getLow();
            double totalRange = candle.getHigh() - candle.getLow();

            boolean isHangingMan = bodySize <= 0.2 * totalRange && // Thân nến nhỏ
                    upperShadow >= 2 * bodySize && // Bóng trên dài
                    lowerShadow <= 0.2 * totalRange; // Bóng dưới ngắn

            // Kiểm tra bối cảnh xu hướng tăng
            CandleStick prevCandle = candles.get(i - 1);
            boolean isUptrend = prevCandle.getClose() > prevCandle.getOpen(); // Nến trước tăng

            if (isHangingMan && isUptrend) {
                hangingManCandles.add(candle);
            }
        }
        return hangingManCandles;
    }


    @Override
    public List<List<CandleStick>> getBullishEngulfingPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<List<CandleStick>> bullishPatterns = new ArrayList<>();
        for (int i = 1; i < candles.size(); i++) {
            CandleStick prev = candles.get(i - 1);
            CandleStick curr = candles.get(i);

            if (prev.getClose() < prev.getOpen() && // Nến trước giảm giá
                    curr.getClose() > curr.getOpen() && // Nến hiện tại tăng giá
                    curr.getOpen() <= prev.getClose() && // Mở cửa của nến hiện tại <= đóng cửa của nến trước
                    curr.getClose() >= prev.getOpen()) { // Đóng cửa của nến hiện tại >= mở cửa của nến trước
                bullishPatterns.add(List.of(prev, curr));
            }
        }
        return bullishPatterns;
    }

    @Override
    public List<List<CandleStick>> getBearishEngulfingPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<List<CandleStick>> bearishPatterns = new ArrayList<>();
        for (int i = 1; i < candles.size(); i++) {
            CandleStick prev = candles.get(i - 1);
            CandleStick curr = candles.get(i);

            if (prev.getClose() > prev.getOpen() && // Nến trước tăng giá
                    curr.getClose() < curr.getOpen() && // Nến hiện tại giảm giá
                    curr.getOpen() >= prev.getClose() && // Mở cửa của nến hiện tại >= đóng cửa của nến trước
                    curr.getClose() <= prev.getOpen()) { // Đóng cửa của nến hiện tại <= mở cửa của nến trước
                bearishPatterns.add(List.of(prev, curr));
            }
        }
        return bearishPatterns;
    }

    @Override
    public List<List<CandleStick>> getTweezerBottomPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<List<CandleStick>> tweezerBottomPatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Kiểm tra điều kiện: Cả hai nến có giá thấp nhất giống nhau
            boolean sameLow = Double.compare(firstCandle.getLow(), secondCandle.getLow()) == 0;

            // Kiểm tra nến đầu tiên là nến giảm
            boolean firstCandleBearish = firstCandle.getClose() < firstCandle.getOpen();

            // Kiểm tra nến thứ hai là nến tăng hoặc trung tính
            boolean secondCandleBullishOrNeutral = secondCandle.getClose() >= secondCandle.getOpen();

            if (sameLow && firstCandleBearish && secondCandleBullishOrNeutral) {
                tweezerBottomPatterns.add(List.of(firstCandle, secondCandle));
            }
        }
        return tweezerBottomPatterns;
    }


    @Override
    public List<CandleStick> getDojiCandles(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> dojiCandles = new ArrayList<>();
        for (CandleStick candle : candles) {
            double bodySize = Math.abs(candle.getClose() - candle.getOpen());
            double totalRange = candle.getHigh() - candle.getLow();

            if (bodySize <= 0.1 * totalRange) { // Thân nến cực nhỏ
                dojiCandles.add(candle);
            }
        }
        return dojiCandles;
    }

    @Override
    public List<List<CandleStick>> getHaramiPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<List<CandleStick>> haramiPatterns = new ArrayList<>();
        for (int i = 1; i < candles.size(); i++) {
            CandleStick prev = candles.get(i - 1);
            CandleStick curr = candles.get(i);

            if (Math.abs(curr.getClose() - curr.getOpen()) <= Math.abs(prev.getClose() - prev.getOpen()) && // Nến hiện tại nhỏ hơn nến trước
                    curr.getLow() >= Math.min(prev.getClose(), prev.getOpen()) && // Nến hiện tại nằm trong phạm vi nến trước
                    curr.getHigh() <= Math.max(prev.getClose(), prev.getOpen())) {
                haramiPatterns.add(List.of(prev, curr));
            }
        }
        return haramiPatterns;
    }

    @Override
    public List<List<CandleStick>> getThreeWhiteSoldiers(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<List<CandleStick>> patterns = new ArrayList<>();
        for (int i = 2; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);

            if (first.getClose() > first.getOpen() && // Nến đầu tăng
                    second.getClose() > second.getOpen() && // Nến thứ hai tăng
                    third.getClose() > third.getOpen() && // Nến thứ ba tăng
                    second.getOpen() > first.getClose() && // Mở cửa nến thứ hai cao hơn đóng cửa nến đầu
                    third.getOpen() > second.getClose()) { // Mở cửa nến thứ ba cao hơn đóng cửa nến thứ hai
                patterns.add(List.of(first, second, third));
            }
        }
        return patterns;
    }

    @Override
    public List<List<CandleStick>> getThreeBlackCrows(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<List<CandleStick>> patterns = new ArrayList<>();
        for (int i = 2; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);

            if (first.getClose() < first.getOpen() && // Nến đầu giảm
                    second.getClose() < second.getOpen() && // Nến thứ hai giảm
                    third.getClose() < third.getOpen() && // Nến thứ ba giảm
                    second.getOpen() < first.getClose() && // Mở cửa nến thứ hai thấp hơn đóng cửa nến đầu
                    third.getOpen() < second.getClose()) { // Mở cửa nến thứ ba thấp hơn đóng cửa nến thứ hai
                patterns.add(List.of(first, second, third));
            }
        }
        return patterns;
    }
}

