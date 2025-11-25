# Real-Time Data Pipeline - Architecture Reference

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Real-Time Stock Data Pipeline                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Python Service  │  Port: 8000
│   (FastAPI)      │  Language: Python 3.8+
│                  │  Framework: FastAPI + aio-pika
│  server.py       │
│                  │
│  • Fetches data  │
│  • Publishes to  │
│    RabbitMQ      │
└────────┬─────────┘
         │
         │ Publishes (JSON)
         │ Routing Key: stock.update.{symbol}
         ↓
┌──────────────────┐
│    RabbitMQ      │  Port: 5672 (AMQP), 15672 (Management)
│   Message Broker │  Default Credentials: guest/guest
│                  │
│  Exchange:       │
│  stock.market.   │
│  data (Topic)    │
│                  │
│  Queue:          │
│  stock.live.     │
│  updates         │
│                  │
│  Binding:        │
│  stock.update.*  │
└────────┬─────────┘
         │
         │ Consumes (JSON)
         │ @RabbitListener
         ↓
┌──────────────────┐
│  Java Backend    │  Port: 60
│  (Spring Boot)   │  Language: Java 17
│                  │  Framework: Spring Boot 3.3.5
│  alert-service   │
│                  │
│  • Consumes from │
│    RabbitMQ      │
│  • Pushes to     │
│    WebSocket     │
└────────┬─────────┘
         │
         │ WebSocket (STOMP/SockJS)
         │ Topic: /topic/stock-updates/{symbol}
         ↓
┌──────────────────┐
│  React Frontend  │  Port: 5173 (dev)
│  (Vite + React)  │  Language: JavaScript (React 19)
│                  │  Framework: Vite 7
│  react-client    │
│                  │
│  • Subscribes to │
│    WebSocket     │
│  • Updates chart │
│  • Recalculates  │
│    indicators    │
└──────────────────┘
```

## Message Flow

### 1. Python → RabbitMQ

**Exchange:** `stock.market.data` (Topic Exchange)  
**Routing Key:** `stock.update.{symbol}` (e.g., `stock.update.VCB`)  
**Message Format:**
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

### 2. RabbitMQ → Java

**Queue:** `stock.live.updates`  
**Binding Pattern:** `stock.update.*`  
**Consumer:** `@RabbitListener(queues = "stock.live.updates")`  
**DTO:** `StockUpdateDTO`

### 3. Java → React

**Protocol:** WebSocket (STOMP over SockJS)  
**Endpoint:** `ws://localhost:60/ws`  
**Topic:** `/topic/stock-updates/{symbol}`  
**Message Format:** Same as above (JSON)

## Configuration Files

### Python Service (`server.py`)

```python
MONGODB_URI = "mongodb://localhost:27017/candlestick_db"
RABBITMQ_URI = "amqp://guest:guest@localhost:5672/"
UPDATE_INTERVAL = 60  # seconds
```

**Key Functions:**
- `init_rabbitmq()` - Initialize RabbitMQ connection
- `publish_stock_update(candle_data, symbol)` - Publish updates
- `update_latest_data()` - Background task for periodic updates

### Java Backend (`application.properties`)

```properties
spring.rabbitmq.host=localhost
spring.rabbitmq.port=5672
spring.rabbitmq.username=guest
spring.rabbitmq.password=guest
server.port=60
cors.allowed-origins=http://localhost:5173,http://localhost:3000
```

**Key Classes:**
- `RabbitMQConfig.java` - RabbitMQ configuration
- `WebSocketConfig.java` - WebSocket configuration
- `StockDataListener.java` - RabbitMQ consumer and WebSocket publisher
- `StockUpdateDTO.java` - Data transfer object

### React Frontend (`StockChart.jsx`)

```javascript
const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:60/ws'),
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000,
});

client.subscribe(`/topic/stock-updates/${stockSymbol}`, callback);
```

**Key Operations:**
- Subscribe to WebSocket topic
- Update chart with `candleSeriesRef.current.update(newCandle)`
- Append to `originalDataRef.current`
- Recalculate indicators with `loadIndicators()`
- Recalculate patterns with `loadPatternsData()`

## Port Mapping

| Service           | Port  | Protocol | Purpose                  |
|-------------------|-------|----------|--------------------------|
| MongoDB           | 27017 | TCP      | Database                 |
| RabbitMQ AMQP     | 5672  | AMQP     | Message broker           |
| RabbitMQ Management | 15672 | HTTP     | Web management console   |
| Python Service    | 8000  | HTTP     | REST API                 |
| Java Backend      | 60    | HTTP/WS  | REST API + WebSocket     |
| React Frontend    | 5173  | HTTP     | Development server       |

## Dependencies

