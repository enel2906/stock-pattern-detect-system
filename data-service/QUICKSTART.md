# 🚀 QUICK START GUIDE

## ⚡ Cách nhanh nhất để chạy (Windows)

### Bước 1: Cài đặt dependencies
```bash
# Mở PowerShell/CMD trong thư mục data-service
pip install fastapi uvicorn pandas vnstock cachetools circuitbreaker sqlalchemy psycopg2-binary redis
```

### Bước 2: Chạy server
```bash
# Cách 1: Dùng script tự động
start.bat

# Cách 2: Chạy trực tiếp
python app.py
```

### Bước 3: Test
```bash
# Mở browser hoặc test bằng Python
python test_service.py
```

Server sẽ chạy tại: **http://localhost:60**

---

## 🎯 Test ngay với main.html

Không cần thay đổi gì! `main.html` đã sẵn sàng vì:
- ✅ Server chạy ở port 60 (đúng với config hiện tại)
- ✅ API format tương thích với Java backend
- ✅ Response có format: `{code: 0, data: [...]}`

**Chỉ cần:**
1. Chạy server Python: `python app.py`
2. Mở `main.html` trong browser
3. Chọn mã cổ phiếu và xem biểu đồ!

---

## 📊 Features hoạt động ngay

### ✅ Có thể dùng NGAY (Không cần setup)
- Memory Cache (built-in)
- VNStock API integration
- Rate limiting
- Circuit breaker
- Error handling

### ⚡ Setup thêm để tăng hiệu năng (Tùy chọn)

#### Redis Cache (Recommended)
```bash
# Windows (Chocolatey)
choco install redis-64

# Hoặc dùng Docker
docker run -d -p 6379:6379 redis:alpine
```

#### PostgreSQL Database (Optional)
```bash
# Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15

# Update .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stock_db
```

---

## 🧪 Test Endpoints

### 1. Health Check
```bash
curl http://localhost:60/health
```

### 2. Get Stock Data
```bash
curl "http://localhost:60/stock?symbol=HPG"
```

### 3. Metrics
```bash
curl http://localhost:60/metrics
```

---

## 🎨 Tích hợp với Frontend

File `main.html` đã sẵn sàng! API endpoint hiện tại:
```javascript
// Line 649 trong main.html
const res = await fetch(`http://localhost:60/stock?symbol=${stockSymbol}`);
```

Chính xác với server Python này! ✅

---

## 🔧 Troubleshooting

### Lỗi: "Module not found"
```bash
pip install -r requirements.txt
```

### Lỗi: "Port 60 already in use"
```bash
# Đổi port trong .env hoặc:
set PORT=8080
python app.py
# Nhớ update main.html: http://localhost:8080
```

### Warning: Redis/Database unavailable
```
⚠️ Không sao! Service vẫn hoạt động
✅ Chỉ thiếu tính năng cache nâng cao
```

---

## 📈 Performance

### Không có Redis/Database
- ✅ Memory cache: 1-2ms
- ⚡ VNStock API: 500-1500ms
- 📊 Tốt cho development & testing

### Có Redis
- ✅ Memory cache: 1-2ms
- ✅ Redis cache: 10-20ms
- ⚡ VNStock API: 500-1500ms
- 📊 Tốt cho production (1000+ users)

### Có Redis + Database
- ✅ Memory cache: 1-2ms
- ✅ Redis cache: 10-20ms
- 🛡️ Database fallback: 50-200ms
- ⚡ VNStock API: 500-1500ms
- 📊 Best cho production (10000+ users, 99.9% uptime)

---

## 🎯 Next Steps

1. ✅ **Ngay bây giờ**: Chạy `python app.py` và test với `main.html`
2. 📊 **Sau vài ngày**: Setup Redis để tăng hiệu năng
3. 🛡️ **Production**: Setup Database cho reliability
4. 🚀 **Scale**: Deploy với Docker + Kubernetes

---

**Chúc bạn thành công! 🎉**

Có vấn đề gì, hãy check:
- 📚 README.md (chi tiết)
- 🐛 GitHub Issues
- 💬 Contact support
