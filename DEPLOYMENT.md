# 🚀 Stock Pattern Detection System - Deployment Guide

## 📋 Tổng Quan Hệ Thống

Hệ thống bao gồm 5 thành phần chính:

| Service | Công nghệ | Port | Mô tả |
|---------|-----------|------|-------|
| **React Client** | Vite + React 19 | 5173 | Frontend web application |
| **Alert Service** | Spring Boot 3.3 | 60 | Backend API + WebSocket |
| **Data Service** | Python FastAPI | 8000 | Stock data API (vnstock) |
| **MongoDB** | MongoDB 7.0 | 27017 | Database |
| **RabbitMQ** | RabbitMQ 3.x | 5672, 15672 | Message broker |

## 🎯 Cách Deploy (Local)

### Yêu cầu tiên quyết

Cài đặt các phần mềm sau:
- ✅ **Docker Desktop** - cho RabbitMQ (và MongoDB nếu chưa cài)
- ✅ **MongoDB** - cài local hoặc dùng Docker
- ✅ **Java JDK 17+** 
- ✅ **Maven**
- ✅ **Python 3.10+**
- ✅ **Node.js 18+**

### Chạy hệ thống

**Cách 1: Double-click file .bat**
```
deploy-local.bat
```

**Cách 2: Chạy trong PowerShell**
```powershell
powershell -ExecutionPolicy Bypass -File .\deploy-local.ps1
```

**Các lệnh hỗ trợ:**
```powershell
# Dừng tất cả services
powershell -ExecutionPolicy Bypass -File .\deploy-local.ps1 -StopAll

# Xem hướng dẫn
powershell -ExecutionPolicy Bypass -File .\deploy-local.ps1 -Help
```

## 🔄 Flow khởi động

Script sẽ tự động khởi động theo thứ tự:

1. **RabbitMQ** (Docker container) - Port 5672, 15672
2. **MongoDB** - Port 27017 (hỏi tạo Docker nếu chưa có)
3. **Data Service** (Python + venv) - Port 8000
4. **Alert Service** (Java Spring Boot) - Port 60
5. **React Client** (Vite) - Port 5173

Mỗi service chạy trong terminal riêng để dễ theo dõi logs.

## ❓ FAQ

### Có cần WSL không?
**KHÔNG**. Script chạy hoàn toàn trên Windows PowerShell. Bạn chỉ cần Docker Desktop (không cần WSL backend).

### Python có chạy trong venv không?
**CÓ**. Script tự động:
- Tạo venv trong `data-service/venv` nếu chưa có
- Activate venv trước khi cài dependencies và chạy server

### Tại sao không chạy được file .ps1?
Windows mặc định block script PowerShell. Dùng file `.bat` hoặc chạy với `-ExecutionPolicy Bypass`:
```powershell
powershell -ExecutionPolicy Bypass -File .\deploy-local.ps1
```

## 🌐 Truy cập từ thiết bị khác (cùng WiFi)

**Đã hỗ trợ tự động!** Hệ thống tự detect IP và cấu hình API URLs.

### Bước 1: Tìm IP của máy chủ
```powershell
ipconfig
# Tìm IPv4 Address, ví dụ: 192.168.1.100
```

### Bước 2: Mở Windows Firewall (nếu cần)
```powershell
# Mở port cho các service
netsh advfirewall firewall add rule name="Stock App" dir=in action=allow protocol=TCP localport=5173,60,8000
```

### Bước 3: Truy cập từ thiết bị khác
```
http://192.168.1.100:5173
```

### Cách hoạt động
- React client tự động detect hostname từ URL
- Nếu truy cập qua `localhost` → gọi API `localhost:60`, `localhost:8000`
- Nếu truy cập qua IP (ví dụ `192.168.1.100`) → gọi API `192.168.1.100:60`, `192.168.1.100:8000`
- Nếu truy cập qua ngrok → tự động dùng ngrok URLs
- CORS đã được cấu hình cho phép tất cả origins

### Google OAuth trên LAN

⚠️ **Google OAuth KHÔNG hoạt động** khi truy cập qua private IP (192.168.x.x).

**Giải pháp**:
1. Truy cập từ `localhost:5173` trên máy chủ
2. Hoặc sử dụng **ngrok tunnel** → Xem [NGROK_SETUP.md](NGROK_SETUP.md)
3. Hoặc dùng đăng nhập thường (username/password)

## ⚠️ Troubleshooting

### MongoDB không chạy
```powershell
# Chạy với Docker
docker run -d --name stock-mongodb -p 27017:27017 mongo:7.0
```

### RabbitMQ không kết nối được
```powershell
# Kiểm tra container
docker ps | findstr rabbit

# Restart nếu cần
docker restart stock-rabbitmq
```

### vnstock_news (Silver) không cài được
- Đây là gói trả phí, hệ thống vẫn hoạt động với VCI API làm fallback
- Tham khảo: https://vnstocks.com/onboard-member

## 📁 Cấu trúc thư mục

```
stock-pattern-detect-system/
├── deploy-local.ps1          # Script deploy (PowerShell)
├── deploy-local.bat          # Wrapper để chạy .ps1
├── DEPLOYMENT.md             # File này
├── alert-service/            # Java Spring Boot
│   ├── pom.xml
│   └── src/
├── data-service/             # Python FastAPI
│   ├── venv/                 # Virtual environment (auto-created)
│   ├── requirements.txt
│   └── server.py
└── client-service/
    └── react-client/         # React + Vite
        └── src/
```
