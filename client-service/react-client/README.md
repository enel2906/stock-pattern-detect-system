# Stock Pattern Detection - React Application

Ứng dụng phát hiện mô hình nến (candlestick patterns) và mô hình biểu đồ (chart patterns) cho thị trường chứng khoán Việt Nam và Quốc tế.

## 🚀 Tính năng

### ✨ Giao diện
- 🎨 **Dark/Light Theme**: Chuyển đổi giữa chế độ tối và sáng
- 📱 **Responsive Design**: Tối ưu cho cả desktop và mobile
- 🎯 **TradingView-like Interface**: Giao diện tương tự TradingView chuyên nghiệp

### 📊 Biểu đồ
- 📈 **Lightweight Charts**: Sử dụng thư viện Lightweight Charts hiệu năng cao
- 🕯️ **Candlestick Chart**: Biểu đồ nến Nhật với màu sắc rõ ràng
- 🔍 **Zoom & Pan**: Phóng to/thu nhỏ và di chuyển biểu đồ
- ⏱️ **Real-time Data**: Dữ liệu từ API backend

### 🕯️ Hỗ trợ 40+ Mô hình nến
- **Single Candle** (11 mô hình): Hammer, Doji, Marubozu, Shooting Star...
- **Two Candle** (15 mô hình): Engulfing, Harami, Piercing Line, Dark Cloud Cover...
- **Three Candle** (18 mô hình): Morning/Evening Star, Three White Soldiers, Three Black Crows...
- **Multi-Candle** (5 mô hình): Rising/Falling Three Methods, Three Line Strike...

### 📐 Hỗ trợ 12 Mô hình biểu đồ (Chart Patterns)
- Cup With Handle, Flag Pattern, Pennant
- Double Tops/Bottoms, Head and Shoulders
- Ascending/Descending/Symmetrical Triangle

### 🏢 Thị trường hỗ trợ
- 🇻🇳 **HOSE, HNX, UPCOM**: 30+ cổ phiếu Việt Nam
- 🌍 **US Market**: Apple, Google, Amazon, Microsoft, Tesla, NVIDIA...

## 📦 Cài đặt

```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy development server
npm run dev

# 3. Mở trình duyệt tại http://localhost:5173
```

## 🔧 API Backend

Ứng dụng kết nối với backend API tại `http://localhost:60`:

- `GET /stock?symbol={symbol}` - Lấy dữ liệu OHLC
- `GET /alert/candle-stick/{symbol}?candlePattern={pattern}` - Phát hiện mô hình

**Lưu ý**: Đảm bảo backend đang chạy trước khi sử dụng ứng dụng.

## 📁 Cấu trúc thư mục

```
react-client/
├── src/
│   ├── components/          # React components
│   │   ├── Header.jsx      # Header với controls
│   │   └── StockChart.jsx  # Component biểu đồ chính
│   ├── constants/          # Constants và data
│   │   ├── patternDefinitions.js
│   │   ├── patternOptions.js
│   │   └── stockOptions.js
│   ├── services/           # API services
│   │   └── api.js
│   ├── utils/              # Utility functions
│   │   └── patternUtils.js
│   └── App.jsx             # Main App component
```

## 🛠️ Công nghệ

- ⚛️ React 18 + Vite
- 📊 Lightweight Charts (TradingView)
- 🎨 CSS Variables (Theme system)
- 🔧 Modern JavaScript (ES6+)

## 📸 Screenshots

Ứng dụng giữ nguyên 100% giao diện và chức năng của phiên bản HTML, nhưng được tổ chức tốt hơn với React components.

## 🎯 So sánh với phiên bản HTML

### ✅ Ưu điểm React version:
- Component-based architecture - dễ maintain
- State management với React hooks
- Better code organization
- Reusable components
- Hot Module Replacement (HMR)
- Easier to scale và add features

### ✅ Giữ nguyên:
- 100% tính năng
- Giao diện giống TradingView
- Tất cả mô hình patterns
- Tooltip system
- Theme switching

## 📝 License

Copyright © 2025 ChungKhoanNT.com
