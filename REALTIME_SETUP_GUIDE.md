# Real-time Candlestick Pattern Detection System

## 🎯 Tổng quan

Hệ thống phát hiện mô hình nến real-time sử dụng:
- **Backend**: Spring Boot với WebSocket (STOMP)
- **Data Service**: Python Flask với vnstock
- **Frontend**: Lightweight Charts với SockJS/STOMP
- **Database**: MongoDB

## 🏗️ Kiến trúc

```
Client (Browser) <--WebSocket--> Alert Service (Java) <--REST API--> Data Service (Python/vnstock)
                                           |
                                           v
                                      MongoDB
```

## 📦 Cài đặt

### 1. Data Service (Python)

```bash
cd data-service
pip install -r requirements.txt
python app.py
```

Server sẽ chạy ở: `http://localhost:5000`

### 2. Alert Service (Java)

```bash
cd alert-service
./mvnw spring-boot:run
```

Server sẽ chạy ở: `http://localhost:60`

### 3. Client Service

Mở file `client-service/realtime.html` trong trình duyệt

## 🚀 Cách sử dụng

### Bước 1: Khởi động Python Data Service

```bash
cd data-service
python app.py
```

### Bước 2: Khởi động Java Alert Service

```bash
cd alert-service
./mvnw spring-boot:run
```

### Bước 3: Mở giao diện web

1. Mở `client-service/realtime.html` trong trình duyệt
2. Chọn mã cổ phiếu (VIC, VNM, FPT, HPG)
3. Chọn mô hình nến muốn theo dõi
4. Click "Connect" để kết nối WebSocket
5. Click "Start Watching" để bắt đầu theo dõi

### Luồng hoạt động

1. **Kết nối WebSocket**: Client kết nối tới `ws://localhost:60/ws-pattern-detection`
2. **Chọn mô hình**: User chọn pattern và gửi qua `/app/watch-pattern/{symbol}`
3. **Scheduled Task**: Mỗi 5 giây, Alert Service gọi Data Service để lấy 5 nến mới nhất
4. **Phân tích**: Alert Service phân tích pattern trên 5 nến
5. **Broadcast**: Nếu phát hiện pattern, broadcast qua `/topic/updates/{symbol}`
6. **Hiển thị**: Client nhận được update và hiển thị trên chart

## 📊 API Endpoints

### Data Service (Python)

#### GET `/intraday/<symbol>`
Lấy dữ liệu intraday

**Parameters:**
- `symbol`: Mã cổ phiếu (VD: VIC)
- `limit`: Số lượng nến (default: 5)

**Response:**
```json
[
  {
    "time": "2025-10-20 09:30:00",
    "open": 45500,
    "high": 45700,
    "low": 45400,
    "close": 45600,
    "volume": 1000000
  }
]
```

#### GET `/health`
Health check endpoint

### Alert Service (Java)

#### WebSocket Endpoints

**Connect**: `/ws-pattern-detection`

**Subscribe**: `/topic/updates/{symbol}`

**Send**: `/app/watch-pattern/{symbol}`

**Payload:**
```json
{
  "patternName": "hammer"
}
```

## 🔧 Configuration

### application.properties

```properties
# Server
server.port=60

# MongoDB
spring.data.mongodb.uri=mongodb://localhost:27017/candlestick_db

# Data Service
data.service.url=http://localhost:5000

# WebSocket
spring.websocket.allowed-origins=*
```

### Scheduled Update Interval

Trong `RealTimePatternService.java`:
```java
@Scheduled(fixedRate = 5000) // 5 seconds
```

Thay đổi `5000` để điều chỉnh tần suất cập nhật (tính bằng milliseconds)

### Monitored Symbols

Trong `RealTimePatternService.java`:
```java
private static final String[] MONITORED_SYMBOLS = {"VIC", "VNM", "FPT", "HPG"};
```

## 📝 Supported Patterns

### Single Candle Patterns
- Hammer
- Inverted Hammer
- Hanging Man
- Shooting Star
- Doji (Dragonfly, Gravestone, Long-legged)

### Two Candle Patterns
- Bullish/Bearish Engulfing
- Bullish/Bearish Kicker

### Three Candle Patterns
- Morning/Evening Star
- Three White Soldiers
- Three Black Crows

## 🐛 Troubleshooting

### Lỗi: Cannot connect to WebSocket

**Giải pháp:**
1. Kiểm tra Alert Service đang chạy ở port 60
2. Kiểm tra CORS configuration
3. Xem log trong Console của browser

### Lỗi: No data received

**Giải pháp:**
1. Kiểm tra Data Service đang chạy ở port 5000
2. Test API: `http://localhost:5000/intraday/VIC?limit=5`
3. Kiểm tra vnstock có cài đặt đúng không

### Lỗi: Pattern not detected

**Giải pháp:**
1. Đảm bảo đã chọn pattern trong dropdown
2. Click "Start Watching" sau khi connect
3. Chờ ít nhất 5 giây để system fetch data
4. Xem log trong Console

## 📈 Performance Tips

1. **Giảm update frequency** nếu server quá tải:
   ```java
   @Scheduled(fixedRate = 10000) // 10 seconds thay vì 5
   ```

2. **Giới hạn số symbol theo dõi** để giảm API calls

3. **Cache dữ liệu** để tránh call vnstock quá nhiều

4. **Sử dụng Redis** thay vì in-memory Map cho production

## 🔐 Security Considerations

⚠️ **Lưu ý**: Cấu hình hiện tại phù hợp cho **development only**

Cho **production**, cần:
1. Bật authentication cho WebSocket
2. Giới hạn CORS origins
3. Thêm rate limiting
4. Sử dụng HTTPS/WSS
5. Validate user input

## 📚 Tham khảo

- [Spring WebSocket Documentation](https://spring.io/guides/gs/messaging-stomp-websocket/)
- [vnstock Documentation](https://vnstock.site/)
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
- [STOMP Protocol](https://stomp.github.io/)

## 📧 Support

Nếu gặp vấn đề, hãy:
1. Check logs trong Console
2. Check server logs
3. Xem tài liệu REALTIME_PATTERN_DETECTION.md
