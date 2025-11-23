# Real-Time Pipeline - Quick Reference Card

## 🚀 Start All Services (4 Terminals)

```powershell
# Terminal 1: RabbitMQ Docker (if not running)
docker start my-rabbit
Start-Sleep -Seconds 5

# Terminal 2: Python Service
cd D:\PNM\Hust\DATN\stock-pattern-detect-system\data-service
python server.py

# Terminal 3: Java Backend
cd D:\PNM\Hust\DATN\stock-pattern-detect-system\alert-service
mvn spring-boot:run

# Terminal 4: React Frontend
cd D:\PNM\Hust\DATN\stock-pattern-detect-system\client-service\react-client
npm run dev
```

## 📦 Install Dependencies (First Time Only)

```powershell
# Python
cd data-service
pip install -r requirements.txt

# Java
cd alert-service
mvn clean install

# Node
cd client-service\react-client
npm install
```

## 🔗 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| React Frontend | http://localhost:5173 | - |
| Python API | http://localhost:8000 | - |
| Java API | http://localhost:60 | - |
| RabbitMQ UI | http://localhost:15672 | guest/guest |
| MongoDB | localhost:27017 | - |

## ✅ Success Indicators

### Python Service ✓
```
INFO:__main__:MongoDB connected successfully
INFO:__main__:RabbitMQ connected successfully
INFO:__main__:Published update for VCB: stock.update.VCB
```

### Java Backend ✓
```
Received stock update for symbol: VCB
Sent stock update to WebSocket topic: /topic/stock-updates/VCB
```

### React Frontend ✓
```
STOMP Debug: Connected
WebSocket connected for symbol: VCB
Received stock update: {symbol: "VCB", ...}
```

## 🧪 Quick Test

1. Open http://localhost:5173
2. Press F12 (Open Console)
3. Select stock "VCB"
4. Wait 60 seconds
5. See console logs and chart update

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| RabbitMQ error | `docker start my-rabbit` |
| RabbitMQ not responding | `docker restart my-rabbit` then wait 5-10 seconds |
| Python import error | `pip install -r requirements.txt` |
| Java build error | `mvn clean install` |
| React error | `npm install` |
| Port 60 in use | Change `server.port` in application.properties |
| Port 8000 in use | Change `PORT` in server.py |
| WebSocket fails | Check CORS in application.properties |

## 📊 Data Flow

```
Every 60s → Python fetches data
         ↓
         RabbitMQ (stock.update.VCB)
         ↓
         Java consumes & forwards
         ↓
         WebSocket (/topic/stock-updates/VCB)
         ↓
         React updates chart
```

## 🔧 Key Files

```
data-service/server.py              # Publisher
alert-service/.../
  RabbitMQConfig.java               # RabbitMQ setup
  WebSocketConfig.java              # WebSocket setup
  StockDataListener.java            # Consumer
client-service/.../StockChart.jsx   # Subscriber
```

## 📝 Configuration

```properties
# Python (server.py)
UPDATE_INTERVAL = 60
RABBITMQ_URI = "amqp://guest:guest@localhost:5672/"

# Java (application.properties)
spring.rabbitmq.host=localhost
server.port=60

# React (StockChart.jsx)
webSocketFactory: () => new SockJS('http://localhost:60/ws')
```

## 🎯 Message Format

```json
{
  "symbol": "VCB",
  "timestamp": 1700000000,
  "open": 92.5,
  "high": 93.0,
  "low": 92.0,
  "close": 92.8,
  "volume": 1500000,
  "dateStr": "20231123"
}
```

## 📚 Full Documentation

- Setup Guide: `REALTIME_SETUP.md`
- Testing Guide: `REALTIME_TESTING.md`
- Architecture: `REALTIME_ARCHITECTURE.md`
- Summary: `REALTIME_SUMMARY.md`
