# Cup with Handle Pattern Detection - Implementation Summary

## Tổng Quan
Đã triển khai hoàn toàn logic phát hiện mẫu nến **Cup with Handle** theo thuật toán từ file `cup_with_handle.groovy`. Logic được chuyển sang cả client-side (React) và backend (Java Spring Boot).

## Thay Đổi Chi Tiết

### 1. Client-Side (React)

#### 1.1 File Mới: `cupWithHandleDetector.js`
- **Đường dẫn**: `client-service/react-client/src/services/cupWithHandleDetector.js`
- **Chức năng**: Phát hiện mẫu Cup with Handle hoàn toàn trên client-side
- **Thuật toán**:
  - Tìm pivot highs (đỉnh) trong dữ liệu giá
  - Duyệt qua các cặp pivot (left high và right high) để tìm cốc
  - Tính toán boundaries của cốc sử dụng hàm cosine (tạo hình chữ U)
  - Kiểm tra breaks above/below boundaries
  - Xác định handle (tay cầm) sau right high
  - Validate các điều kiện về độ rộng, độ sâu, góc nghiêng
- **Parameters**:
  - `left = 3`: Số bar bên trái pivot
  - `right = 1`: Số bar bên phải pivot
  - `prcAngle = 0.22`: Góc nghiêng tối đa (22%)
  - `prcOfCupT = 0.22`: Phần trăm điều chỉnh đường trên (22%)
  - `prcOfCupB = 0.22`: Phần trăm điều chỉnh đường dưới (22%)
  - `maxHighs = 0.20`: Phần trăm breaks trên tối đa (20%)
  - `maxLows = 0.20`: Phần trăm breaks dưới tối đa (20%)
  - `minCupWidth = 25`: Độ rộng cốc tối thiểu
  - `maxCupWidth = 130`: Độ rộng cốc tối đa
  - `maxHighDiff = 0.10`: Chênh lệch giữa 2 đỉnh tối đa (10%)
  - `maxHandleDepth = 0.33`: Độ sâu handle tối đa (33%)

#### 1.2 Cập Nhật: `patternDetectionService.js`
- Import `detectCupWithHandlePattern` từ `cupWithHandleDetector.js`
- Thêm `'cup_with_handle': detectCupWithHandlePattern` vào `PATTERN_DETECTORS`
- Cup with Handle giờ được phát hiện hoàn toàn trên client-side

#### 1.3 Cập Nhật: `StockChart.jsx`
- **Hàm mới**: `collectCupWithHandleData(pattern, abbreviation, patternName)`
  - Vẽ đường boundary trên và dưới của cốc
  - Tạo area series để tô màu vùng cốc (màu vàng nhạt)
  - Vẽ đường handle (màu cam, kiểu dashed)
  - Tạo area series để tô màu vùng handle
  - Đánh dấu left high (L), right high (R), và điểm breakout
  
- **Cập nhật**: `collectComplexPatternData()`
  - Thêm điều kiện kiểm tra `pattern.cupBoundaryPoints` để nhận diện Cup with Handle
  
- **Cập nhật**: Render logic cho area series
  - Hỗ trợ vẽ area series (vùng tô màu) ngoài line series
  - Kiểm tra `lineData.options.type === 'area'` để tạo `addAreaSeries`

#### 1.4 Visualization
- **Vùng cốc (Cup)**: Tô màu vàng nhạt (`rgba(255, 193, 7, 0.15)`) với 2 đường boundary
- **Vùng tay cầm (Handle)**: Tô màu cam nhạt (`rgba(255, 152, 0, 0.2)`) với đường dashed
- **Markers**:
  - L: Left high (đỉnh trái)
  - R: Right high (đỉnh phải)
  - CWH: Cup With Handle marker tại điểm breakout (mũi tên xanh lá)

### 2. Backend (Java Spring Boot)

#### 2.1 Cập Nhật: `CupWithHandle.java`
- **Đường dẫn**: `alert-service/src/main/java/com/example/alert/model/CupWithHandle.java`
- **Thay đổi**:
  - Sử dụng `@Data` từ Lombok để tự động generate getters/setters
  - Thêm các trường mới:
    - `leftHighTime`, `rightHighTime`, `dipTime`, `handleLowTime`, `handleEndTime`: Timestamps
    - `cupWidth`, `cupHeight`, `handleDepth`, `handleWidth`: Metrics
    - `breaksTop`, `breaksBottom`: Số lượng breaks
    - `cupBoundaryPoints`: List các điểm boundary để vẽ cup
    - `candleIndex`, `sentiment`: Metadata cho visualization
  - **Inner class**: `CupBoundaryPoint` với `index`, `time`, `topValue`, `bottomValue`

