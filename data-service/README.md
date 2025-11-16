# Stock Data Service

Service tự động lấy và cập nhật dữ liệu cổ phiếu từ các sàn HOSE, HNX, UPCOM.

## Cài đặt

```bash
# Cài đặt dependencies
pip install -r requirements.txt
```

## Cấu hình

Server sử dụng các cấu hình sau (có thể chỉnh sửa trong `server.py`):

- **Port**: 8000
- **MongoDB URI**: mongodb://localhost:27017/candlestick_db
- **Update Interval**: 60 giây (1 phút)

### Danh sách mã cổ phiếu

- **HOSE**: 15 mã (VCB, VHM, VNM, VIC, GAS, MSN, HPG, TCB, VPB, MWG, FPT, BID, CTG, MBB, ACB)
- **HNX**: 10 mã (PVS, SHS, VCS, CEO, NVB, PVX, TNG, BAB, VGC, SHB)
- **UPCOM**: 5 mã (BSI, FTS, ART, MCK, OIL)

## Chạy Server

```bash
python server.py
```

Hoặc:

```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

## Tính năng

### Khởi động

Khi server khởi động:
1. Xóa toàn bộ dữ liệu cũ trong collections `stocks` và `candlesticks`
2. Lấy dữ liệu lịch sử (10 năm) cho tất cả mã cổ phiếu
3. Lưu vào MongoDB

### Cập nhật tự động

- Cứ mỗi 60 giây, server tự động lấy dữ liệu mới nhất (5 ngày gần nhất) cho tất cả mã
- Có delay 2 giây giữa các request để tránh rate limit
- Tự động cập nhật timestamp cho mỗi stock

## API Endpoints

### GET /
Health check endpoint
```json
{
  "status": "running",
  "service": "Stock Data Service",
  "version": "1.0.0",
  "timestamp": "2025-11-17T..."
}
```

### GET /api/stats
Lấy thống kê dữ liệu
```json
{
  "total_stocks": 30,
  "total_candlesticks": 75000,
  "last_updated": "2025-11-17T...",
  "markets": {
    "HOSE": 15,
    "HNX": 10,
    "UPCOM": 5
  }
}
```

### GET /api/stocks?market=HOSE
Lấy danh sách cổ phiếu (có thể filter theo market)
```json
{
  "stocks": [...],
  "total": 15
}
```

### GET /api/candlesticks/{symbol}?limit=100
Lấy dữ liệu nến của một mã cổ phiếu
```json
{
  "symbol": "VCB",
  "candlesticks": [...],
  "total": 100
}
```

### POST /api/force-update
Trigger cập nhật dữ liệu ngay lập tức
```json
{
  "message": "Update started"
}
```

## Cấu trúc Database

### Collection: stocks
```javascript
{
  "_id": ObjectId,
  "symbol": "VCB",
  "name": "VCB - HOSE",
  "market": "HOSE",
  "country": "Vietnam",
  "data_source": "vnstock3",
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### Collection: candlesticks
```javascript
{
  "_id": ObjectId,
  "stock_id": "stock_id_reference",
  "date": 1052056800, // Unix timestamp
  "open": 1.12354,
  "high": 1.12354,
  "low": 1.12166,
  "close": 1.12274,
  "volume": 95533.0976
}
```

## Logging

Server sử dụng Python logging với format:
```
%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

Logs bao gồm:
- Kết nối MongoDB
- Khởi tạo dữ liệu
- Cập nhật định kỳ
- Lỗi và cảnh báo

## Lưu ý

- Server cần MongoDB chạy trên localhost:27017
- Dữ liệu lấy từ vnstock3 với source 'VCI'
- Có delay giữa các request để tránh vượt rate limit
- Duplicate candlesticks sẽ được update thay vì insert mới (dựa vào stock_id + date)
