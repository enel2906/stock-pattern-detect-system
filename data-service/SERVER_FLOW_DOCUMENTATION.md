# Server.py Flow Documentation

> Tài liệu tóm tắt luồng xử lý của server.py sau khi được cập nhật

## 📋 Tổng Quan

`server.py` là FastAPI service chịu trách nhiệm:
1. Quản lý dữ liệu cổ phiếu (stocks) trong MongoDB
2. Lấy và cập nhật dữ liệu candlestick từ vnstock/yfinance
3. Publish realtime updates qua RabbitMQ
4. Cung cấp Admin APIs để quản lý danh sách cổ phiếu

---

## 🔄 Flow Khởi Động (Startup Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER STARTUP                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. init_mongodb()                                              │
│     - Kết nối MongoDB (candlestick_db)                          │
│     - Tạo collections: stocks, candlesticks                     │
│     - Tạo indexes                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. init_rabbitmq()                                             │
│     - Kết nối RabbitMQ                                          │
│     - Declare exchange: stock.market.data (TOPIC)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. initialize_data()                                           │
│     - Kiểm tra DB có dữ liệu không                              │
│     - Nếu DB có data + RESET_DB=False → SKIP (không làm gì)     │
│     - Nếu DB trống: chỉ init US stocks (INTERNATIONAL_SYMBOLS)  │
│     - VN stocks được quản lý bởi Admin qua API                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Start Background Task: update_latest_data()                 │
│     - Chạy vòng lặp vô hạn, cập nhật mỗi 15 phút                │
│     - Lấy danh sách stocks từ DATABASE (không hardcode)         │
│     - Incremental sync: chỉ lấy data từ ngày cuối trong DB      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Nguồn Dữ Liệu Cổ Phiếu

### ✅ **HIỆN TẠI: Lấy từ Database**

| Thao Tác | Nguồn Dữ Liệu | Trạng Thái |
|----------|---------------|------------|
| Khởi động server (VN stocks) | **Database** (`stocks_collection`) | ✅ Động |
| Cập nhật periodic | **Database** (`stocks_collection.find()`) | ✅ Động |
| API `/api/stocks` | **Database** | ✅ Động |
| API `/api/price-board` | **Database** | ✅ Động |
| API `/api/candlesticks/{symbol}` | **Database** | ✅ Động |

### ⚠️ **CÒN FIX CỨNG:**

| Item | Vị Trí | Giá Trị | Lý Do |
|------|--------|---------|-------|
| `INTERNATIONAL_SYMBOLS` | Line ~52 | `['AMZN', 'TSLA', 'MSFT', 'AAPL', 'GOOG', 'NVDA']` | Hardcoded vì không có admin interface cho US stocks |
| `STOCK_SYMBOLS_REFERENCE` | Line ~66-84 | Danh sách cổ phiếu VN | **[DEPRECATED]** Chỉ để tham khảo, không còn sử dụng |

---

## 🔄 Flow Cập Nhật Dữ Liệu (Update Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                 update_latest_data() - Background Loop          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Lấy danh sách VN stocks từ DATABASE                         │
│     stocks = stocks_collection.find({"market": {"$ne": "US"}})  │
│     → KHÔNG CÒN SỬ DỤNG STOCK_SYMBOLS HARDCODED                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────┴─────────────────────┐
        │         For each stock in stocks:         │
        └─────────────────────┬─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. get_last_candle_date(stock_id)                              │
│     - Query candlestick gần nhất trong DB                       │
│     - Xác định start_date cho incremental sync                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. get_stock_data_vnstock(symbol, market, start_date, end_date)│
│     - Gọi vnstock API lấy dữ liệu mới                           │
│     - Chỉ lấy từ (last_date - 3 ngày) đến hôm nay               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. save_candlesticks_to_db(stock_id, df)                       │
│     - Bulk upsert candlesticks với composite ID                 │
│     - Trả về list các candle mới/updated                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. publish_stock_update(candle, symbol)                        │
│     - Publish candle mới lên RabbitMQ                           │
│     - Routing key: stock.update.{symbol}                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Sleep 15 phút (UPDATE_INTERVAL = 900s)                      │
│     - Sau đó lặp lại từ bước 1                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Admin Stock Management APIs

