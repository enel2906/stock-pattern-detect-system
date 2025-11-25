# Real-Time Data Pipeline - Testing Guide

## Quick Test Procedure

Follow these steps to test the real-time data pipeline:

### Step 1: Start All Services

Open **4 PowerShell terminals** and run the following commands:

#### Terminal 1: MongoDB (if not running as a service)
```powershell
# Start MongoDB
mongod --dbpath="C:\data\db"
```

#### Terminal 2: Python Data Service
```powershell
cd D:\PNM\Hust\DATN\stock-pattern-detect-system\data-service
python server.py
```

**Expected Output:**
```
INFO:__main__:MongoDB connected successfully
INFO:__main__:RabbitMQ connected successfully
INFO:__main__:Starting data initialization...
INFO:__main__:Server started on port 8000
INFO:__main__:Starting periodic update...
INFO:__main__:Published update for VCB: stock.update.VCB
```

#### Terminal 3: Java Backend
```powershell
cd D:\PNM\Hust\DATN\stock-pattern-detect-system\alert-service
mvn spring-boot:run
```

**Expected Output:**
```
Started AlertApplication in X.XXX seconds
Received stock update for symbol: VCB
Sent stock update to WebSocket topic: /topic/stock-updates/VCB
```

#### Terminal 4: React Frontend
```powershell
cd D:\PNM\Hust\DATN\stock-pattern-detect-system\client-service\react-client
npm run dev
```

**Expected Output:**
```
  VITE v7.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

### Step 2: Test the Real-Time Pipeline

1. **Open Browser** and navigate to http://localhost:5173

2. **Open Browser Console** (Press F12)

3. **Select a Stock Symbol** (e.g., VCB, VHM, HPG)

4. **Observe the Console Logs:**
```javascript
STOMP Debug: Connected to WebSocket
WebSocket connected for symbol: VCB
Received stock update: {symbol: "VCB", timestamp: 1700000000, ...}
Updated chart with new candle: {time: "2023-11-23", open: 92.5, ...}
```

5. **Check the Chart:** You should see the chart update automatically when new data arrives

### Step 3: Verify Data Flow in RabbitMQ

1. **Open RabbitMQ Management Console:** http://localhost:15672
2. **Login:** username: `guest`, password: `guest`
3. **Check Exchange:** 
   - Go to "Exchanges" tab
   - Find `stock.market.data`
   - You should see messages flowing through
4. **Check Queue:**
   - Go to "Queues" tab
   - Find `stock.live.updates`
   - You should see messages being consumed

### Step 4: Manual Testing with RabbitMQ

You can manually publish a test message to verify the pipeline:

1. Go to RabbitMQ Management Console → Exchanges → `stock.market.data`
2. Expand "Publish message"
3. Set routing key: `stock.update.VCB`
4. Set payload:
```json
{
  "symbol": "VCB",
  "timestamp": 1700000000,
  "open": 95.0,
  "high": 96.0,
  "low": 94.5,
  "close": 95.5,
  "volume": 2000000,
  "dateStr": "20231123"
}
```
5. Click "Publish message"
6. Check the React frontend - the chart should update immediately

## Testing Checklist

- [ ] MongoDB is running
- [ ] RabbitMQ is running (check http://localhost:15672)
- [ ] Python service is running and publishing messages
- [ ] Java backend is running and consuming messages
- [ ] React frontend is running
- [ ] WebSocket connection is established (check browser console)
- [ ] Chart updates when new data arrives
- [ ] No errors in any service logs

## Common Issues and Solutions

### Issue 1: Python Service - "Failed to connect to RabbitMQ"

**Solution:**
```powershell
# Check if RabbitMQ is running
net start RabbitMQ