### Python Service

```
fastapi==0.104.1
uvicorn==0.24.0
pymongo==4.6.0
vnstock==2.1.0
aio-pika==9.3.1
```

### Java Backend (Maven)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### React Frontend (npm)

```json
{
  "@stomp/stompjs": "^7.0.0",
  "sockjs-client": "^1.6.1",
  "lightweight-charts": "^4.2.0"
}
```

## Data Models

### Candle Data (MongoDB/API)

```javascript
{
  time: "2023-11-23",      // ISO date string
  open: 92.5,              // Opening price
  high: 93.0,              // Highest price
  low: 92.0,               // Lowest price
  close: 92.8,             // Closing price
  volume: 1500000          // Trading volume
}
```

### Stock Update Message (RabbitMQ/WebSocket)

```javascript
{
  symbol: "VCB",           // Stock symbol
  timestamp: 1700000000,   // Unix timestamp (seconds)
  open: 92.5,
  high: 93.0,
  low: 92.0,
  close: 92.8,
  volume: 1500000,
  dateStr: "20231123"      // Date in YYYYMMDD format
}
```

## Error Handling

### Python Service

- Graceful degradation if RabbitMQ is unavailable
- Continues data fetching even if publishing fails
- Logs errors without stopping the service

### Java Backend

- Automatic reconnection to RabbitMQ
- Exception handling in `@RabbitListener`
- WebSocket error broadcasting

### React Frontend

- Automatic WebSocket reconnection (5s delay)
- Heartbeat mechanism (4s interval)
- Error logging in browser console
- Continues operation even if WebSocket fails

## Monitoring Points

### Health Checks

1. **Python Service:** `GET http://localhost:8000/`
2. **RabbitMQ:** `http://localhost:15672` (Management UI)
3. **Java Backend:** `GET http://localhost:60/actuator/health` (if Actuator is enabled)
4. **React Frontend:** Browser console for WebSocket state

### Metrics to Monitor

1. **Message publish rate** (Python → RabbitMQ)
2. **Message consumption rate** (RabbitMQ → Java)
3. **WebSocket connection count** (Java → React)
4. **Message latency** (end-to-end)
5. **Error rates** (in all services)
6. **Queue depth** (RabbitMQ queue size)

## Scalability Considerations

### Horizontal Scaling

- **Python Service:** Can run multiple instances (load balanced)
- **Java Backend:** Can run multiple instances (WebSocket sticky sessions needed)
- **RabbitMQ:** Can be clustered for high availability
- **React Frontend:** Served via CDN in production

### Vertical Scaling

- **MongoDB:** Increase memory for larger datasets
- **RabbitMQ:** Increase memory for message buffering
- **Java Backend:** Increase heap size for more WebSocket connections

### Performance Tuning

- Adjust `UPDATE_INTERVAL` in Python service
- Configure RabbitMQ message TTL and queue limits
- Implement WebSocket connection pooling
- Use Redis for distributed caching if needed

## Security Considerations

### Development Environment

- Default credentials (guest/guest) are acceptable
- No TLS required
- CORS is wide open (`*` or specific origins)

### Production Environment

Must implement:
1. **RabbitMQ:** Change default credentials, enable TLS
2. **WebSocket:** Use WSS (TLS), implement authentication
3. **MongoDB:** Enable authentication, use encrypted connections
4. **API Endpoints:** Implement rate limiting, API keys
5. **CORS:** Restrict to specific production domains
6. **Environment Variables:** Store sensitive data securely

## Troubleshooting Flow

```
Issue: No real-time updates
    ↓
Check: Python service logs
    ↓ No errors?
Check: RabbitMQ message flow (Management Console)
    ↓ Messages flowing?
Check: Java backend logs
    ↓ Consuming messages?
Check: Browser console for WebSocket logs
    ↓ Connected?
Check: Stock symbol matches exactly (case-sensitive)
    ↓
Resolution: Found and fixed!
```

## File Structure

```
stock-pattern-detect-system/
├── data-service/
│   ├── server.py                 # Python FastAPI service
│   └── requirements.txt          # Python dependencies
├── alert-service/
│   ├── pom.xml                   # Maven configuration
│   └── src/main/
│       ├── java/com/example/alert/
│       │   ├── config/
│       │   │   ├── RabbitMQConfig.java
│       │   │   └── WebSocketConfig.java
│       │   ├── dto/
│       │   │   └── StockUpdateDTO.java
│       │   └── service/
│       │       └── StockDataListener.java
│       └── resources/
│           └── application.properties
└── client-service/react-client/
    ├── package.json              # npm dependencies
    └── src/components/
        └── StockChart.jsx        # Main chart component with WebSocket
```
