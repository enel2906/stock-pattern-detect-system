package com.example.alert.service.impl;

import com.example.alert.domain.CandleStick;
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
                
                if (totalRange == 0) continue; // Avoid division by zero

                // Hammer: small body at top, long lower shadow (>= 2x body), minimal upper shadow
                if (bodySize <= 0.3 * totalRange && // Thân nến nhỏ
                        lowerShadow >= 2 * bodySize && // Bóng dưới lớn
                        upperShadow <= 0.1 * totalRange) { // Bóng trên rất ngắn
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
            
            if (totalRange == 0) continue; // Avoid division by zero

            // Inverted Hammer: small body at bottom, long upper shadow, minimal lower shadow
            boolean isInvertedHammer = bodySize <= 0.3 * totalRange && // Thân nến nhỏ
                    upperShadow >= 2 * bodySize && // Bóng trên dài
                    lowerShadow <= 0.1 * totalRange; // Bóng dưới rất ngắn

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

            // Hanging Man: small body at top, long lower shadow, minimal upper shadow
            boolean isHangingMan = totalRange > 0 &&
                    bodySize <= 0.3 * totalRange && // Thân nến nhỏ
                    lowerShadow >= 2 * bodySize && // Bóng dưới dài (FIXED: was checking upperShadow)
                    upperShadow <= 0.1 * totalRange; // Bóng trên rất ngắn

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
    public List<CandleStick> getBearishMarubozuPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> bearishMarubozuPatterns = new ArrayList<>();

        for (CandleStick candle : candles) {
            double totalRange = candle.getHigh() - candle.getLow();
            if (totalRange == 0) continue; // Avoid division by zero
            
            double bodySize = candle.getOpen() - candle.getClose();
            double upperShadow = candle.getHigh() - candle.getOpen();
            double lowerShadow = candle.getClose() - candle.getLow();
            
            // Bearish Marubozu: long bearish body with minimal or no wicks
            boolean isBearishMarubozu = bodySize > 0 && // Nến giảm
                    (bodySize / totalRange) >= 0.95 && // Thân nến chiếm >=95% phạm vi
                    upperShadow <= 0.1 * totalRange && // Bóng trên rất ngắn
                    lowerShadow <= 0.1 * totalRange; // Bóng dưới rất ngắn

            if (isBearishMarubozu) {
                bearishMarubozuPatterns.add(candle);
            }
        }
        return bearishMarubozuPatterns;
    }


    @Override
    public List<CandleStick> getBullishMarubozuPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> bullishMarubozuPatterns = new ArrayList<>();

        for (CandleStick candle : candles) {
            double totalRange = candle.getHigh() - candle.getLow();
            if (totalRange == 0) continue; // Avoid division by zero
            
            double bodySize = candle.getClose() - candle.getOpen();
            double upperShadow = candle.getHigh() - candle.getClose();
            double lowerShadow = candle.getOpen() - candle.getLow();
            
            // Bullish Marubozu: long bullish body with minimal or no wicks
            boolean isBullishMarubozu = bodySize > 0 && // Nến tăng
                    (bodySize / totalRange) >= 0.95 && // Thân nến chiếm >=95% phạm vi
                    upperShadow <= 0.1 * totalRange && // Bóng trên rất ngắn
                    lowerShadow <= 0.1 * totalRange; // Bóng dưới rất ngắn

            if (isBullishMarubozu) {
                bullishMarubozuPatterns.add(candle);
            }
        }
        return bullishMarubozuPatterns;
    }



    @Override
    public List<CandleStick> getBullishEngulfingPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> bullishPatterns = new ArrayList<>();
        for (int i = 1; i < candles.size(); i++) {
            CandleStick prev = candles.get(i - 1);
            CandleStick curr = candles.get(i);

            if (prev.getClose() < prev.getOpen() && // Nến trước giảm giá
                    curr.getClose() > curr.getOpen() && // Nến hiện tại tăng giá
                    curr.getOpen() <= prev.getClose() && // Mở cửa của nến hiện tại <= đóng cửa của nến trước
                    curr.getClose() >= prev.getOpen()) { // Đóng cửa của nến hiện tại >= mở cửa của nến trước
                bullishPatterns.add(curr);
            }
        }
        return bullishPatterns;
    }

    @Override
    public List<CandleStick> getBearishEngulfingPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> bearishPatterns = new ArrayList<>();
        for (int i = 1; i < candles.size(); i++) {
            CandleStick prev = candles.get(i - 1);
            CandleStick curr = candles.get(i);

            if (prev.getClose() > prev.getOpen() && // Nến trước tăng giá
                    curr.getClose() < curr.getOpen() && // Nến hiện tại giảm giá
                    curr.getOpen() >= prev.getClose() && // Mở cửa của nến hiện tại >= đóng cửa của nến trước
                    curr.getClose() <= prev.getOpen()) { // Đóng cửa của nến hiện tại <= mở cửa của nến trước
                bearishPatterns.add(curr);
            }
        }
        return bearishPatterns;
    }

    @Override
    public List<CandleStick> getTweezerBottomPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> tweezerBottomPatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Kiểm tra điều kiện: Cả hai nến có giá thấp nhất gần giống nhau (tolerance 0.2%)
            double avgLow = (firstCandle.getLow() + secondCandle.getLow()) / 2;
            boolean sameLow = Math.abs(firstCandle.getLow() - secondCandle.getLow()) <= avgLow * 0.002;

            // Kiểm tra nến đầu tiên là nến giảm
            boolean firstCandleBearish = firstCandle.getClose() < firstCandle.getOpen();

            // Kiểm tra nến thứ hai là nến tăng hoặc trung tính
            boolean secondCandleBullishOrNeutral = secondCandle.getClose() >= secondCandle.getOpen();

            if (sameLow && firstCandleBearish && secondCandleBullishOrNeutral) {
                tweezerBottomPatterns.add(secondCandle);
            }
        }
        return tweezerBottomPatterns;
    }

    @Override
    public List<CandleStick> getTweezerTopPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> tweezerTopPatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Kiểm tra điều kiện: Cả hai nến có giá cao nhất gần giống nhau (tolerance 0.2%)
            double avgHigh = (firstCandle.getHigh() + secondCandle.getHigh()) / 2;
            boolean sameHigh = Math.abs(firstCandle.getHigh() - secondCandle.getHigh()) <= avgHigh * 0.002;

            // Kiểm tra nến đầu tiên là nến tăng
            boolean firstCandleBullish = firstCandle.getClose() > firstCandle.getOpen();

            // Kiểm tra nến thứ hai là giảm hoặc trung tính
            boolean secondCandleBearishOrNeutral = secondCandle.getClose() <= secondCandle.getOpen();

            if (sameHigh && firstCandleBullish && secondCandleBearishOrNeutral) {
                tweezerTopPatterns.add(secondCandle);
            }
        }
        return tweezerTopPatterns;
    }

    @Override
    public List<CandleStick> getDragonflyDoji(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> dragonflyDojiCandles = new ArrayList<>();

        for (CandleStick candle : candles) {
            double openCloseDiff = Math.abs(candle.getOpen() - candle.getClose());
            double totalRange = candle.getHigh() - candle.getLow();
            
            if (totalRange == 0) continue; // Avoid division by zero

            double upperShadow = candle.getHigh() - Math.max(candle.getOpen(), candle.getClose());
            
            // Điều kiện Dragonfly Doji: Doji with long lower shadow, minimal upper shadow
            if (openCloseDiff <= 0.1 * totalRange &&
                    upperShadow <= 0.1 * totalRange) {
                dragonflyDojiCandles.add(candle);
            }
        }
        return dragonflyDojiCandles;
    }

    @Override
    public List<CandleStick> getGravestoneDoji(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> gravestoneDojiCandles = new ArrayList<>();

        for (CandleStick candle : candles) {
            double openCloseDiff = Math.abs(candle.getOpen() - candle.getClose());
            double totalRange = candle.getHigh() - candle.getLow();
            
            if (totalRange == 0) continue; // Avoid division by zero

            double lowerShadow = Math.min(candle.getOpen(), candle.getClose()) - candle.getLow();
            
            // Điều kiện Gravestone Doji: Doji with long upper shadow, minimal lower shadow
            if (openCloseDiff <= 0.1 * totalRange &&
                    lowerShadow <= 0.1 * totalRange) {
                gravestoneDojiCandles.add(candle);
            }
        }
        return gravestoneDojiCandles;
    }

    @Override
    public List<CandleStick> getLongLeggedDoji(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> longLeggedDojiCandles = new ArrayList<>();

        for (CandleStick candle : candles) {
            double openCloseDiff = Math.abs(candle.getOpen() - candle.getClose());
            double upperShadow = candle.getHigh() - Math.max(candle.getOpen(), candle.getClose());
            double lowerShadow = Math.min(candle.getOpen(), candle.getClose()) - candle.getLow();
            double totalRange = candle.getHigh() - candle.getLow();
            
            if (totalRange == 0) continue; // Avoid division by zero

            // Điều kiện Long-legged Doji: Doji with long shadows on both sides
            if (openCloseDiff <= 0.1 * totalRange &&
                    upperShadow >= 0.3 * totalRange &&
                    lowerShadow >= 0.3 * totalRange) {
                longLeggedDojiCandles.add(candle);
            }
        }
        return longLeggedDojiCandles;
    }


    @Override
    public List<CandleStick> getShootingStarCandles(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> shootingStarCandles = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick candle = candles.get(i);

            // Tính toán các thành phần của nến
            double bodySize = Math.abs(candle.getClose() - candle.getOpen());
            double upperShadow = candle.getHigh() - Math.max(candle.getOpen(), candle.getClose());
            double lowerShadow = Math.min(candle.getOpen(), candle.getClose()) - candle.getLow();
            double totalRange = candle.getHigh() - candle.getLow();
            
            if (totalRange == 0) continue; // Avoid division by zero

            // Kiểm tra điều kiện hình dạng của Shooting Star: small body at bottom, long upper shadow
            boolean isShootingStar = bodySize <= 0.3 * totalRange && // Thân nến nhỏ
                    upperShadow >= 2 * bodySize && // Bóng trên dài
                    lowerShadow <= 0.1 * totalRange; // Bóng dưới rất nhỏ

            // Kiểm tra bối cảnh: Xuất hiện sau xu hướng tăng
            CandleStick prevCandle = candles.get(i - 1);
            boolean isUptrend = prevCandle.getClose() > prevCandle.getOpen(); // Nến trước tăng

            if (isShootingStar && isUptrend) {
                shootingStarCandles.add(candle);
            }
        }
        return shootingStarCandles;
    }


    @Override
    public List<CandleStick> getHaramiPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> haramiPatterns = new ArrayList<>();
        for (int i = 1; i < candles.size(); i++) {
            CandleStick prev = candles.get(i - 1);
            CandleStick curr = candles.get(i);

            if (Math.abs(curr.getClose() - curr.getOpen()) <= Math.abs(prev.getClose() - prev.getOpen()) && // Nến hiện tại nhỏ hơn nến trước
                    curr.getLow() >= Math.min(prev.getClose(), prev.getOpen()) && // Nến hiện tại nằm trong phạm vi nến trước
                    curr.getHigh() <= Math.max(prev.getClose(), prev.getOpen())) {
                haramiPatterns.add(curr);
            }
        }
        return haramiPatterns;
    }

    @Override
    public List<CandleStick> getThrustingPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> thrustingPatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Kiểm tra nến đầu tiên là nến giảm mạnh
            boolean isFirstBearish = firstCandle.getClose() < firstCandle.getOpen();

            // Kiểm tra nến thứ hai là nến tăng
            boolean isSecondBullish = secondCandle.getClose() > secondCandle.getOpen();

            // Kiểm tra khoảng trống giảm (gap down) giữa giá mở cửa của nến thứ hai và giá đóng cửa của nến đầu tiên
            boolean hasGapDown = secondCandle.getOpen() < firstCandle.getClose();

            // Kiểm tra giá đóng cửa của nến thứ hai nằm dưới mức giữa thân nến đầu tiên
            double firstCandleMidpoint = (firstCandle.getOpen() + firstCandle.getClose()) / 2;
            boolean closeBelowMidpoint = secondCandle.getClose() < firstCandleMidpoint &&
                    secondCandle.getClose() > firstCandle.getClose(); // Nhưng phải đóng trên nến đầu tiên

            if (isFirstBearish && isSecondBullish && hasGapDown && closeBelowMidpoint) {
                thrustingPatterns.add(secondCandle);
            }
        }

        return thrustingPatterns;
    }


    @Override
    public List<CandleStick> getPiercingLinePatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> piercingLinePatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Kiểm tra nến đầu tiên là nến giảm mạnh (Bearish)
            boolean firstCandleBearish = firstCandle.getClose() < firstCandle.getOpen();

            // Kiểm tra nến thứ hai là nến tăng (Bullish)
            boolean secondCandleBullish = secondCandle.getClose() > secondCandle.getOpen();

            // Kiểm tra nến thứ hai mở cửa dưới giá đóng cửa của nến đầu tiên (gap down)
            boolean isGapDown = secondCandle.getOpen() < firstCandle.getClose();

            // Kiểm tra nến thứ hai đóng cửa trên mức giữa thân nến đầu tiên
            double firstCandleMidpoint = (firstCandle.getOpen() + firstCandle.getClose()) / 2;
            boolean closesAboveHalfFirstCandle = secondCandle.getClose() > firstCandleMidpoint &&
                    secondCandle.getClose() < firstCandle.getOpen(); // Nhưng không đóng cửa trên nến đầu tiên

            // Điều kiện tạo ra mẫu Piercing Line
            if (firstCandleBearish && secondCandleBullish && isGapDown && closesAboveHalfFirstCandle) {
                piercingLinePatterns.add(secondCandle);
            }
        }
        return piercingLinePatterns;
    }


    @Override
    public List<CandleStick> getThreeWhiteSoldiers(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> patterns = new ArrayList<>();
        for (int i = 2; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);

            // Three White Soldiers: 3 nến tăng liên tiếp, mỗi nến mở trong thân nến trước và đóng cao hơn
            if (first.getClose() > first.getOpen() && // Nến đầu tăng
                    second.getClose() > second.getOpen() && // Nến thứ hai tăng
                    third.getClose() > third.getOpen() && // Nến thứ ba tăng
                    second.getOpen() > first.getOpen() && second.getOpen() < first.getClose() && // Nến 2 mở trong thân nến 1
                    second.getClose() > first.getClose() && // Nến 2 đóng cao hơn nến 1
                    third.getOpen() > second.getOpen() && third.getOpen() < second.getClose() && // Nến 3 mở trong thân nến 2
                    third.getClose() > second.getClose()) { // Nến 3 đóng cao hơn nến 2
                patterns.add(third);
            }
        }
        return patterns;
    }

    @Override
    public List<CandleStick> getThreeBlackCrows(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> patterns = new ArrayList<>();
        for (int i = 2; i < candles.size(); i++) {
            CandleStick first = candles.get(i - 2);
            CandleStick second = candles.get(i - 1);
            CandleStick third = candles.get(i);

            // Three Black Crows: 3 nến giảm liên tiếp, mỗi nến mở trong thân nến trước và đóng thấp hơn
            if (first.getClose() < first.getOpen() && // Nến đầu giảm
                    second.getClose() < second.getOpen() && // Nến thứ hai giảm
                    third.getClose() < third.getOpen() && // Nến thứ ba giảm
                    second.getOpen() < first.getOpen() && second.getOpen() > first.getClose() && // Nến 2 mở trong thân nến 1
                    second.getClose() < first.getClose() && // Nến 2 đóng thấp hơn nến 1
                    third.getOpen() < second.getOpen() && third.getOpen() > second.getClose() && // Nến 3 mở trong thân nến 2
                    third.getClose() < second.getClose()) { // Nến 3 đóng thấp hơn nến 2
                patterns.add(third);
            }
        }
        return patterns;
    }

    @Override
    public List<CandleStick> getEveningStarPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> eveningStarPatterns = new ArrayList<>();

        for (int i = 2; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            boolean firstBullish = firstCandle.getClose() > firstCandle.getOpen();
            boolean secondSmallBody = Math.abs(secondCandle.getClose() - secondCandle.getOpen()) <
                    (firstCandle.getHigh() - firstCandle.getLow()) * 0.3;
            boolean thirdBearish = thirdCandle.getClose() < thirdCandle.getOpen();
            boolean strongDrop = thirdCandle.getClose() < (firstCandle.getClose() +
                    (firstCandle.getOpen() - firstCandle.getClose()) * 0.5);

            if (firstBullish && secondSmallBody && thirdBearish && strongDrop) {
                eveningStarPatterns.add(thirdCandle);
            }
        }
        return eveningStarPatterns;
    }


    @Override
    public List<CandleStick> getMorningStarPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> morningStarPatterns = new ArrayList<>();

        for (int i = 2; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            boolean firstBearish = firstCandle.getClose() < firstCandle.getOpen();
            boolean secondSmallBody = Math.abs(secondCandle.getClose() - secondCandle.getOpen()) <
                    (firstCandle.getHigh() - firstCandle.getLow()) * 0.3;
            boolean thirdBullish = thirdCandle.getClose() > thirdCandle.getOpen();
            boolean strongRecovery = thirdCandle.getClose() > (firstCandle.getOpen() +
                    (firstCandle.getClose() - firstCandle.getOpen()) * 0.5);

            if (firstBearish && secondSmallBody && thirdBullish && strongRecovery) {
                morningStarPatterns.add(thirdCandle);
            }
        }
        return morningStarPatterns;
    }

    @Override
    public List<CandleStick> getDarkCloudCoverPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> darkCloudCoverPatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Kiểm tra nến thứ nhất là nến tăng
            boolean firstCandleBullish = firstCandle.getClose() > firstCandle.getOpen();

            // Kiểm tra nến thứ hai là nến giảm với gap up
            boolean secondCandleBearish = secondCandle.getClose() < secondCandle.getOpen();
            boolean hasGapUp = secondCandle.getOpen() > firstCandle.getClose();
            
            // Kiểm tra nến thứ hai đóng cửa dưới điểm giữa thân nến đầu tiên
            double firstCandleMidpoint = (firstCandle.getOpen() + firstCandle.getClose()) / 2;
            boolean closeBelowMidpoint = secondCandle.getClose() < firstCandleMidpoint &&
                    secondCandle.getClose() > firstCandle.getOpen(); // Nhưng không đóng dưới giá mở nến 1

            if (firstCandleBullish && secondCandleBearish && hasGapUp && closeBelowMidpoint) {
                darkCloudCoverPatterns.add(secondCandle);
            }
        }
        return darkCloudCoverPatterns;
    }

    @Override
    public List<CandleStick> getThreeOutsideUpPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> threeOutsideUpPatterns = new ArrayList<>();

        for (int i = 2; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            // Điều kiện nến thứ nhất: Là nến giảm
            boolean firstCandleBearish = firstCandle.getClose() < firstCandle.getOpen();

            // Điều kiện nến thứ hai: Bao trùm hoàn toàn nến thứ nhất và là nến tăng
            boolean secondCandleBullish = secondCandle.getClose() > secondCandle.getOpen() &&
                    secondCandle.getOpen() <= firstCandle.getClose() &&
                    secondCandle.getClose() >= firstCandle.getOpen();

            // Điều kiện nến thứ ba: Đóng cửa cao hơn nến thứ hai
            boolean thirdCandleBullish = thirdCandle.getClose() > thirdCandle.getOpen() &&
                    thirdCandle.getClose() > secondCandle.getClose();

            if (firstCandleBearish && secondCandleBullish && thirdCandleBullish) {
                threeOutsideUpPatterns.add(thirdCandle);
            }
        }
        return threeOutsideUpPatterns;
    }

    @Override
    public List<CandleStick> getThreeStarsInTheSouthPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> patterns = new ArrayList<>();

        for (int i = 2; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            // Điều kiện của nến thứ nhất (nến giảm lớn)
            boolean firstCondition = firstCandle.getClose() < firstCandle.getOpen() && // Nến giảm
                    Math.abs(firstCandle.getClose() - firstCandle.getOpen()) >= 0.5 * (firstCandle.getHigh() - firstCandle.getLow()) && // Thân nến lớn
                    (firstCandle.getHigh() - Math.max(firstCandle.getOpen(), firstCandle.getClose())) <= 0.2 * (firstCandle.getHigh() - firstCandle.getLow()); // Bóng trên ngắn

            // Điều kiện của nến thứ hai (giảm tiếp nhưng thân nhỏ hơn)
            boolean secondCondition = secondCandle.getClose() < secondCandle.getOpen() &&
                    Math.abs(secondCandle.getClose() - secondCandle.getOpen()) < Math.abs(firstCandle.getClose() - firstCandle.getOpen()) &&
                    secondCandle.getClose() > firstCandle.getClose();

            // Điều kiện của nến thứ ba (giảm tiếp và thân nhỏ nhất)
            boolean thirdCondition = thirdCandle.getClose() < thirdCandle.getOpen() &&
                    Math.abs(thirdCandle.getClose() - thirdCandle.getOpen()) < Math.abs(secondCandle.getClose() - secondCandle.getOpen()) &&
                    thirdCandle.getClose() > secondCandle.getClose();

            if (firstCondition && secondCondition && thirdCondition) {
                patterns.add(thirdCandle);
            }
        }
        return patterns;
    }

    @Override
    public List<CandleStick> getAdvanceBlockPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> advanceBlockPatterns = new ArrayList<>();

        for (int i = 2; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            boolean firstBullish = firstCandle.getClose() > firstCandle.getOpen();
            boolean secondBullish = secondCandle.getClose() > secondCandle.getOpen();
            boolean thirdBullish = thirdCandle.getClose() > thirdCandle.getOpen();

            boolean decreasingBodySize = (firstCandle.getClose() - firstCandle.getOpen()) >
                    (secondCandle.getClose() - secondCandle.getOpen()) &&
                    (secondCandle.getClose() - secondCandle.getOpen()) >
                            (thirdCandle.getClose() - thirdCandle.getOpen());

            boolean increasingUpperShadow = (firstCandle.getHigh() - firstCandle.getClose()) <
                    (secondCandle.getHigh() - secondCandle.getClose()) &&
                    (secondCandle.getHigh() - secondCandle.getClose()) <
                            (thirdCandle.getHigh() - thirdCandle.getClose());

            if (firstBullish && secondBullish && thirdBullish && decreasingBodySize && increasingUpperShadow) {
                advanceBlockPatterns.add(thirdCandle);
            }
        }
        return advanceBlockPatterns;
    }

    @Override
    public List<CandleStick> getDescendingHawkPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> descendingHawkPatterns = new ArrayList<>();

        for (int i = 2; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            boolean firstBullish = firstCandle.getClose() > firstCandle.getOpen();
            boolean secondBullish = secondCandle.getClose() > secondCandle.getOpen();
            boolean thirdBearish = thirdCandle.getClose() < thirdCandle.getOpen();

            boolean thirdSmallBody = (thirdCandle.getOpen() - thirdCandle.getClose()) <
                    (firstCandle.getClose() - firstCandle.getOpen()) * 0.5;

            if (firstBullish && secondBullish && thirdBearish && thirdSmallBody) {
                descendingHawkPatterns.add(thirdCandle);
            }
        }
        return descendingHawkPatterns;
    }

    @Override
    public List<CandleStick> getDeliberationPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> deliberationPatterns = new ArrayList<>();

        for (int i = 2; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            boolean firstBullish = firstCandle.getClose() > firstCandle.getOpen();
            boolean secondBullish = secondCandle.getClose() > secondCandle.getOpen();
            boolean thirdBullish = thirdCandle.getClose() > thirdCandle.getOpen();

            boolean thirdSmallBody = (thirdCandle.getClose() - thirdCandle.getOpen()) <
                    (secondCandle.getClose() - secondCandle.getOpen()) * 0.5;
            boolean thirdLongUpperShadow = (thirdCandle.getHigh() - thirdCandle.getClose()) >
                    (thirdCandle.getClose() - thirdCandle.getOpen());

            if (firstBullish && secondBullish && thirdBullish && thirdSmallBody && thirdLongUpperShadow) {
                deliberationPatterns.add(thirdCandle);
            }
        }
        return deliberationPatterns;
    }


    @Override
    public List<CandleStick> getThreeInsideUpPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> threeInsideUpPatterns = new ArrayList<>();

        for (int i = 2; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            // Kiểm tra nến đầu tiên là nến giảm
            boolean firstCandleBearish = firstCandle.getClose() < firstCandle.getOpen();

            // Kiểm tra nến thứ hai là nến tăng nhỏ hơn nằm hoàn toàn bên trong nến đầu tiên (Bullish Harami)
            boolean secondCandleBullishHarami = secondCandle.getClose() > secondCandle.getOpen() &&
                    secondCandle.getOpen() >= firstCandle.getClose() &&
                    secondCandle.getClose() <= firstCandle.getOpen();

            // Kiểm tra nến thứ ba là nến tăng mạnh, giá đóng cửa cao hơn nến thứ hai
            boolean thirdCandleBullish = thirdCandle.getClose() > thirdCandle.getOpen() &&
                    thirdCandle.getClose() > secondCandle.getClose(); // Chỉ cần cao hơn close, không cần cao hơn high

            if (firstCandleBearish && secondCandleBullishHarami && thirdCandleBullish) {
                threeInsideUpPatterns.add(thirdCandle);
            }
        }
        return threeInsideUpPatterns;
    }


    @Override
    public List<CandleStick> getBearishAbandonedBabyPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> bearishAbandonedBabyPatterns = new ArrayList<>();

        for (int i = 2; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            // Kiểm tra nến đầu tiên là nến tăng
            boolean firstCandleBullish = firstCandle.getClose() > firstCandle.getOpen();

            // Kiểm tra nến thứ hai là doji hoặc spinning top, với gap up so với nến đầu tiên
            boolean secondCandleDoji = Math.abs(secondCandle.getClose() - secondCandle.getOpen()) <=
                    0.1 * (secondCandle.getHigh() - secondCandle.getLow());
            boolean secondCandleGapUp = secondCandle.getLow() > firstCandle.getHigh();

            // Kiểm tra nến thứ ba là nến giảm với gap down và đóng cửa thấp hơn nến đầu tiên
            boolean thirdCandleBearish = thirdCandle.getClose() < thirdCandle.getOpen();
            boolean thirdCandleGapDown = thirdCandle.getHigh() < secondCandle.getLow();
            boolean thirdCandleClosesBelowFirst = thirdCandle.getClose() < firstCandle.getOpen();

            if (firstCandleBullish && secondCandleDoji && secondCandleGapUp &&
                    thirdCandleBearish && thirdCandleGapDown && thirdCandleClosesBelowFirst) {
                bearishAbandonedBabyPatterns.add(thirdCandle);
            }
        }
        return bearishAbandonedBabyPatterns;
    }

    @Override
    public List<CandleStick> getBearishKickerPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> bearishKickerPatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Kiểm tra nến đầu tiên là nến tăng mạnh
            boolean firstCandleBullish = firstCandle.getClose() > firstCandle.getOpen();

            // Kiểm tra nến thứ hai là nến giảm mạnh với gap down
            boolean secondCandleBearish = secondCandle.getClose() < secondCandle.getOpen() &&
                    secondCandle.getOpen() < firstCandle.getClose();

            if (firstCandleBullish && secondCandleBearish) {
                bearishKickerPatterns.add(secondCandle);
            }
        }
        return bearishKickerPatterns;
    }

    @Override
    public List<CandleStick> getBullishKickerPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> bullishKickerPatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Kiểm tra nến đầu tiên là nến giảm mạnh (Bearish)
            boolean firstCandleBearish = firstCandle.getClose() < firstCandle.getOpen();

            // Kiểm tra nến thứ hai là nến tăng mạnh (Bullish)
            boolean secondCandleBullish = secondCandle.getClose() > secondCandle.getOpen();

            // Kiểm tra khoảng trống giữa nến thứ nhất và thứ hai (Gap)
            boolean isGapUp = secondCandle.getOpen() > firstCandle.getClose();

            // Điều kiện để nhận diện mẫu Bullish Kicker
            if (firstCandleBearish && secondCandleBullish && isGapUp) {
                bullishKickerPatterns.add(secondCandle);
            }
        }
        return bullishKickerPatterns;
    }


    @Override
    public List<CandleStick> getFallingThreePatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> fallingThreePatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) { // Bắt đầu từ nến thứ 5
            CandleStick firstCandle = candles.get(i - 4);
            CandleStick secondCandle = candles.get(i - 3);
            CandleStick thirdCandle = candles.get(i - 2);
            CandleStick fourthCandle = candles.get(i - 1);
            CandleStick fifthCandle = candles.get(i);

            // Kiểm tra nến đầu tiên là nến giảm mạnh
            boolean firstCandleBearish = firstCandle.getClose() < firstCandle.getOpen();

            // Kiểm tra 3 nến giữa nằm trong phạm vi thân nến đầu tiên
            boolean middleCandlesInsideRange = secondCandle.getHigh() <= firstCandle.getOpen() &&
                    secondCandle.getLow() >= firstCandle.getClose() &&
                    thirdCandle.getHigh() <= firstCandle.getOpen() &&
                    thirdCandle.getLow() >= firstCandle.getClose() &&
                    fourthCandle.getHigh() <= firstCandle.getOpen() &&
                    fourthCandle.getLow() >= firstCandle.getClose();

            // Kiểm tra nến cuối cùng là nến giảm mạnh
            boolean fifthCandleBearish = fifthCandle.getClose() < fifthCandle.getOpen() &&
                    fifthCandle.getClose() < firstCandle.getClose();

            if (firstCandleBearish && middleCandlesInsideRange && fifthCandleBearish) {
                fallingThreePatterns.add(fifthCandle);
            }
        }
        return fallingThreePatterns;
    }


    @Override
    public List<CandleStick> getRisingThreePatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> risingThreePatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) { // Bắt đầu từ nến thứ 5
            CandleStick firstCandle = candles.get(i - 4);
            CandleStick secondCandle = candles.get(i - 3);
            CandleStick thirdCandle = candles.get(i - 2);
            CandleStick fourthCandle = candles.get(i - 1);
            CandleStick fifthCandle = candles.get(i);

            // Kiểm tra nến đầu tiên là nến tăng mạnh
            boolean firstCandleBullish = firstCandle.getClose() > firstCandle.getOpen();

            // Kiểm tra 3 nến giữa là nến giảm và nằm trong phạm vi thân nến đầu tiên
            boolean middleCandlesBearish = secondCandle.getClose() < secondCandle.getOpen() &&
                    thirdCandle.getClose() < thirdCandle.getOpen() &&
                    fourthCandle.getClose() < fourthCandle.getOpen();

            boolean middleCandlesInsideRange = secondCandle.getHigh() <= firstCandle.getClose() &&
                    secondCandle.getLow() >= firstCandle.getOpen() &&
                    thirdCandle.getHigh() <= firstCandle.getClose() &&
                    thirdCandle.getLow() >= firstCandle.getOpen() &&
                    fourthCandle.getHigh() <= firstCandle.getClose() &&
                    fourthCandle.getLow() >= firstCandle.getOpen();

            // Kiểm tra nến cuối cùng là nến tăng mạnh, với điều kiện mở cửa và đóng cửa hợp lệ
            boolean fifthCandleBullish = fifthCandle.getClose() > fifthCandle.getOpen() &&
                    fifthCandle.getClose() > firstCandle.getClose() &&
                    fifthCandle.getOpen() > firstCandle.getOpen();

            // Nếu tất cả các điều kiện đều đúng, thêm nến cuối vào danh sách
            if (firstCandleBullish && middleCandlesBearish && middleCandlesInsideRange && fifthCandleBullish) {
                risingThreePatterns.add(fifthCandle);
            }
        }
        return risingThreePatterns;
    }


    @Override
    public List<CandleStick> getDownsideTasukiGapPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> downsideTasukiGapPatterns = new ArrayList<>();

        for (int i = 2; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            // Kiểm tra khoảng trống giảm giá
            boolean isGapDown = secondCandle.getOpen() < firstCandle.getClose();

            // Hai nến đầu tiên phải là nến giảm
            boolean firstCandleBearish = firstCandle.getClose() < firstCandle.getOpen();
            boolean secondCandleBearish = secondCandle.getClose() < secondCandle.getOpen();

            // Nến thứ ba tăng giá, cố gắng lấp đầy khoảng trống nhưng không vượt qua mức mở cửa nến thứ hai
            boolean thirdCandleBullish = thirdCandle.getClose() > thirdCandle.getOpen() &&
                    thirdCandle.getClose() < secondCandle.getOpen();

            if (isGapDown && firstCandleBearish && secondCandleBearish && thirdCandleBullish) {
                downsideTasukiGapPatterns.add(thirdCandle);
            }
        }
        return downsideTasukiGapPatterns;
    }

    @Override
    public List<CandleStick> getUpsideGapTwoCrowsPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> upsideGapTwoCrowsPatterns = new ArrayList<>();

        for (int i = 2; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            // Kiểm tra nến đầu tiên là nến tăng mạnh
            double bodySize = Math.abs(firstCandle.getClose() - firstCandle.getOpen());
            double totalHeight = firstCandle.getHigh() - firstCandle.getLow();
            double upperWick = firstCandle.getHigh() - Math.max(firstCandle.getClose(), firstCandle.getOpen());
            double lowerWick = Math.min(firstCandle.getClose(), firstCandle.getOpen()) - firstCandle.getLow();
            boolean isFirstBullish = firstCandle.getClose() > firstCandle.getOpen() &&
                    bodySize >= 0.6 * totalHeight &&
                    upperWick <= 0.2 * bodySize &&
                    lowerWick <= 0.2 * bodySize;

            // Kiểm tra nến thứ hai là nến giảm với khoảng trống tăng giá (gap up)
            boolean isSecondBearish = secondCandle.getClose() < secondCandle.getOpen();
            boolean isGapUp = secondCandle.getOpen() > firstCandle.getClose() &&
                    secondCandle.getClose() > firstCandle.getClose();

            // Kiểm tra nến thứ ba là nến giảm với giá đóng cửa thấp hơn nến thứ hai
            boolean isThirdBearish = thirdCandle.getClose() < thirdCandle.getOpen();
            boolean closesBelowSecond = thirdCandle.getClose() < secondCandle.getClose();
            boolean closesAboveFirst = thirdCandle.getClose() > firstCandle.getClose();

            // Kiểm tra bối cảnh: Xuất hiện trong xu hướng tăng
            boolean isUptrend = (i >= 3 && candles.get(i - 3).getClose() < firstCandle.getClose());

            if (isFirstBullish && isSecondBearish && isGapUp && isThirdBearish &&
                    closesBelowSecond && closesAboveFirst && isUptrend) {
                upsideGapTwoCrowsPatterns.add(thirdCandle);
            }
        }

        return upsideGapTwoCrowsPatterns;
    }

    @Override
    public List<CandleStick> getUpsideTasukiGapPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);

        List<CandleStick> upsideTasukiGapPatterns = new ArrayList<>();

        for (int i = 2; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            // Kiểm tra khoảng trống tăng giá
            boolean isGapUp = secondCandle.getOpen() > firstCandle.getClose();

            // Hai nến đầu tiên phải là nến tăng
            boolean firstCandleBullish = firstCandle.getClose() > firstCandle.getOpen();
            boolean secondCandleBullish = secondCandle.getClose() > secondCandle.getOpen();

            // Nến thứ ba giảm giá, cố gắng lấp đầy khoảng trống nhưng không vượt qua mức mở cửa nến thứ hai
            boolean thirdCandleBearish = thirdCandle.getClose() < thirdCandle.getOpen() &&
                    thirdCandle.getClose() > secondCandle.getOpen();

            if (isGapUp && firstCandleBullish && secondCandleBullish && thirdCandleBearish) {
                upsideTasukiGapPatterns.add(thirdCandle);
            }
        }
        return upsideTasukiGapPatterns;
    }

    @Override
    public List<CandleStick> getEveningStarDojiPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> eveningStarDojiPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i-2);
            CandleStick secondCandle = candles.get(i-1);
            CandleStick thirdCandle = candles.get(i);

            // Kiểm tra nến thứ nhất là nến tăng mạnh
            boolean firstCandleBullish = firstCandle.getClose() > firstCandle.getOpen();

            // Kiểm tra nến thứ hai là Doji
            double secondCandleBodySize = Math.abs(secondCandle.getClose() - secondCandle.getOpen());
            double secondCandleTotalRange = secondCandle.getHigh() - secondCandle.getLow();
            boolean secondCandleDoji = secondCandleTotalRange > 0 && 
                    secondCandleBodySize <= 0.1 * secondCandleTotalRange;

            // Kiểm tra nến thứ ba là nến giảm mạnh, đóng cửa thấp hơn 50% thân nến thứ nhất
            boolean thirdCandleBearish = thirdCandle.getClose() < thirdCandle.getOpen();
            boolean closesBelowHalfFirstCandle = thirdCandle.getClose() <
                    (firstCandle.getOpen() + (firstCandle.getClose() - firstCandle.getOpen()) / 2);

            // Kiểm tra bối cảnh: Xuất hiện sau một xu hướng tăng
            CandleStick prevCandle = candles.get(i - 3);
            boolean isUptrend = prevCandle.getClose() > prevCandle.getOpen() && firstCandleBullish;

            if (isUptrend && secondCandleDoji && thirdCandleBearish && closesBelowHalfFirstCandle) {
                eveningStarDojiPatterns.add(thirdCandle);
            }
        }
        return eveningStarDojiPatterns;
    }

    @Override
    public List<CandleStick> getMorningStarDojiPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> morningStarDojiPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            // Kiểm tra nến đầu tiên là nến giảm mạnh (Bearish)
            boolean firstCandleBearish = firstCandle.getClose() < firstCandle.getOpen();

            // Kiểm tra nến thứ hai là Doji
            double secondCandleBodySize = Math.abs(secondCandle.getClose() - secondCandle.getOpen());
            double secondCandleTotalRange = secondCandle.getHigh() - secondCandle.getLow();
            boolean secondCandleDoji = secondCandleTotalRange > 0 && 
                    secondCandleBodySize <= 0.1 * secondCandleTotalRange;

            // Kiểm tra nến thứ ba là nến tăng mạnh, đóng cửa cao hơn nến đầu tiên
            boolean thirdCandleBullish = thirdCandle.getClose() > thirdCandle.getOpen();
            boolean closesAboveFirstCandle = thirdCandle.getClose() > firstCandle.getClose();

            // Kiểm tra bối cảnh: Xuất hiện sau một xu hướng giảm (FIXED: was checking for uptrend)
            CandleStick prevCandle = candles.get(i - 3);
            boolean isDowntrend = prevCandle.getClose() < prevCandle.getOpen() || firstCandleBearish;

            // Điều kiện để nhận diện mẫu Morning Star Doji
            if (isDowntrend && firstCandleBearish && secondCandleDoji && thirdCandleBullish && closesAboveFirstCandle) {
                morningStarDojiPatterns.add(thirdCandle);
            }
        }
        return morningStarDojiPatterns;
    }

    @Override
    public List<CandleStick> getBearishTriStarPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> bearishTriStarPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            // Kiểm tra cả 3 nến đều là Doji
            double firstBodySize = Math.abs(firstCandle.getClose() - firstCandle.getOpen());
            double firstTotalRange = firstCandle.getHigh() - firstCandle.getLow();
            boolean firstCandleDoji = firstTotalRange > 0 && firstBodySize <= 0.1 * firstTotalRange;

            double secondBodySize = Math.abs(secondCandle.getClose() - secondCandle.getOpen());
            double secondTotalRange = secondCandle.getHigh() - secondCandle.getLow();
            boolean secondCandleDoji = secondTotalRange > 0 && secondBodySize <= 0.1 * secondTotalRange;

            double thirdBodySize = Math.abs(thirdCandle.getClose() - thirdCandle.getOpen());
            double thirdTotalRange = thirdCandle.getHigh() - thirdCandle.getLow();
            boolean thirdCandleDoji = thirdTotalRange > 0 && thirdBodySize <= 0.1 * thirdTotalRange;

            // Nến giữa phải có giá cao hơn 2 nến bên cạnh (forming a peak)
            boolean secondIsHigher = secondCandle.getHigh() > firstCandle.getHigh() &&
                    secondCandle.getHigh() > thirdCandle.getHigh();

            // Kiểm tra bối cảnh: Xuất hiện sau một xu hướng tăng
            CandleStick prevCandle = candles.get(i - 3);
            boolean isUptrend = prevCandle.getClose() > prevCandle.getOpen();

            // Điều kiện để nhận diện mẫu Bearish Tri-Star
            if (isUptrend && firstCandleDoji && secondCandleDoji && thirdCandleDoji && secondIsHigher) {
                bearishTriStarPatterns.add(thirdCandle);
            }
        }
        return bearishTriStarPatterns;
    }


    @Override
    public List<CandleStick> getBullishTriStarPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> bullishTriStarPatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 2);
            CandleStick secondCandle = candles.get(i - 1);
            CandleStick thirdCandle = candles.get(i);

            // Kiểm tra cả 3 nến đều là Doji
            double firstBodySize = Math.abs(firstCandle.getClose() - firstCandle.getOpen());
            double firstTotalRange = firstCandle.getHigh() - firstCandle.getLow();
            boolean firstCandleDoji = firstTotalRange > 0 && firstBodySize <= 0.1 * firstTotalRange;

            double secondBodySize = Math.abs(secondCandle.getClose() - secondCandle.getOpen());
            double secondTotalRange = secondCandle.getHigh() - secondCandle.getLow();
            boolean secondCandleDoji = secondTotalRange > 0 && secondBodySize <= 0.1 * secondTotalRange;

            double thirdBodySize = Math.abs(thirdCandle.getClose() - thirdCandle.getOpen());
            double thirdTotalRange = thirdCandle.getHigh() - thirdCandle.getLow();
            boolean thirdCandleDoji = thirdTotalRange > 0 && thirdBodySize <= 0.1 * thirdTotalRange;

            // Nến giữa phải có giá thấp hơn 2 nến bên cạnh (forming a valley)
            boolean secondIsLower = secondCandle.getLow() < firstCandle.getLow() &&
                    secondCandle.getLow() < thirdCandle.getLow();

            // Kiểm tra bối cảnh: Xuất hiện sau một xu hướng giảm
            CandleStick prevCandle = candles.get(i - 3);
            boolean isDowntrend = prevCandle.getClose() < prevCandle.getOpen();

            // Điều kiện để nhận diện mẫu Bullish Tri-Star
            if (isDowntrend && firstCandleDoji && secondCandleDoji && thirdCandleDoji && secondIsLower) {
                bullishTriStarPatterns.add(thirdCandle);
            }
        }
        return bullishTriStarPatterns;
    }

    @Override
    public List<CandleStick> getMatchingLowPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> matchingLowPatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Kiểm tra nến đầu tiên là nến giảm
            boolean isFirstBearish = firstCandle.getClose() < firstCandle.getOpen();

            // Kiểm tra giá đóng cửa của hai nến bằng hoặc gần bằng nhau (tolerance 0.3%)
            double avgClose = (firstCandle.getClose() + secondCandle.getClose()) / 2;
            boolean isMatchingLow = avgClose > 0 && 
                    Math.abs(firstCandle.getClose() - secondCandle.getClose()) <= avgClose * 0.003;

            // Kiểm tra bối cảnh: Xuất hiện trong xu hướng giảm
            boolean isDowntrend = (i >= 2 && candles.get(i - 2).getClose() > firstCandle.getClose());

            if (isFirstBearish && isMatchingLow && isDowntrend) {
                matchingLowPatterns.add(secondCandle);
            }
        }

        return matchingLowPatterns;
    }

    @Override
    public List<CandleStick> getMatchingHighPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> matchingHighPatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Kiểm tra nến đầu tiên là nến tăng
            boolean isFirstBullish = firstCandle.getClose() > firstCandle.getOpen();

            // Kiểm tra giá đóng cửa của hai nến bằng hoặc gần bằng nhau (tolerance 0.3%)
            double avgClose = (firstCandle.getClose() + secondCandle.getClose()) / 2;
            boolean isMatchingHigh = avgClose > 0 && 
                    Math.abs(firstCandle.getClose() - secondCandle.getClose()) <= avgClose * 0.003;

            // Kiểm tra bối cảnh: Xuất hiện trong xu hướng tăng
            boolean isUptrend = (i >= 2 && candles.get(i - 2).getClose() < firstCandle.getClose());

            if (isFirstBullish && isMatchingHigh && isUptrend) {
                matchingHighPatterns.add(secondCandle);
            }
        }

        return matchingHighPatterns;
    }

    @Override
    public List<CandleStick> getBearishBeltHold(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> bearishBeltHoldCandles = new ArrayList<>();

        for (CandleStick candle : candles) {
            double totalRange = candle.getHigh() - candle.getLow();
            if (totalRange == 0) continue; // Avoid division by zero
            
            double bodySize = candle.getOpen() - candle.getClose();
            double upperShadow = candle.getHigh() - candle.getOpen();

            // Điều kiện Bearish Belt Hold
            // Thân nến lớn (giảm), bóng trên rất ngắn hoặc không có, nến mở tại giá cao
            if (bodySize > 0 && // Nến giảm
                    bodySize >= 0.7 * totalRange && // Thân nến lớn
                    upperShadow <= 0.1 * totalRange) { // Bóng trên rất ngắn
                bearishBeltHoldCandles.add(candle);
            }
        }
        return bearishBeltHoldCandles;
    }

    @Override
    public List<CandleStick> getBullishBeltHold(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> bullishBeltHoldCandles = new ArrayList<>();

        for (CandleStick candle : candles) {
            double totalRange = candle.getHigh() - candle.getLow();
            if (totalRange == 0) continue; // Avoid division by zero
            
            double bodySize = candle.getClose() - candle.getOpen();
            double lowerShadow = candle.getOpen() - candle.getLow();

            // Điều kiện Bullish Belt Hold
            // Thân nến lớn (tăng), bóng dưới rất ngắn hoặc không có, nến mở tại giá thấp
            if (bodySize > 0 && // Nến tăng
                    bodySize >= 0.7 * totalRange && // Thân nến lớn
                    lowerShadow <= 0.1 * totalRange) { // Bóng dưới rất ngắn
                bullishBeltHoldCandles.add(candle);
            }
        }
        return bullishBeltHoldCandles;
    }


    @Override
    public List<CandleStick> getBearishThreeLineStrikePatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> bearishThreeLineStrikePatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 3);
            CandleStick secondCandle = candles.get(i - 2);
            CandleStick thirdCandle = candles.get(i - 1);
            CandleStick fourthCandle = candles.get(i);

            // Kiểm tra 3 nến đầu tiên là nến tăng liên tiếp
            boolean firstThreeBullish = firstCandle.getClose() > firstCandle.getOpen() &&
                    secondCandle.getClose() > secondCandle.getOpen() &&
                    thirdCandle.getClose() > thirdCandle.getOpen();

            boolean consecutiveHigherCloses = firstCandle.getClose() < secondCandle.getClose() &&
                    secondCandle.getClose() < thirdCandle.getClose();

            // Kiểm tra nến thứ 4 là nến giảm mạnh vượt qua toàn bộ 3 nến trước đó
            boolean fourthBearish = fourthCandle.getClose() < fourthCandle.getOpen() &&
                    fourthCandle.getOpen() > thirdCandle.getClose() &&
                    fourthCandle.getClose() < firstCandle.getOpen();

            if (firstThreeBullish && consecutiveHigherCloses && fourthBearish) {
                bearishThreeLineStrikePatterns.add(fourthCandle);
            }
        }

        return bearishThreeLineStrikePatterns;
    }

    @Override
    public List<CandleStick> getBearishHaramiCrossPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> bearishHaramiCrossPatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Điều kiện Bearish Harami Cross
            // Cây nến đầu tiên tăng mạnh
            boolean firstCandleBullish = firstCandle.getClose() > firstCandle.getOpen();
            
            // Cây nến thứ hai là Doji
            double secondTotalRange = secondCandle.getHigh() - secondCandle.getLow();
            boolean secondCandleDoji = secondTotalRange > 0 && 
                    Math.abs(secondCandle.getClose() - secondCandle.getOpen()) <= 0.1 * secondTotalRange;
            
            // Doji nằm hoàn toàn trong thân nến đầu tiên (kiểm tra cả high và low)
            boolean withinFirstBody = secondCandle.getHigh() <= firstCandle.getClose() &&
                    secondCandle.getLow() >= firstCandle.getOpen();

            if (firstCandleBullish && secondCandleDoji && withinFirstBody) {
                bearishHaramiCrossPatterns.add(secondCandle);
            }
        }
        return bearishHaramiCrossPatterns;
    }

    @Override
    public List<CandleStick> getBullishHaramiCrossPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> bullishHaramiCrossPatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Điều kiện Bullish Harami Cross
            // Cây nến đầu tiên giảm mạnh
            boolean firstCandleBearish = firstCandle.getClose() < firstCandle.getOpen();
            
            // Cây nến thứ hai là Doji
            double secondTotalRange = secondCandle.getHigh() - secondCandle.getLow();
            boolean secondCandleDoji = secondTotalRange > 0 && 
                    Math.abs(secondCandle.getClose() - secondCandle.getOpen()) <= 0.1 * secondTotalRange;
            
            // Doji nằm hoàn toàn trong thân nến đầu tiên (kiểm tra cả high và low)
            boolean withinFirstBody = secondCandle.getHigh() <= firstCandle.getOpen() &&
                    secondCandle.getLow() >= firstCandle.getClose();

            if (firstCandleBearish && secondCandleDoji && withinFirstBody) {
                bullishHaramiCrossPatterns.add(secondCandle);
            }
        }
        return bullishHaramiCrossPatterns;
    }

    @Override
    public List<CandleStick> getBearishCounterattackPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> bearishCounterattackPatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Điều kiện Bearish Counterattack
            // Cây nến đầu tiên là nến tăng
            boolean firstCandleBullish = firstCandle.getClose() > firstCandle.getOpen();
            // Cây nến thứ hai là nến giảm
            boolean secondCandleBearish = secondCandle.getClose() < secondCandle.getOpen();
            // Giá đóng cửa của cây nến thứ hai gần bằng giá đóng cửa của cây nến đầu tiên
            boolean closeProximity = Math.abs(secondCandle.getClose() - firstCandle.getClose()) <= 0.05 * (firstCandle.getHigh() - firstCandle.getLow());

            if (firstCandleBullish && secondCandleBearish && closeProximity) {
                bearishCounterattackPatterns.add(secondCandle);
            }
        }
        return bearishCounterattackPatterns;
    }

    @Override
    public List<CandleStick> getBullishCounterattackPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> bullishCounterattackPatterns = new ArrayList<>();

        for (int i = 1; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 1);
            CandleStick secondCandle = candles.get(i);

            // Điều kiện Bullish Counterattack
            // Cây nến đầu tiên là nến giảm
            boolean firstCandleBearish = firstCandle.getClose() < firstCandle.getOpen();
            // Cây nến thứ hai là nến tăng
            boolean secondCandleBullish = secondCandle.getClose() > secondCandle.getOpen();
            // Giá đóng cửa của cây nến thứ hai gần bằng giá đóng cửa của cây nến đầu tiên
            boolean closeProximity = Math.abs(secondCandle.getClose() - firstCandle.getClose()) <= 0.05 * (firstCandle.getHigh() - firstCandle.getLow());

            if (firstCandleBearish && secondCandleBullish && closeProximity) {
                bullishCounterattackPatterns.add(secondCandle);
            }
        }
        return bullishCounterattackPatterns;
    }


    @Override
    public List<CandleStick> getBullishThreeLineStrikePatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> bullishThreeLineStrikePatterns = new ArrayList<>();

        for (int i = 3; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 3);
            CandleStick secondCandle = candles.get(i - 2);
            CandleStick thirdCandle = candles.get(i - 1);
            CandleStick fourthCandle = candles.get(i);

            // Kiểm tra 3 nến đầu tiên là nến giảm liên tiếp
            boolean firstThreeBearish = firstCandle.getClose() < firstCandle.getOpen() &&
                    secondCandle.getClose() < secondCandle.getOpen() &&
                    thirdCandle.getClose() < thirdCandle.getOpen();

            boolean consecutiveLowerCloses = firstCandle.getClose() > secondCandle.getClose() &&
                    secondCandle.getClose() > thirdCandle.getClose();

            // Kiểm tra nến thứ 4 là nến tăng mạnh vượt qua toàn bộ 3 nến trước đó
            boolean fourthBullish = fourthCandle.getClose() > fourthCandle.getOpen() &&
                    fourthCandle.getOpen() < thirdCandle.getClose() &&
                    fourthCandle.getClose() > firstCandle.getOpen();

            if (firstThreeBearish && consecutiveLowerCloses && fourthBullish) {
                bullishThreeLineStrikePatterns.add(fourthCandle);
            }
        }

        return bullishThreeLineStrikePatterns;
    }

    @Override
    public List<CandleStick> getLadderTopPatterns(String stockId) {
        List<CandleStick> candles = candleStickRepository.getByStockId(stockId);
        List<CandleStick> ladderTopPatterns = new ArrayList<>();

        for (int i = 4; i < candles.size(); i++) {
            CandleStick firstCandle = candles.get(i - 4);
            CandleStick secondCandle = candles.get(i - 3);
            CandleStick thirdCandle = candles.get(i - 2);
            CandleStick fourthCandle = candles.get(i - 1);
            CandleStick fifthCandle = candles.get(i);

            // Điều kiện nến 1, 2, 3: Nến tăng
            boolean firstThreeBullish = firstCandle.getClose() > firstCandle.getOpen() &&
                    secondCandle.getClose() > secondCandle.getOpen() &&
                    thirdCandle.getClose() > thirdCandle.getOpen();

            // Điều kiện nến 4: Nến tăng yếu hoặc Doji
            boolean fourthCandleWeak = fourthCandle.getClose() > fourthCandle.getOpen() &&
                    (fourthCandle.getClose() - fourthCandle.getOpen()) <
                            (secondCandle.getClose() - secondCandle.getOpen()) * 0.5;

            // Điều kiện nến 5: Nến giảm mạnh
            boolean fifthCandleBearish = fifthCandle.getClose() < fifthCandle.getOpen() &&
                    fifthCandle.getClose() < fourthCandle.getOpen();

            if (firstThreeBullish && fourthCandleWeak && fifthCandleBearish) {
                ladderTopPatterns.add(fifthCandle);
            }
        }

        return ladderTopPatterns;
    }


}