# Or restart it
net stop RabbitMQ
net start RabbitMQ
```

### Issue 2: Java Backend - "Connection refused to RabbitMQ"

**Solution:**
1. Check if RabbitMQ is running on port 5672
2. Verify credentials in `application.properties`
3. Check firewall settings

### Issue 3: React Frontend - "WebSocket connection failed"

**Solution:**
1. Ensure Java backend is running on port 60
2. Check CORS settings in `application.properties`:
```properties
cors.allowed-origins=http://localhost:5173,http://localhost:3000
```
3. Clear browser cache and reload

### Issue 4: No Real-Time Updates on Chart

**Solution:**
1. Check Python service logs for "Published update for..."
2. Check Java backend logs for "Received stock update..."
3. Check browser console for errors
4. Verify the stock symbol matches (case-sensitive)
5. Check if `UPDATE_INTERVAL` in Python service is not too long

### Issue 5: Chart Flickers or Performance Issues

**Solution:**
1. The WebSocket is set to reconnect every 5 seconds if disconnected
2. Check if multiple subscriptions are being created
3. Ensure old subscriptions are cleaned up when switching symbols

## Performance Monitoring

### Monitor Message Rate in RabbitMQ
1. Open http://localhost:15672
2. Go to "Queues" → `stock.live.updates`
3. Check "Message rates" graph

### Monitor WebSocket Connection
```javascript
// In browser console
console.log('WebSocket state:', stompClientRef.current?.connected);
```

### Monitor Chart Performance
```javascript
// In browser console, check update frequency
let updateCount = 0;
setInterval(() => {
  console.log(`Updates in last 10s: ${updateCount}`);
  updateCount = 0;
}, 10000);
```

## Advanced Testing

### Test with Multiple Stock Symbols

1. Open multiple browser tabs
2. Select different stock symbols in each tab
3. All tabs should receive real-time updates for their respective symbols

### Test Reconnection Logic

1. Stop the Java backend while frontend is running
2. Observe WebSocket attempting to reconnect (check console)
3. Restart Java backend
4. WebSocket should automatically reconnect within 5 seconds

### Test High-Frequency Updates

Temporarily reduce `UPDATE_INTERVAL` in Python service to test high-frequency updates:

```python
UPDATE_INTERVAL = 10  # Update every 10 seconds for testing
```

## Production Readiness Checklist

Before deploying to production:

- [ ] Change RabbitMQ default credentials
- [ ] Enable TLS for RabbitMQ
- [ ] Enable TLS for WebSocket (wss://)
- [ ] Implement authentication for WebSocket connections
- [ ] Add rate limiting on Python service
- [ ] Configure proper logging levels
- [ ] Set up monitoring and alerts
- [ ] Configure message retention policies in RabbitMQ
- [ ] Implement graceful shutdown for all services
- [ ] Add health check endpoints
- [ ] Configure proper CORS for production domains

## Debugging Tips

### Enable Verbose Logging

**Python Service:**
```python
logging.basicConfig(level=logging.DEBUG)
```

**Java Backend:**
```properties
# In application.properties
logging.level.org.springframework.amqp=DEBUG
logging.level.org.springframework.messaging=DEBUG
```

**React Frontend:**
Already enabled in `debug` option of STOMP client

### Monitor Network Traffic

Use browser DevTools:
1. Press F12 → Network tab
2. Filter by "WS" (WebSocket)
3. Click on the WebSocket connection
4. View Messages tab to see real-time message flow

## API Endpoints for Testing

### Python Data Service (Port 8000)

```bash
# Health check
curl http://localhost:8000/

# Get all stocks
curl http://localhost:8000/api/stocks

# Get candlesticks for a symbol
curl http://localhost:8000/api/candlesticks/VCB?limit=10

# Force update
curl -X POST http://localhost:8000/api/force-update
```

### Java Backend (Port 60)

```bash
# WebSocket endpoint (for STOMP connection)
# Connect to: ws://localhost:60/ws

# Health check (if implemented)
curl http://localhost:60/actuator/health
```

## Next Steps

After successful testing:

1. Review logs for any warnings or errors
2. Optimize `UPDATE_INTERVAL` based on your needs
3. Configure message persistence in RabbitMQ for reliability
4. Set up monitoring and alerting
5. Implement proper error handling and retry logic
6. Add unit tests for critical components
7. Document API contracts and message formats