### `GET /api/admin/stocks`
- **Mô tả**: Lấy tất cả stocks trong database
- **Response**: `{stocks: [...], total: N}`

### `POST /api/admin/stocks`
- **Mô tả**: Thêm mã cổ phiếu mới
- **Body**: `{symbol, name, market}`
- **Flow**:
  1. Validate symbol
  2. Check duplicate
  3. `save_stock_to_db()`
  4. `get_stock_data_vnstock()` - Lấy 10 năm dữ liệu lịch sử
  5. `save_candlesticks_to_db()`
- **Response**: `{success: true, stock: {...}, message: "..."}`

### `DELETE /api/admin/stocks/{stock_id}`
- **Mô tả**: Xóa mã cổ phiếu và candlesticks tương ứng
- **Flow**:
  1. Find stock by ObjectId
  2. Delete all candlesticks with matching stock_id
  3. Delete stock document
- **Response**: `{success: true, candlesDeleted: N}`

### `GET /api/admin/stocks/available`
- **Mô tả**: Lấy danh sách mã có sẵn từ vnstock (chưa có trong DB)
- **Query**: `?exchange=HOSE&search=VCB`
- **Response**: `{stocks: [...], total: N}`

### `GET /api/admin/stocks/stats`
- **Mô tả**: Thống kê về stocks
- **Response**: `{total, byMarket: {...}, totalCandlesticks}`

---

## 📦 Cấu Hình

| Config | Giá Trị | Mô Tả |
|--------|---------|-------|
| `MONGODB_URI` | `mongodb://localhost:27017/candlestick_db` | MongoDB connection |
| `RABBITMQ_URI` | `amqp://guest:guest@localhost:5672/` | RabbitMQ connection |
| `PORT` | `8000` | Server port |
| `UPDATE_INTERVAL` | `900` (15 phút) | Chu kỳ cập nhật |
| `RESET_DB` | `False` | Có xóa DB khi khởi động không |
| `INITIAL_BACKFILL_DAYS` | `3650` (10 năm) | Dữ liệu lịch sử khi thêm stock mới |
| `UPDATE_LOOKBACK_DAYS` | `3` | Số ngày lookback khi sync |

---

## ✅ Tóm Tắt Thay Đổi

### Đã Chuyển Từ Hardcode → Database:

1. **`initialize_data()`**: 
   - ❌ Trước: Loop qua `STOCK_SYMBOLS` dictionary
   - ✅ Sau: Skip VN stocks, chỉ init US stocks (hardcoded). VN stocks do Admin quản lý

2. **`update_latest_data()`**:
   - ❌ Trước: Có thể dùng `STOCK_SYMBOLS` 
   - ✅ Sau: `stocks_collection.find({"market": {"$ne": "US"}})` - Lấy từ DB

3. **`/api/stocks`**:
   - ✅ Lấy từ `stocks_collection.find()`

4. **`/api/price-board`**:
   - ✅ Lấy symbols từ database

5. **Admin có thể**:
   - ✅ Thêm/xóa cổ phiếu qua web interface
   - ✅ Tự động fetch candlestick history khi thêm mới
   - ✅ Background task sẽ tự động update stocks mới được thêm

### Còn Hardcode (Chấp Nhận Được):

1. **`INTERNATIONAL_SYMBOLS`**: US stocks vẫn hardcoded vì:
   - Không có admin interface riêng cho international stocks
   - Chỉ có 6 mã US phổ biến
   - Có thể mở rộng sau nếu cần

2. **`STOCK_SYMBOLS_REFERENCE`**: 
   - Đánh dấu `[DEPRECATED]`
   - Chỉ để tham khảo, không còn sử dụng trong code
   - Có thể xóa hoàn toàn nếu muốn

---

## 🔍 Kiểm Tra Nhanh

Để verify server đang lấy data từ database:

```python
# Check trong update_latest_data()
stocks = list(stocks_collection.find({"market": {"$ne": "US"}}))
# → Nếu stocks rỗng = chưa thêm cổ phiếu qua Admin
# → Nếu stocks có data = đang lấy từ database ✅
```

```bash
# API test
curl http://localhost:8000/api/admin/stocks
# → Trả về danh sách stocks trong database
```

---

*Cập nhật lần cuối: 23/12/2024*
