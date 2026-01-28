# 📈 Stock Pattern Detection System

Hệ thống phân tích kỹ thuật và phát hiện mẫu hình nến chứng khoán theo thời gian thực, hỗ trợ cổ phiếu Việt Nam (VNStock) và quốc tế (Yahoo Finance).

## ✨ Tính Năng Chính

### 🕯️ Phát Hiện Mẫu Hình Nến (Candlestick Patterns)
- **50+ mẫu hình nến** được hỗ trợ như Hammer, Doji, Engulfing, Morning Star..., các mẫu hình nến phức tạp như Cup & Handle, Double, Pennant, Flag, ...
- Phát hiện tự động trên biểu đồ realtime
- Phân loại theo nhóm: Bullish, Bearish, Neutral, Reversal
- Hiển thị marker trực quan trên chart

### 📊 Chỉ Báo Kỹ Thuật (Technical Indicators)
- **Moving Averages**: SMA, EMA, WMA, DEMA, TEMA
- **Oscillators**: RSI, MACD, Stochastic, Williams %R, CCI
- **Volatility**: Bollinger Bands, ATR, Keltner Channel
- **Volume**: OBV, Volume Profile, VWAP
- **Trend**: ADX, Parabolic SAR, Ichimoku Cloud

### 🚀 Tín Hiệu Nâng Cao (Advance Signals)
- **Combo Signals**: Kết hợp nhiều mẫu hình + chỉ báo
- **AI Breakout Detection**: Phát hiện phá vỡ vùng kháng cự/hỗ trợ
- **Pattern Confluence**: Xác nhận tín hiệu từ nhiều nguồn
- **Risk/Reward Analysis**: Đánh giá tỷ lệ rủi ro/lợi nhuận

### 🔔 Hệ Thống Cảnh Báo (Alerts)
- Cảnh báo realtime qua WebSocket
- Tùy chỉnh điều kiện alert (giá, volume, pattern...)
- Lịch sử cảnh báo và quản lý watchlist

### 📰 Thông Tin Cổ Phiếu
- Thông tin công ty, tài chính
- Tin tức cổ phiếu (news)
- Bảng giá realtime (Priceboard)

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Client  │────▶│  Alert Service  │────▶│   Data Service  │
│   (Port 5173)   │     │   (Port 60)     │     │   (Port 8000)   │
│   Vite + React  │◀────│  Spring Boot    │◀────│  Python FastAPI │
└─────────────────┘     └────────┬────────┘     └─────────┬───────┘
                                 │                        │
                                 ▼                        ▼
                        ┌─────────────────┐      ┌─────────────────┐
                        │    MongoDB      │      │    VNStock      │
                        │  (Port 27017)   │      │    yfinance     │
                        └─────────────────┘      └─────────────────┘
                                 ▲
                                 │
                        ┌─────────────────┐
                        │    RabbitMQ     │
                        │ (Port 5672/15672)│
                        └─────────────────┘
```

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend
| Công nghệ | Mô tả |
|-----------|-------|
| React 19 | UI Framework |
| Vite | Build tool |
| Lightweight Charts | Trading chart library |
| STOMP.js | WebSocket client |
| React Router | Navigation |

### Backend (Alert Service)
| Công nghệ | Mô tả |
|-----------|-------|
| Spring Boot 3.3 | Java Framework |
| Java 17 | Runtime |
| Spring Security | Authentication (JWT + OAuth2) |
| Spring WebSocket | Realtime communication |
| Spring Data MongoDB | Database access |

### Data Service
| Công nghệ | Mô tả |
|-----------|-------|
| FastAPI | Python Web Framework |
| VNStock 3.x | Vietnam stock data API |
| yfinance | International stock data |
| aio-pika | RabbitMQ async client |

### Infrastructure
| Công nghệ | Mô tả |
|-----------|-------|
| MongoDB 7.0 | NoSQL Database |
| RabbitMQ | Message Broker |
| Docker | Containerization |

---

## 🚀 Quick Start

### Yêu cầu
- Docker Desktop
- Java JDK 17+
- Python 3.10+
- Node.js 18+
- Maven 3.8+

### Cài đặt và Chạy

```powershell
# Clone repository
git clone <repository-url>
cd stock-pattern-detect-system

# Chạy script deploy tự động
.\deploy-local.bat

