# 🚀 Stock Pattern Detection System - Deployment Guide

## 📋 Tổng Quan Hệ Thống

Hệ thống phát hiện mẫu hình nến và phân tích kỹ thuật chứng khoán, bao gồm 5 thành phần:

| Service | Công nghệ | Port | Mô tả |
|---------|-----------|------|-------|
| **React Client** | Vite + React 19 | 5173 | Frontend web application |
| **Alert Service** | Spring Boot 3.3 + Java 17 | 60 | Backend API + WebSocket + Authentication |
| **Data Service** | Python FastAPI | 8000 | Stock data API (vnstock, yfinance) |
| **MongoDB** | MongoDB 7.0 | 27017 | Database lưu trữ candlesticks, users |
| **RabbitMQ** | RabbitMQ 3.x | 5672, 15672 | Message broker cho realtime updates |

---

## 📦 Yêu Cầu Tiên Quyết

### Phần mềm bắt buộc

| Phần mềm | Version | Kiểm tra | Download |
|----------|---------|----------|----------|
| **Docker Desktop** | Latest | `docker --version` | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Java JDK** | 17+ | `java -version` | [adoptium.net](https://adoptium.net/) |
| **Maven** | 3.8+ | `mvn -version` | [maven.apache.org](https://maven.apache.org/download.cgi) |
| **Python** | 3.10+ | `python --version` | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18+ | `node --version` | [nodejs.org](https://nodejs.org/) |
| **MongoDB** | 7.0 | `mongod --version` | [mongodb.com](https://www.mongodb.com/try/download/community) |

### Kiểm tra nhanh (PowerShell)

```powershell
# Chạy lệnh này để kiểm tra tất cả prerequisites
docker --version; java -version; mvn -version; python --version; node --version
```

---

## 🎯 CÁCH 1: Deploy Tự Động (Khuyến nghị)

Script tự động sẽ khởi động tất cả services theo đúng thứ tự.

### Bước 1: Mở PowerShell

```powershell
# Click phải vào Start -> Windows Terminal
# Hoặc tìm PowerShell trong Start Menu
```

### Bước 2: Di chuyển đến thư mục dự án

```powershell
cd D:\path\to\stock-pattern-detect-system
```

### Bước 3: Chạy script deploy

```powershell
# Cách 1: Double-click file .bat
.\deploy-local.bat

# Cách 2: Chạy PowerShell script
powershell -ExecutionPolicy Bypass -File .\deploy-local.ps1
```

### Bước 4: Đợi hoàn tất (~2-3 phút lần đầu)

Script sẽ tự động:
1. ✅ Kiểm tra prerequisites (Docker, Java, Maven, Python, Node.js)
2. ✅ Khởi động RabbitMQ container (Docker)
3. ✅ Kiểm tra MongoDB (hỏi tạo Docker nếu chưa có)
4. ✅ Tạo Python venv và cài dependencies từ `requirements.txt`
5. ✅ Khởi động Data Service (Python) - Port 8000
6. ✅ Build và khởi động Alert Service (Java) - Port 60
7. ✅ Cài npm packages và khởi động React Client - Port 5173

### Các lệnh hỗ trợ

```powershell
# Dừng tất cả services
.\deploy-local.ps1 -StopAll

# Xem hướng dẫn
.\deploy-local.ps1 -Help

# Bỏ qua kiểm tra prerequisites
.\deploy-local.ps1 -SkipPrerequisites
```

---

## 🔧 CÁCH 2: Deploy Thủ Công (Từng Service)

Sử dụng cách này khi muốn kiểm soát từng service hoặc debug.

### Bước 1: Khởi động RabbitMQ (Terminal 1)

```powershell
# Kiểm tra Docker đang chạy
docker info

# Tạo và chạy RabbitMQ container
docker run -d --name stock-rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Đợi 10 giây để RabbitMQ khởi động
Start-Sleep -Seconds 10

# Kiểm tra container đang chạy
docker ps | findstr rabbitmq
```

**Truy cập RabbitMQ Management:** http://localhost:15672 (guest/guest)

### Bước 2: Khởi động MongoDB

**Option A: MongoDB đã cài local**
```powershell
# Kiểm tra MongoDB đang chạy
Test-NetConnection -ComputerName localhost -Port 27017

# Nếu chưa chạy, start MongoDB service
net start MongoDB
```

**Option B: Dùng Docker**
```powershell
docker run -d --name stock-mongodb -p 27017:27017 mongo:7.0
```

### Bước 3: Khởi động Data Service - Python (Terminal 2)

```powershell
# Di chuyển đến thư mục data-service
cd data-service

# Tạo virtual environment (chỉ lần đầu)
python -m venv venv

# Kích hoạt venv
.\venv\Scripts\Activate.ps1

# Cài đặt dependencies từ requirements.txt
pip install --upgrade pip
pip install -r requirements.txt

# Khởi động server
python server.py
```

**Kiểm tra:** Truy cập http://localhost:8000 → Phải thấy response JSON `{"message": "Stock Data Service is running"}`

### Bước 4: Khởi động Alert Service - Java (Terminal 3)

```powershell
# Di chuyển đến thư mục alert-service
cd alert-service

# Build project với Maven
mvn clean package -DskipTests

# Chạy Spring Boot application
mvn spring-boot:run
```

**Kiểm tra:** 
- API: http://localhost:60/api/candlesticks/VCB
- WebSocket: ws://localhost:60/ws

### Bước 5: Khởi động React Client (Terminal 4)

```powershell
# Di chuyển đến thư mục react-client
cd client-service\react-client

# Cài đặt npm packages (chỉ lần đầu)
npm install

# Khởi động development server
npm run dev
```

**Truy cập web app:** http://localhost:5173

---

## ✅ Kiểm Tra Hệ Thống

Sau khi deploy, kiểm tra các service:

| Service | URL | Expected Response |
|---------|-----|-------------------|
| React Client | http://localhost:5173 | Giao diện web app |
| Alert Service | http://localhost:60/api/candlesticks/VCB | JSON candlestick data |
| Data Service | http://localhost:8000/api/stocks | JSON list stocks |
| RabbitMQ | http://localhost:15672 | Login page (guest/guest) |

---

## 🌐 Truy Cập Từ Thiết Bị Khác (LAN)

### Bước 1: Tìm IP máy chủ

```powershell
ipconfig
# Tìm IPv4 Address, ví dụ: 192.168.1.100
```

### Bước 2: Mở Windows Firewall

```powershell
# Mở ports cho các service
netsh advfirewall firewall add rule name="Stock App Ports" dir=in action=allow protocol=TCP localport=5173,60,8000
```

### Bước 3: Truy cập từ thiết bị khác

```
http://192.168.1.100:5173
```

### Cách hoạt động
- React client tự động detect hostname từ URL
- Nếu truy cập qua `localhost` → gọi API `localhost:60`, `localhost:8000`
- Nếu truy cập qua IP → gọi API `IP:60`, `IP:8000`
- CORS đã được cấu hình cho phép tất cả origins

> ⚠️ **Lưu ý:** Google OAuth không hoạt động qua LAN IP. Sử dụng đăng nhập username/password hoặc ngrok tunnel.

---

## ❓ Troubleshooting

### MongoDB không kết nối được

```powershell
# Kiểm tra port 27017
Test-NetConnection -ComputerName localhost -Port 27017

# Nếu failed, chạy MongoDB trong Docker
docker run -d --name stock-mongodb -p 27017:27017 mongo:7.0
```

### RabbitMQ không kết nối được

```powershell
# Kiểm tra container
docker ps | findstr rabbit

# Restart container
docker restart stock-rabbitmq

# Xem logs nếu có lỗi
docker logs stock-rabbitmq
```

### Data Service lỗi import vnstock

```powershell
# Vào venv và reinstall
cd data-service
.\venv\Scripts\Activate.ps1
pip uninstall vnstock -y
pip install vnstock --upgrade
```

### Alert Service build failed

```powershell
# Clean và rebuild
cd alert-service
mvn clean install -DskipTests

# Nếu vẫn lỗi, xóa folder target
Remove-Item -Recurse -Force target
mvn clean package -DskipTests
```

### React Client lỗi npm

```powershell
# Xóa node_modules và cài lại
cd client-service\react-client
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Port đã bị sử dụng

```powershell
# Tìm process đang dùng port (ví dụ port 60)
netstat -ano | findstr :60

# Kill process bằng PID
taskkill /PID <PID> /F
```

---

## 📁 Cấu Trúc Thư Mục

```
stock-pattern-detect-system/
├── deploy-local.ps1          # Script deploy tự động
├── deploy-local.bat          # Wrapper cho .ps1
├── DEPLOYMENT.md             # Hướng dẫn deploy (file này)
├── README.md                 # Tổng quan dự án
│
├── alert-service/            # Java Spring Boot Backend
│   ├── pom.xml               # Maven dependencies
│   ├── src/main/java/        # Source code
│   └── src/main/resources/   # application.properties
│
├── data-service/             # Python FastAPI
│   ├── requirements.txt      # Python dependencies
│   ├── server.py             # Main server
│   └── venv/                 # Virtual environment (auto-created)
│
└── client-service/
    └── react-client/         # React + Vite Frontend
        ├── package.json      # NPM dependencies
        └── src/              # React components
```

---

## 🔗 Tài Liệu Tham Khảo

- [VNStock Documentation](https://vnstocks.com/docs)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)