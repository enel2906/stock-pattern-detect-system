# 🚀 Alert Rule Builder - Integration Guide

## Tích hợp với hệ thống hiện tại

### 1. Dependencies đã được thêm

**Backend (pom.xml):**
```xml
<!-- Đã có sẵn -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

**Frontend (package.json):**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "axios": "^1.6.0",
    "lightweight-charts": "^4.1.0"
  }
}
```

### 2. Cấu trúc Database MongoDB

**Collection: `alert_rules`**
```javascript
// Indexes
db.alert_rules.createIndex({ "userId": 1, "symbol": 1 })
db.alert_rules.createIndex({ "userId": 1, "status": 1 })
```

### 3. Security Configuration

Cần thêm endpoint vào SecurityConfig:

```java
// alert-service/src/main/java/com/example/alert/config/SecurityConfig.java

@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(auth -> auth
            // ... existing rules ...
            .requestMatchers("/api/alert-rules/**").authenticated() // ADD THIS
            // ... other rules ...
        );
    return http.build();
}
```

### 4. Tích hợp Rule Engine với WebSocket

Để rule engine tự động evaluate khi có dữ liệu mới, cần integrate với `StockDataListener`:

**File: `alert-service/src/main/java/com/example/alert/service/StockDataListener.java`**

```java
import com.example.alert.service.RuleEngineService;
import com.example.alert.dto.AlertSignal;

@Service
@RequiredArgsConstructor
public class StockDataListener {
    
    private final RuleEngineService ruleEngineService;
    private final SimpMessagingTemplate messagingTemplate;
    
    @RabbitListener(queues = "stock.data.queue")
    public void handleStockData(StockUpdateDTO stockUpdate) {
        try {
            // ... existing code to save candle data ...
            
            // NEW: Evaluate alert rules
            List<CandleStick> recentCandles = candleStickRepository
                .findByStockSymbolOrderByDateStrDesc(stockUpdate.getSymbol())
                .stream()
                .limit(200) // Get last 200 candles for indicator calculation
                .collect(Collectors.toList());
                
            if (!recentCandles.isEmpty()) {
                Collections.reverse(recentCandles); // Oldest first
                
                // Evaluate rules
                List<AlertSignal> signals = ruleEngineService.evaluateRules(
                    stockUpdate.getSymbol(), 
                    recentCandles
                );
                
                // Send signals via WebSocket
                if (!signals.isEmpty()) {
                    signals.forEach(signal -> {
                        messagingTemplate.convertAndSend(
                            "/topic/alerts/" + signal.getSymbol(),
                            signal
                        );
                        
                        log.info("Alert signal generated: {} for {}", 
                            signal.getSignalType(), signal.getSymbol());
                    });
                }
            }
            
        } catch (Exception e) {
            log.error("Error processing stock update: {}", e.getMessage());
        }
    }
}
```

### 5. WebSocket Configuration cho Alerts

**File: `alert-service/src/main/java/com/example/alert/config/WebSocketConfig.java`**

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")
            .withSockJS();
    }
}
```

### 6. Frontend WebSocket Integration

**File: `client-service/react-client/src/components/StockChart.jsx`**

Đã tích hợp sẵn trong code, nhưng cần thêm subscription cho alerts:

```javascript
// Add to existing WebSocket connection
useEffect(() => {
  if (!stockSymbol || !isChartReady) return;

  const connectWebSocket = () => {
    try {
      const socket = new SockJS('http://localhost:60/ws');
      const client = new Client({
        webSocketFactory: () => socket,
        debug: (str) => console.log('STOMP:', str),
        
        onConnect: () => {
          console.log('Connected to WebSocket');
          
          // Subscribe to stock data
          const stockSub = client.subscribe(`/topic/stock/${stockSymbol}`, (message) => {
            // ... existing code ...
          });
          
          // NEW: Subscribe to alerts
          const alertSub = client.subscribe(`/topic/alerts/${stockSymbol}`, (message) => {
            const signal = JSON.parse(message.body);
            console.log('Alert signal received:', signal);
            
            // Update alert signals state
            setAlertSignals(prev => [...prev, signal]);
            
            // Show notification
            showAlertNotification(signal);
          });
          
          subscriptionRef.current = { stockSub, alertSub };
        }
      });
      
      client.activate();
      stompClientRef.current = client;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  };
  
  connectWebSocket();
  
  return () => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
    }
  };
}, [stockSymbol, isChartReady]);