# Hoặc chạy PowerShell script
powershell -ExecutionPolicy Bypass -File .\deploy-local.ps1
```

### Truy cập ứng dụng

| Service | URL |
|---------|-----|
| Web App | http://localhost:5173 |
| Alert API | http://localhost:60/api |
| Data API | http://localhost:8000 |
| RabbitMQ UI | http://localhost:15672 |

📖 **Xem hướng dẫn chi tiết:** [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📚 Tài Liệu

| Tài liệu | Mô tả |
|----------|-------|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Hướng dẫn deploy chi tiết |
| [NGROK_SETUP.md](NGROK_SETUP.md) | Cấu hình ngrok tunnel |
| [CUP_WITH_HANDLE_IMPLEMENTATION.md](CUP_WITH_HANDLE_IMPLEMENTATION.md) | Thuật toán Cup With Handle |

---

## 📸 Screenshots

### Biểu đồ nến với mẫu hình
![Candlestick Chart](docs/images/candlestick-chart.png)

### Phát hiện mẫu hình nến
![Pattern Detection](docs/images/pattern-detection.png)

### Tín hiệu nâng cao
![Advance Signals](docs/images/advance-signals.png)

---

## 🔧 Cấu Trúc Dự Án

```
stock-pattern-detect-system/
│
├── 📁 alert-service/              # Java Spring Boot Backend
│   ├── src/main/java/
│   │   └── com/stockpattern/
│   │       ├── config/            # Security, WebSocket configs
│   │       ├── controller/        # REST & WebSocket controllers
│   │       ├── model/             # Domain models
│   │       ├── repository/        # MongoDB repositories
│   │       └── service/           # Business logic
│   ├── pom.xml                    # Maven dependencies
│   └── src/main/resources/
│       └── application.properties # App configuration
│
├── 📁 data-service/               # Python FastAPI
│   ├── server.py                  # Main application
│   └── requirements.txt           # Python dependencies
│
├── 📁 client-service/
│   └── 📁 react-client/           # React Frontend
│       ├── src/
│       │   ├── components/        # React components
│       │   ├── pages/             # Page components
│       │   ├── services/          # API services
│       │   └── context/           # React context
│       ├── package.json           # NPM dependencies
│       └── vite.config.js         # Vite configuration
│
├── deploy-local.ps1               # Auto deploy script
├── deploy-local.bat               # Wrapper script
├── DEPLOYMENT.md                  # Deploy guide
└── README.md                      # This file
```

---

## 🌟 Tính Năng Nổi Bật

### 1. Realtime Pattern Detection
- Update dữ liệu thời gian thực.
- Phát hiện mẫu hình ngay khi nến hoàn thành.
- Triển khai thuật toán nhận diện các mẫu hình nến phức tạp như Cup & Handle, Double, Pennant, Flag, ...
- Kết Hợp mô hình nến và chỉ báo kĩ thuật thành tín hiệu alert real time.
- Tích hợp chạy backtest kiểm thử độ chính xác của tín hiệu.


### 2. Multi-Source Data
- **VNStock**: Cổ phiếu Việt Nam (VCB, HPG, FPT...)
- **Yahoo Finance**: Cổ phiếu quốc tế (AAPL, GOOGL, MSFT...)
- **Fallback mechanism**: Tự động chuyển source khi lỗi

### 3. Smart Caching
- Cache dữ liệu candlestick theo symbol + interval
- Auto-refresh khi có dữ liệu mới
- Giảm API calls và tăng performance

### 4. Responsive Design
- Hỗ trợ desktop, tablet, mobile
- Dark/Light mode
- Touch-friendly chart interactions

---

## 🔐 Authentication

Hệ thống hỗ trợ 2 phương thức đăng nhập:

1. **Username/Password**: Đăng ký tài khoản local
2. **Google OAuth2**: Đăng nhập bằng Google

> ⚠️ Google OAuth chỉ hoạt động với `localhost` hoặc qua ngrok tunnel.

---

## 📈 Supported Symbols

### Việt Nam (VNStock)
- HOSE: VCB, HPG, FPT, VNM, VHM, VIC...
- HNX: PVS, ACB, SHB...
- UPCOM: ...

### International (Yahoo Finance)
- US: AAPL, GOOGL, MSFT, AMZN, TSLA...
- Crypto: BTC-USD, ETH-USD...
- Forex: EURUSD=X, USDJPY=X...

---
---

## 📝 License

This project is part of a graduation thesis at Hanoi University of Science and Technology (HUST).

---

## 👤 Author

**Phạm Nhật Minh** - 20215225

📧 Email: phamnhatminhdh@gmail.com
🎓 Hanoi University of Science and Technology (HUST)

---

## 🙏 Acknowledgments

- [VNStock](https://vnstocks.com/) - Vietnam Stock Data API
- [Yahoo Finance](https://finance.yahoo.com/) - International Stock Data
- [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/) - Charting Library
- Spring Boot, FastAPI, React communities
