# 📈 Stock Pattern Detection System

Hệ thống phân tích và phát hiện mẫu hình giá cổ phiếu (Stock Pattern Detection System) sử dụng kiến trúc Microservices với Spring Boot, Python FastAPI và React.

## 📋 Mô tả hệ thống

Hệ thống bao gồm 5 thành phần chính hoạt động độc lập và kết nối với nhau qua RabbitMQ message broker:

| Service | Công nghệ | Port | Chức năng |
|---------|-----------|------|-----------|
| **React Client** | Vite + React 19 | 5173 | Giao diện người dùng web |
| **Alert Service** | Spring Boot 3.3.5 + Java 17 | 60 | Backend API, WebSocket, Pattern Detection |
| **Data Service** | Python 3.10+ + FastAPI | 8000 | Thu thập dữ liệu cổ phiếu (vnstock, yfinance) |
| **MongoDB** | MongoDB 7.0 | 27017 | Cơ sở dữ liệu |
| **RabbitMQ** | RabbitMQ 3.x | 5672, 15672 | Message broker cho realtime updates |

## Kiến trúc hệ thống

```
┌─────────────────┐
│  React Client   │ (Port 5173)
│  (Vite + React) │
└────────┬────────┘
         │ HTTP/WebSocket
         ▼
┌─────────────────┐      RabbitMQ      ┌─────────────────┐
│  Alert Service  │◄────────────────────►│  Data Service   │
│  (Spring Boot)  │                     │   (FastAPI)     │
│   Port 60       │                     │   Port 8000     │
└────────┬────────┘                     └────────┬────────┘
         │                                       │
         │ MongoDB                               │ MongoDB
         ▼                                       ▼
    ┌────────────────────────────────────────────┐
    │            MongoDB (Port 27017)            │
    └────────────────────────────────────────────┘
```

## ✨ Tính năng chính

- **Phát hiện mẫu hình giá**: Head & Shoulders, Cup with Handle, Triangle, Flag, Pennant, Double Top/Bottom, v.v.
- **Phân tích kỹ thuật**: RSI, MACD, Bollinger Bands, MA, EMA
- **Cảnh báo thời gian thực**: WebSocket notifications
- **Responsive UI**: Giao diện tương thích đa thiết bị
- **Authentication**: JWT + Google OAuth2
- **Live Charts**: Biểu đồ nến giá thời gian thực
- **LAN Access**: Truy cập từ các thiết bị trong cùng mạng

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống

Trước khi bắt đầu, cần cài đặt các phần mềm sau:

#### 1. Docker Desktop
- **Tải về**: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- **Mục đích**: Chạy RabbitMQ và có thể chạy MongoDB
- **Lưu ý**: Không bắt buộc phải có WSL

#### 2. MongoDB
- **Tùy chọn A - Cài đặt local**: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- **Tùy chọn B - Dùng Docker**: Script sẽ tự động hỏi tạo container nếu chưa có MongoDB