// Show alert notification
const showAlertNotification = (signal) => {
  if (Notification.permission === 'granted') {
    new Notification(`${signal.signalType}: ${signal.symbol}`, {
      body: signal.message,
      icon: signal.signalType === 'BUY' ? '📈' : '📉'
    });
  }
};
```

### 7. Request Notification Permission

**File: `client-service/react-client/src/App.jsx`**

```javascript
useEffect(() => {
  // Request notification permission on mount
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, []);
```

### 8. Environment Variables

**Backend (`alert-service/src/main/resources/application.properties`):**
```properties
# MongoDB
spring.data.mongodb.uri=mongodb://localhost:27017/candlestick_db

# Server
server.port=60

# JWT
jwt.secret=your-secret-key-change-this-in-production-min-256-bits-long
jwt.expiration=9000000

# CORS
cors.allowed-origins=http://localhost:5173,http://localhost:3000
```

**Frontend (`.env`):**
```env
VITE_API_BASE_URL=http://localhost:60
VITE_WS_URL=http://localhost:60/ws
```

### 9. Testing the Integration

#### Step 1: Start Backend
```bash
cd alert-service
mvn spring-boot:run
```

#### Step 2: Start Frontend
```bash
cd client-service/react-client
npm install
npm run dev
```

#### Step 3: Test Flow
1. Đăng nhập vào hệ thống
2. Chọn một mã cổ phiếu (VD: HPG)
3. Click button "🔔 Alert Rules"
4. Tạo quy tắc mới:
   - Tên: "Test RSI"
   - Signal: BUY
   - Điều kiện: RSI < 30
   - Status: ACTIVE
5. Chờ data real-time từ RabbitMQ
6. Khi điều kiện thỏa mãn, signal sẽ xuất hiện trên chart

### 10. Common Issues & Solutions

**Issue 1: CORS Error**
```java
// Add to SecurityConfig.java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.addAllowedOrigin("http://localhost:5173");
    configuration.addAllowedMethod("*");
    configuration.addAllowedHeader("*");
    configuration.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

**Issue 2: MongoDB Connection**
```bash
# Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use MongoDB Atlas (cloud)
spring.data.mongodb.uri=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

**Issue 3: WebSocket not connecting**
```javascript
// Check SockJS URL
const socket = new SockJS('http://localhost:60/ws'); // Must match backend port

// Enable CORS for WebSocket in SecurityConfig
.cors(cors -> cors.configurationSource(corsConfigurationSource()))
```

**Issue 4: Rule not triggering**
- Check rule status = ACTIVE
- Verify cooldown period has passed
- Check logs: `tail -f alert-service/logs/spring.log`
- Test indicator calculation manually

### 11. Performance Optimization

**Backend:**
```java
// Add caching for indicator calculations
@Cacheable(value = "indicators", key = "#symbol + '_' + #indicatorKey")
public Double calculateIndicator(String symbol, String indicatorKey, Map<String, Object> params) {
    // ... calculation logic ...
}

// Add index for faster queries
@CompoundIndex(name = "symbol_dateStr_idx", def = "{'stockSymbol': 1, 'dateStr': -1}")
public class CandleStick {
    // ...
}
```

**Frontend:**
```javascript
// Debounce rule evaluation
const debouncedEvaluate = useMemo(
  () => debounce((candleData) => {
    evaluateRules(candleData);
  }, 1000),
  []
);
```

### 12. Monitoring & Logging

**Add logging interceptor:**
```java
@Slf4j
@Aspect
@Component
public class RuleEngineLoggingAspect {
    
    @Around("execution(* com.example.alert.service.RuleEngineService.evaluateRules(..))")
    public Object logRuleEvaluation(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        
        Object result = joinPoint.proceed();
        
        long duration = System.currentTimeMillis() - start;
        log.info("Rule evaluation took {}ms, generated {} signals", 
            duration, ((List) result).size());
        
        return result;
    }
}
```

### 13. Deployment Checklist

- [ ] MongoDB indexes created
- [ ] JWT secret changed to production value
- [ ] CORS configured for production domain
- [ ] WebSocket URL updated in frontend
- [ ] Logging level set to INFO/WARN
- [ ] Health check endpoint added
- [ ] Rate limiting configured
- [ ] Backup strategy for MongoDB
- [ ] Monitoring setup (Prometheus/Grafana)
- [ ] Error tracking (Sentry/ELK)

---

**Hệ thống đã sẵn sàng để sử dụng!** 🎉

Nếu cần hỗ trợ thêm, vui lòng tham khảo:
- Backend API: http://localhost:60/swagger-ui.html (if Swagger enabled)
- Frontend: http://localhost:5173
- MongoDB: mongodb://localhost:27017