#### 2.2 Cập Nhật: `ComplexPatternDetectorServiceImpl.java`
- **Đường dẫn**: `alert-service/src/main/java/com/example/alert/service/impl/ComplexPatternDetectorServiceImpl.java`
- **Thay đổi**:
  - Viết lại hoàn toàn thuật toán theo logic từ Groovy
  - Nhận `List<CandleStick>` thay vì `List<Double> smaValues`
  - Các helper classes:
    - `PivotPoint`: Lưu trữ index và value của pivot
    - `CupBoundary`: Lưu trữ topValue và bottomValue
    - `BreakCheckResult`: Lưu trữ kết quả kiểm tra breaks
  - **Helper methods**:
    - `findPivotHighs()`: Tìm các pivot highs
    - `findLowestInRange()`: Tìm điểm thấp nhất trong khoảng
    - `checkBreakAbove()`: Kiểm tra break trên đường nối
    - `calculateCupBoundaries()`: Tính boundaries sử dụng hàm cosine
    - `countBoundaryBreaks()`: Đếm số lượng breaks
  - Trả về `CupWithHandle` với đầy đủ dữ liệu boundary points

#### 2.3 Cập Nhật: `ComplexPatternDetectorService.java`
- **Đường dẫn**: `alert-service/src/main/java/com/example/alert/service/ComplexPatternDetectorService.java`
- Thay đổi signature method: `CupWithHandle getNearestCupWithHandle(List<CandleStick> candles)`

#### 2.4 Cập Nhật: `AlterController.java`
- **Đường dẫn**: `alert-service/src/main/java/com/example/alert/controller/AlterController.java`
- Loại bỏ việc tính SMA, truyền trực tiếp `List<CandleStick>` vào service

## Cách Thuật Toán Hoạt Động

### Bước 1: Tìm Pivot Highs
- Duyệt qua dữ liệu giá, tìm các local maxima (đỉnh cục bộ)
- Một điểm là pivot high nếu nó cao hơn `left` bars bên trái và `right` bars bên phải

### Bước 2: Xác Định Cốc (Cup)
- Duyệt qua các cặp pivot (left high và right high)
- Kiểm tra điều kiện:
  - Độ rộng cốc trong khoảng [25, 130] bars
  - Right high cao hơn left high một chút
  - Góc nghiêng giữa 2 đỉnh < 22% của chiều cao cốc
  - Không có bar nào break trên đường nối 2 đỉnh

### Bước 3: Tính Boundaries
- Sử dụng hàm cosine để tạo hình chữ U mượt mà
- Công thức: `cos(π/cupWidth * d)` với d từ 0 đến cupWidth
- Điều chỉnh bằng phần trăm để tạo vùng tolerance

### Bước 4: Kiểm Tra Breaks
- Đếm số lượng bars break trên/dưới boundaries
- Nếu vượt quá ngưỡng (20%), loại bỏ pattern

### Bước 5: Xác Định Handle
- Tìm vùng consolidation sau right high
- Handle phải:
  - Có độ rộng tối thiểu
  - Độ sâu < 33% chiều cao cốc
  - Drift xuống (không tăng quá 2%)

### Bước 6: Validation
- Kiểm tra độ chênh lệch giữa 2 đỉnh < 10%
- Kiểm tra độ rộng và độ sâu cốc hợp lệ

## Kết Quả

### Ưu Điểm
1. **Phát hiện chính xác**: Thuật toán dựa trên TradingView, đã được kiểm chứng
2. **Visualization rõ ràng**: Tô màu vùng cup và handle, dễ nhận biết
3. **Client-side detection**: Giảm tải server, tăng tốc độ phản hồi
4. **Flexible parameters**: Có thể tinh chỉnh các thông số phát hiện

### Hạn Chế
1. **Chỉ trả về 1 pattern**: Hiện tại chỉ trả về pattern gần nhất
2. **Performance**: Với dữ liệu lớn, việc tìm pivot có thể chậm
3. **False positives**: Cần tinh chỉnh parameters cho từng loại cổ phiếu

## Testing

### Để test pattern detection:
1. Chọn một cổ phiếu có xu hướng tăng sau khi giảm
2. Chọn pattern "Cup With Handle" từ dropdown
3. Quan sát:
   - Vùng màu vàng nhạt: Cốc
   - Vùng màu cam nhạt: Tay cầm
   - Markers L và R: Hai đỉnh
   - Mũi tên xanh: Điểm breakout

### Ví dụ tốt:
- Cổ phiếu có uptrend -> downtrend -> uptrend
- Tạo hình chữ U rõ ràng
- Handle ngắn và nông (< 33% cup height)

## Tài Liệu Tham Khảo
- File gốc: `cup_with_handle.groovy` (TradingView Pine Script)
- Lightweight Charts: https://tradingview.github.io/lightweight-charts/

## Lưu Ý
- Pattern này là **bullish continuation pattern** (mẫu tiếp tục xu hướng tăng)
- Tín hiệu mua khi giá breakout khỏi handle
- Stop loss nên đặt dưới handle low
- Target = Cup height + Breakout point
