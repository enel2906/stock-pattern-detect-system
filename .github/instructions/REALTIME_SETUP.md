# Real-Time Stock Data Pipeline Setup Guide

This guide provides step-by-step instructions to set up the real-time data pipeline for the stock analysis system.

## Architecture Overview

```
Python Data Service (FastAPI)
         ↓ (publishes)
    RabbitMQ Exchange
         ↓ (consumes)
Java Backend (Spring Boot)
         ↓ (WebSocket)
React Frontend (Lightweight Charts)
```

## Prerequisites

1. **RabbitMQ Server** installed and running on localhost:5672
2. **MongoDB** running on localhost:27017
3. **Python 3.8+** installed
4. **Java 17** installed
5. **Node.js 16+** and npm installed

## Installation Steps

### Step 1: Start RabbitMQ (Docker)

Your RabbitMQ is already running in Docker! Just ensure it's started:

```powershell
# Check if running
docker ps | findstr rabbit

# If not running, start it
docker start my-rabbit

# Wait a few seconds for initialization
Start-Sleep -Seconds 5
```

Access RabbitMQ Management Console at http://localhost:15672 (guest/guest)

**For detailed Docker commands, see `DOCKER_RABBITMQ.md`**

### Step 2: Install Python Dependencies

Navigate to the data-service directory:
```powershell
cd data-service
pip install -r requirements.txt
```

### Step 3: Install Java Dependencies

Navigate to the alert-service directory and build:
```powershell
cd alert-service
mvn clean install
```

### Step 4: Install Node Dependencies

Navigate to the react-client directory:
```powershell
cd client-service\react-client
npm install
```

## Running the Application

### Terminal 1: Start RabbitMQ Docker (if not running)
```powershell
docker start my-rabbit
Start-Sleep -Seconds 5
```

### Terminal 2: Start Python Data Service
```powershell
cd data-service
python server.py
```

The service will:
- Initialize MongoDB with historical stock data
- Start publishing updates every 60 seconds to RabbitMQ
- Run on http://localhost:8000

### Terminal 3: Start Java Backend
```powershell
cd alert-service
mvn spring-boot:run
```

The service will:
- Connect to RabbitMQ and consume stock updates
- Push updates to WebSocket clients
- Run on http://localhost:60

### Terminal 4: Start React Frontend
```powershell
cd client-service\react-client
npm run dev
```

The app will run on http://localhost:5173

## Verification

### 1. Check RabbitMQ
- Open http://localhost:15672
- Login with guest/guest
- Verify the exchange `stock.market.data` exists
- Verify the queue `stock.live.updates` exists and is bound to the exchange

### 2. Check Data Service Logs
You should see:
```
MongoDB connected successfully
RabbitMQ connected successfully
Published update for VCB: stock.update.VCB
```

### 3. Check Java Backend Logs
You should see:
```
Received stock update for symbol: VCB
Sent stock update to WebSocket topic: /topic/stock-updates/VCB
```

### 4. Check React Frontend
- Open browser console (F12)
- Select a stock symbol (e.g., VCB)
- You should see:
```
STOMP Debug: Connected
WebSocket connected for symbol: VCB
Received stock update: {...}
Updated chart with new candle: {...}
```

## Configuration

### Python Data Service (server.py)
```python
MONGODB_URI = "mongodb://localhost:27017/candlestick_db"
RABBITMQ_URI = "amqp://guest:guest@localhost:5672/"
UPDATE_INTERVAL = 60  # seconds
```

### Java Backend (application.properties)
```properties
spring.rabbitmq.host=localhost
spring.rabbitmq.port=5672
spring.rabbitmq.username=guest
spring.rabbitmq.password=guest
server.port=60
```

### React Frontend (StockChart.jsx)
```javascript
webSocketFactory: () => new SockJS('http://localhost:60/ws')
```

## Troubleshooting

### RabbitMQ Connection Failed
- Ensure RabbitMQ Docker container is running: `docker start my-rabbit`
- Wait a few seconds for initialization: `Start-Sleep -Seconds 5`
- Check container status: `docker ps | findstr rabbit`
- Check if ports are available: `Test-NetConnection -ComputerName localhost -Port 5672`
- Verify credentials in configuration files (default: guest/guest)

### WebSocket Connection Failed
- Ensure Java backend is running on port 60
- Check browser console for CORS errors
- Verify CORS settings in application.properties:
```properties
cors.allowed-origins=http://localhost:5173,http://localhost:3000
```

### No Real-Time Updates
1. Check Python service logs for "Published update for..."
2. Check RabbitMQ management console for message flow
3. Check Java backend logs for "Received stock update..."
4. Check browser console for "Received stock update..."

### Data Not Displaying on Chart
- Ensure the chart is fully loaded before WebSocket connects
- Check if `originalDataRef.current` has data
- Verify the timestamp format matches the chart data format

## Message Flow

1. **Python Service** fetches stock data every 60s and publishes to RabbitMQ:
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

2. **Java Backend** receives from RabbitMQ and forwards via WebSocket to topic `/topic/stock-updates/{symbol}`

3. **React Frontend** subscribes to the topic and:
   - Updates the chart with `candleSeriesRef.current.update(newCandle)`
   - Appends to `originalDataRef.current`
   - Recalculates indicators and patterns

## Performance Considerations

- WebSocket reconnects automatically every 5 seconds if disconnected
- Heartbeat is configured for both incoming (4s) and outgoing (4s)
- Messages are persisted in RabbitMQ (DeliveryMode.PERSISTENT)
- Chart updates use `.update()` for better performance than `.setData()`

## Security Notes

For production deployment:
1. Change RabbitMQ default credentials
2. Enable TLS for RabbitMQ and WebSocket connections
3. Implement authentication for WebSocket connections
4. Use environment variables for sensitive configuration
5. Enable rate limiting on the Python service

## Additional Resources

- RabbitMQ Documentation: https://www.rabbitmq.com/documentation.html
- STOMP Protocol: https://stomp.github.io/
- Lightweight Charts: https://tradingview.github.io/lightweight-charts/
