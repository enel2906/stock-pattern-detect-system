# Chart Pattern Detection API

## Tổng quan

Hệ thống này đã được tích hợp thêm các thuật toán phát hiện mô hình nến (Chart Patterns) dựa trên thuật toán Python từ thư viện `chart_patterns`. Hiện tại hỗ trợ 2 loại patterns chính:

1. **Flag Pattern** - Mô hình cờ
2. **Double Pattern** - Mô hình đỉnh đôi/đáy đôi

## API Endpoints

### 1. Chart Pattern Controller (`/chart-patterns`)

#### Phân tích tất cả patterns
```
GET /chart-patterns/{stockSymbol}/analyze
```
Trả về tất cả các patterns được tìm thấy cho một stock symbol.

**Ví dụ:**
```
GET /chart-patterns/AAPL/analyze
```

#### Phân tích Flag patterns
```
GET /chart-patterns/{stockSymbol}/flag
```
Chỉ phân tích Flag patterns với parameters mặc định.

**Ví dụ:**
```
GET /chart-patterns/AAPL/flag
```

#### Phân tích Flag patterns với custom parameters
```
GET /chart-patterns/{stockSymbol}/flag/custom?lookback=30&minPoints=4&rMax=0.95&rMin=0.95
```

**Parameters:**
- `lookback` (default: 25): số periods để look back
- `minPoints` (default: 3): số pivot points tối thiểu
- `rMax` (default: 0.9): R-squared threshold cho high pivot points
- `rMin` (default: 0.9): R-squared threshold cho low pivot points

#### Phân tích Double patterns
```
GET /chart-patterns/{stockSymbol}/double?patternType=both
```

**Parameters:**
- `patternType` (default: both): "tops", "bottoms", hoặc "both"

#### Phân tích Double Tops
```
GET /chart-patterns/{stockSymbol}/double-tops
```

#### Phân tích Double Bottoms
```
GET /chart-patterns/{stockSymbol}/double-bottoms
```

### 2. Alert Controller (tích hợp vào existing endpoint)

Các patterns mới đã được thêm vào endpoint hiện tại:

```
GET /alter/candle-stick/{stockSymbol}?candlePattern={patternName}
```

**Patterns mới:**
- `flag_pattern`: Flag pattern
- `double_tops`: Double tops pattern
- `double_bottoms`: Double bottoms pattern
- `double_pattern`: Cả hai loại double patterns

**Ví dụ:**
```
GET /alter/candle-stick/AAPL?candlePattern=flag_pattern
GET /alter/candle-stick/AAPL?candlePattern=double_tops
```

#### Endpoint mở rộng
```
GET /alter/candle-stick/{stockSymbol}/all-patterns
```
Phân tích tất cả chart patterns.

```
GET /alter/candle-stick/{stockSymbol}/flag-custom?lookback=30&minPoints=4&rMax=0.95&rMin=0.95
```
Flag patterns với custom parameters.

## Response Format

### ChartPatternResult
```json
{
  "stockSymbol": "AAPL",
  "analysisTime": 1609459200000,
  "flagPatterns": [...],
  "doublePatterns": [...],
  "totalPatternsFound": 5
}
```

### FlagPattern
```json
{
  "candleIndex": 150,
  "flagHighs": [100.5, 101.2, 102.1],
  "flagLows": [99.1, 99.8, 100.3],
  "flagHighsIdx": [145, 148, 150],
  "flagLowsIdx": [144, 147, 149],
  "slopeMax": 0.15,
  "slopeMin": 0.14,
  "interceptMin": 98.5,
  "interceptMax": 99.8,
  "rSquaredMax": 0.95,
  "rSquaredMin": 0.93,
  "direction": "bullish"
}
```

### DoublePattern
```json
{
  "candleIndex": 120,
  "doubleType": "tops",
  "pivotIndices": [100, 105, 110, 115, 120],
  "pivotPoints": [95.2, 102.5, 96.8, 102.1, 95.5],
  "ratio": 1.004
}
```

## Thuật toán

### Flag Pattern Detection
- Tìm pivot points trong dữ liệu OHLC
- Sử dụng linear regression để tìm trendlines song song
- Kiểm tra các điều kiện:
  - R-squared tối thiểu cho cả hai trendlines
  - Slope ratio trong khoảng cho phép
  - Số lượng pivot points tối thiểu

### Double Pattern Detection
- Tìm đúng 5 pivot points liên tiếp
- Kiểm tra pattern theo các điều kiện:
  - **Double Tops**: Hai đỉnh gần bằng nhau, các điểm khác thấp hơn
  - **Double Bottoms**: Hai đáy gần bằng nhau, các điểm khác cao hơn
- Tính tỷ lệ giữa hai đỉnh/đáy để xác định độ chính xác

## Cấu trúc Code

```
src/main/java/com/example/alert/
├── controller/
│   ├── ChartPatternController.java    # Controller chuyên dụng cho chart patterns
│   └── AlterController.java           # Controller hiện tại (đã tích hợp)
├── model/chartpattern/
│   ├── OhlcData.java                  # Model dữ liệu OHLC
│   ├── FlagPattern.java               # Model cho Flag pattern
│   ├── DoublePattern.java             # Model cho Double pattern
│   └── ChartPatternResult.java        # Model kết quả tổng hợp
├── service/chartpattern/
│   ├── ChartPatternDetectionService.java  # Service chính
│   ├── FlagPatternService.java            # Service cho Flag pattern
│   └── DoublePatternService.java          # Service cho Double pattern
├── util/chartpattern/
│   ├── PivotPointUtils.java           # Utilities cho pivot points
│   └── LinearRegressionUtils.java     # Utilities cho linear regression
└── constant/
    └── CandleNames.java               # Constants (đã thêm pattern names)
```

## Lưu ý khi sử dụng

1. **Performance**: Việc phân tích patterns có thể tốn thời gian với dataset lớn
2. **Data Quality**: Kết quả phụ thuộc vào chất lượng dữ liệu OHLC
3. **Parameters**: Có thể điều chỉnh parameters để phù hợp với từng loại tài sản
4. **Memory**: Các thuật toán sử dụng memory để lưu trữ intermediate calculations

## Mở rộng

Có thể dễ dàng thêm các patterns khác như:
- Triangle patterns
- Head and Shoulders patterns
- Pennant patterns
- Wedge patterns

Bằng cách implement các service tương tự và thêm vào `ChartPatternDetectionService`.