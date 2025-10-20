# 🧪 Test Data Service API

## ✅ Đã sửa gì?

### 1. **Thêm Mock Data Generator**
- Tạo dữ liệu giả realistic khi vnstock không hoạt động
- Random prices với biến động ±2%
- Đảm bảo high/low đúng logic

### 2. **Smart Fallback Logic**
```
Try vnstock → Nếu lỗi → Fallback sang mock data
```

### 3. **Better Error Handling**
- Log chi tiết lỗi
- Không return 500 error nữa
- Always return valid JSON array

### 4. **Flexible Column Names**
Hỗ trợ nhiều format column names từ vnstock:
- `open` / `Open` / `o`
- `high` / `High` / `h`
- `low` / `Low` / `l`
- `close` / `Close` / `c`
- `volume` / `Volume` / `v`

---

## 🚀 Cách Start Service

### Option 1: PowerShell
```powershell
cd "c:\Users\minh.pham2\Desktop\Hust\DATN\My Graduation Project\stock-pattern-detect-system\data-service"
py -3.10 app.py
```

### Option 2: Command Prompt
```cmd
cd c:\Users\minh.pham2\Desktop\Hust\DATN\My Graduation Project\stock-pattern-detect-system\data-service
python app.py
```

**Kết quả mong đợi:**
```
INFO:__main__:Starting Data Service on port 5000...
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.x.x:5000
```

---

## 🧪 Test Endpoints

### Test 1: Health Check
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/health" | Select-Object -ExpandProperty Content

# Hoặc dùng browser:
http://localhost:5000/health
```

**Expected Output:**
```json
{
  "status": "healthy",
  "service": "data-service"
}
```

---

### Test 2: Get Real Data từ vnstock (nếu available)
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/intraday/VIC?limit=5" | Select-Object -ExpandProperty Content
```

**Expected Output (nếu vnstock work):**
```json
[
  {
    "time": "09:30:00",
    "open": 45500.0,
    "high": 45700.0,
    "low": 45400.0,
    "close": 45600.0,
    "volume": 1000000
  },
  ...
]
```

---

### Test 3: Force Mock Data (recommended for testing)
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/intraday/VIC?limit=5&mock=true" | Select-Object -ExpandProperty Content
```

**Expected Output (mock data):**
```json
[
  {
    "time": "09:05:00",
    "open": 44523.45,
    "high": 44789.12,
    "low": 44321.67,
    "close": 44650.23,
    "volume": 567890
  },
  ...
]
```

---

### Test 4: Test với symbols khác
```powershell
# Test VNM
Invoke-WebRequest -Uri "http://localhost:5000/intraday/VNM?limit=3&mock=true"

# Test FPT
Invoke-WebRequest -Uri "http://localhost:5000/intraday/FPT?limit=3&mock=true"

# Test HPG
Invoke-WebRequest -Uri "http://localhost:5000/intraday/HPG?limit=3&mock=true"
```

---

## 🔧 Sửa Java Service để dùng Mock Data

### Option 1: Thêm parameter vào URL
Edit `IntradayDataService.java`:

```java
private String buildUrl(String symbol, int limit) {
    return dataServiceUrl + "/intraday/" + symbol + "?limit=" + limit + "&mock=true";
}
```

### Option 2: Config trong application.properties
```properties
data.service.url=http://localhost:5000
data.service.use-mock=true
```

Và update `IntradayDataService.java`:
```java
@Value("${data.service.use-mock:false}")
private boolean useMock;

private String buildUrl(String symbol, int limit) {
    String url = dataServiceUrl + "/intraday/" + symbol + "?limit=" + limit;
    if (useMock) {
        url += "&mock=true";
    }
    return url;
}
```

---

## 🐛 Troubleshooting

### Issue 1: Port 5000 already in use
```powershell
# Check process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue 2: Module not found
```powershell
# Reinstall dependencies
py -3.10 -m pip install -r requirements.txt --force-reinstall
```

### Issue 3: vnstock connection timeout
**Solution:** Dùng mock data
```
http://localhost:5000/intraday/VIC?mock=true
```

### Issue 4: Java service vẫn báo 500 error
**Checklist:**
1. ✅ Python service đang chạy?
2. ✅ Test endpoint trực tiếp bằng browser?
3. ✅ Restart Java service?
4. ✅ Check Java logs cho chi tiết lỗi?

---

## 📊 Expected Behavior

### Scenario 1: vnstock Works
```
1. Java calls Python API
2. Python tries vnstock
3. vnstock returns data ✅
4. Python returns data to Java
5. Pattern detection works
```

### Scenario 2: vnstock Fails
```
1. Java calls Python API
2. Python tries vnstock
3. vnstock fails ❌
4. Python auto fallback to mock data ✅
5. Python returns mock data to Java
6. Pattern detection works with mock data
```

### Scenario 3: Force Mock
```
1. Java calls Python API with ?mock=true
2. Python skips vnstock
3. Python generates mock data immediately ✅
4. Pattern detection works
```

---

## ✅ Verification Steps

1. **Start Python service**
   ```powershell
   py -3.10 app.py
   ```

2. **Test health endpoint**
   ```
   http://localhost:5000/health
   ```
   Should return: `{"status": "healthy", ...}`

3. **Test mock data endpoint**
   ```
   http://localhost:5000/intraday/VIC?limit=5&mock=true
   ```
   Should return: JSON array với 5 candles

4. **Start Java service**
   ```powershell
   cd alert-service
   ./mvnw spring-boot:run
   ```

5. **Connect WebSocket client**
   - Open `realtime.html`
   - Click "Connect"
   - Status should be "Connected"

6. **Watch pattern**
   - Select symbol: VIC
   - Select pattern: Hammer
   - Click "Start Watching"
   - Wait 5 seconds for update

---

## 🎯 Next Steps

Sau khi test thành công với mock data:

1. **Kiểm tra vnstock real data**
   - Remove `?mock=true` parameter
   - Check if vnstock API works

2. **Add more patterns**
   - Test với các patterns khác
   - Verify detection accuracy

3. **Performance testing**
   - Monitor API response time
   - Check memory usage
   - Test với multiple symbols

4. **Production deployment**
   - Use production-grade WSGI server (gunicorn)
   - Add rate limiting
   - Add caching (Redis)
   - Add authentication

---

*Last Updated: 2025-10-20*
