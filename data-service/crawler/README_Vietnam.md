# Vietnam Stock Data Crawler

Crawler này được thiết kế để lấy dữ liệu cổ phiếu Việt Nam từ vnstock và lưu vào MongoDB theo cấu trúc dữ liệu của alert-service.

## Cài đặt

1. Cài đặt các dependencies:
```bash
pip install -r requirements.txt
```

2. Đảm bảo MongoDB đang chạy trên `localhost:27017`

## Cấu trúc dữ liệu

### Collection `stocks`
```json
{
  "_id": "ObjectId",
  "symbol": "VIC",
  "name": "Vingroup JSC", 
  "market": "HOSE",
  "country": "Vietnam",
  "created_at": 1697184000
}
```

### Collection `candlesticks`
```json
{
  "_id": "ObjectId",
  "stock_id": "stock_object_id",
  "date": 1697184000,
  "open": 85000,
  "high": 86500,
  "low": 84000,
  "close": 85500,
  "volume": 2150000
}
```

## Sử dụng

### 1. Crawl các cổ phiếu phổ biến
```python
from crawlVietnamStockData import VietnamStockCrawler

crawler = VietnamStockCrawler()

# Crawl 10 cổ phiếu phổ biến từ 2022 đến nay
popular_stocks = ['VIC', 'VHM', 'VCB', 'BID', 'CTG', 'TCB', 'FPT', 'HPG', 'VNM', 'MSN']
crawler.crawl_specific_stocks(
    symbols=popular_stocks,
    start_date="2022-01-01"
)
```

### 2. Crawl tất cả cổ phiếu Việt Nam
```python
crawler = VietnamStockCrawler()
crawler.crawl_top_vietnam_stocks(
    start_date="2023-01-01",
    end_date="2024-12-31"
)
```

### 3. Crawl một cổ phiếu cụ thể
```python
crawler = VietnamStockCrawler()
crawler.crawl_specific_stocks(['VIC'], start_date="2020-01-01")
```

## Chạy script
```bash
python crawlVietnamStockData.py
```

## Lưu ý

1. **Rate Limiting**: Script có delay 1 giây giữa các request để tránh bị chặn
2. **Error Handling**: Script sẽ tiếp tục chạy ngay cả khi có lỗi với một số mã cổ phiếu
3. **Logging**: Tất cả hoạt động đều được log để theo dõi
4. **Data Validation**: Dữ liệu được validate trước khi lưu vào database
5. **Duplicate Handling**: Script sẽ xóa dữ liệu cũ trước khi insert dữ liệu mới

## Troubleshooting

### Lỗi kết nối MongoDB
- Đảm bảo MongoDB đang chạy: `mongod --dbpath /path/to/db`
- Kiểm tra kết nối: `mongo mongodb://localhost:27017`

### Lỗi vnstock
- Cập nhật vnstock: `pip install --upgrade vnstock3`
- Kiểm tra kết nối internet

### Không có dữ liệu cho một mã cổ phiếu
- Kiểm tra mã cổ phiếu có đúng không
- Thử với khoảng thời gian khác
- Một số mã có thể không có dữ liệu trong vnstock

## Tích hợp với Alert Service

Dữ liệu được lưu theo đúng cấu trúc của alert-service Java:
- Compatible với `CandleStick.java` entity
- Compatible với `StockMarket.java` entity  
- Sử dụng cùng MongoDB collections: `stocks` và `candlesticks`