#### 3. Java JDK 17 trở lên
- **Tải về**: [https://www.oracle.com/java/technologies/downloads/](https://www.oracle.com/java/technologies/downloads/)
- **Kiểm tra**: 
  ```bash
  java -version
  ```

#### 4. Apache Maven
- **Tải về**: [https://maven.apache.org/download.cgi](https://maven.apache.org/download.cgi)
- **Cài đặt**: Giải nén và thêm vào PATH
- **Kiểm tra**: 
  ```bash
  mvn -version
  ```

#### 5. Python 3.10 trở lên
- **Tải về**: [https://www.python.org/downloads/](https://www.python.org/downloads/)
- **Lưu ý**: Tick "Add Python to PATH" khi cài đặt
- **Kiểm tra**: 
  ```bash
  python --version
  ```

#### 6. Node.js 18 trở lên
- **Tải về**: [https://nodejs.org/](https://nodejs.org/)
- **Khuyến nghị**: Dùng phiên bản LTS
- **Kiểm tra**: 
  ```bash
  node --version
  npm --version
  ```

### Cách 1: Chạy tự động (Khuyến nghị) ⚡

Đây là cách đơn giản nhất, script sẽ tự động khởi động tất cả services theo đúng thứ tự.

#### Trên Windows - Sử dụng file .bat

1. Mở File Explorer, navigate đến thư mục `stock-pattern-detect-system`
2. **Double-click** file `deploy-local.bat`
3. Hệ thống sẽ tự động khởi động tất cả services

#### Trên Windows - Sử dụng PowerShell

```powershell
# Chạy script deployment
powershell -ExecutionPolicy Bypass -File .\deploy-local.ps1

# Hoặc dừng tất cả services
powershell -ExecutionPolicy Bypass -File .\deploy-local.ps1 -StopAll

# Xem hướng dẫn
powershell -ExecutionPolicy Bypass -File .\deploy-local.ps1 -Help
```

#### Flow khởi động tự động

Script sẽ tự động thực hiện các bước sau:

1. **Kiểm tra prerequisites** (Docker, Java, Maven, Python, Node.js)
2. **Khởi động RabbitMQ** (Docker container) - Port 5672, 15672
3. **Kiểm tra MongoDB** - Port 27017 (tạo container nếu chưa có)
4. **Khởi động Data Service** (tự động tạo venv, cài dependencies) - Port 8000
5. **Khởi động Alert Service** (Maven build + run) - Port 60
6. **Khởi động React Client** (npm install + dev) - Port 5173

Mỗi service chạy trong terminal riêng để dễ theo dõi logs.

### Cách 2: Chạy thủ công từng service 🔧

Nếu muốn kiểm soát từng service riêng lẻ:

#### 1. Khởi động RabbitMQ (Docker)

```bash
docker run -d --name rabbitmq ^
  -p 5672:5672 ^
  -p 15672:15672 ^
  rabbitmq:3-management
```

- Management UI: http://localhost:15672 (guest/guest)

#### 2. Khởi động MongoDB

**Tùy chọn A - MongoDB local** (nếu đã cài):
```bash
# MongoDB thường tự động chạy như service
# Kiểm tra: netstat -an | findstr 27017
```

**Tùy chọn B - MongoDB Docker**:
```bash
docker run -d --name mongodb ^
  -p 27017:27017 ^
  mongo:7.0
```

#### 3. Khởi động Data Service (Python)

```bash
cd data-service

# Tạo virtual environment (lần đầu)
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
venv\Scripts\activate.bat

# Cài đặt dependencies
pip install -r requirements.txt

# Chạy server
python server.py
```

- API URL: http://localhost:8000
- API Docs: http://localhost:8000/docs

#### 4. Khởi động Alert Service (Java Spring Boot)

```bash
cd alert-service

# Build và chạy với Maven
mvn clean install
mvn spring-boot:run

# Hoặc chạy file .jar
java -jar target/alert-0.0.1-SNAPSHOT.jar
```

- API URL: http://localhost:60
- WebSocket: ws://localhost:60/ws

#### 5. Khởi động React Client

```bash
cd client-service/react-client

# Cài đặt dependencies (lần đầu)
npm install

# Chạy development server
npm run dev
```

- Web URL: http://localhost:5173

## 🔧 Cấu hình

### Alert Service Configuration

File: `alert-service/src/main/resources/application.properties`

```properties
server.port=60
spring.data.mongodb.uri=mongodb://localhost:27017/candlestick_db

# JWT
jwt.secret=your-secret-key
jwt.expiration=9000000

# RabbitMQ
spring.rabbitmq.host=localhost
spring.rabbitmq.port=5672
spring.rabbitmq.username=guest
spring.rabbitmq.password=guest

# CORS - Allow all origins for LAN access
cors.allowed-origins=*
```

### Data Service Configuration

File: `data-service/server.py`

```python
# MongoDB connection
MONGO_URI = "mongodb://localhost:27017"
MONGO_DB = "candlestick_db"

# RabbitMQ connection
RABBITMQ_URL = "amqp://guest:guest@localhost:5672/"

# FastAPI server
uvicorn.run(app, host="0.0.0.0", port=8000)
```

### React Client Configuration

File: `client-service/react-client/vite.config.js`

```javascript
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Allow LAN access
    port: 5173
  }
})
``

## 🛠️ Công nghệ sử dụng

### Backend (Alert Service)
- **Framework**: Spring Boot 3.3.5
- **Language**: Java 17
- **Database**: MongoDB (Spring Data MongoDB)
- **Security**: Spring Security, JWT (jjwt 0.11.5)
- **OAuth2**: Google OAuth2 Client
- **Message Queue**: RabbitMQ (Spring AMQP)
- **WebSocket**: Spring WebSocket + STOMP
- **Build Tool**: Maven

### Backend (Data Service)
- **Framework**: FastAPI (Uvicorn)
- **Language**: Python 3.10+
- **Database**: MongoDB (PyMongo)
- **Message Queue**: RabbitMQ (aio-pika)
- **Data Source**: vnstock, yfinance
- **Async**: asyncio

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Routing**: React Router DOM 7
- **Charts**: Lightweight Charts 4
- **WebSocket**: STOMP.js, SockJS Client
- **Language**: JavaScript (ES6+)

### Infrastructure
- **Database**: MongoDB 7.0
- **Message Broker**: RabbitMQ 3.x
- **Containerization**: Docker
- **OS**: Windows (with Docker Desktop)

### MongoDB connection failed?

Kiểm tra MongoDB đang chạy:
```powershell
# Kiểm tra port
netstat -an | findstr 27017

# Nếu dùng Docker
docker ps | findstr mongo

# Khởi động lại MongoDB Docker
docker start mongodb
```

### RabbitMQ connection failed?

Kiểm tra RabbitMQ container:
```powershell
# Xem container
docker ps | findstr rabbitmq

# Khởi động lại
docker start rabbitmq

# Hoặc tạo mới
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### npm/Maven build failed?

```bash
# Clear cache và rebuild
cd client-service/react-client
rm -rf node_modules package-lock.json
npm install

cd ../../alert-service
mvn clean install
```