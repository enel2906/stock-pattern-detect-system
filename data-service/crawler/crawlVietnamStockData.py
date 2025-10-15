import logging
import time
from datetime import datetime
from pymongo import MongoClient
import pandas as pd
from vnstock import Vnstock

# ==============================
# ⚙️ 1. CONFIGURATION
# ==============================
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "candlestick_db"

# Kết nối MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==============================
# 🧩 2. CLASS CRAWLER
# ==============================
class VietnamStockCrawler:
    def __init__(self):
        self.vnstock_instance = Vnstock()
        self.sources = ['VCI', 'TCBS']  # Ưu tiên VCI trước, TCBS sau

    def get_vietnam_stock_list(self):
        """Lấy danh sách tất cả cổ phiếu Việt Nam (từ nguồn VCI)"""
        try:
            stock_listing = self.vnstock_instance.stock(source='VCI')
            hose = stock_listing.listing.symbols_by_exchange('HOSE')
            hnx = stock_listing.listing.symbols_by_exchange('HNX')
            upcom = stock_listing.listing.symbols_by_exchange('UPCOM')

            frames = [hose, hnx, upcom]
            all_stocks = pd.concat(frames, ignore_index=True)
            all_stocks = all_stocks.drop_duplicates(subset=['ticker'])
            logger.info(f"Fetched {len(all_stocks)} stock symbols from exchanges.")
            return all_stocks['ticker'].tolist()

        except Exception as e:
            logger.error(f"Error fetching stock list: {e}")
            return ['TCB', 'VCB', 'BID', 'CTG', 'FPT', 'HPG', 'VNM', 'MSN']

    def fetch_historical_data(self, symbol, start_date, end_date, interval='1D'):
        """Lấy dữ liệu lịch sử giá cho 1 mã cổ phiếu với fallback giữa VCI và TCBS"""
        for source in self.sources:
            try:
                stock = self.vnstock_instance.stock(symbol=symbol, source=source)
                logger.info(f"Fetching {symbol} from {source} ({start_date} → {end_date})")
                data = stock.quote.history(start=start_date, end=end_date, interval=interval)

                if data is not None and not data.empty:
                    logger.info(f"Fetched {len(data)} rows for {symbol} from {source}.")
                    return data

            except Exception as e:
                logger.warning(f"Error fetching {symbol} from {source}: {e}")
                continue

        logger.error(f"Failed to fetch data for {symbol} from all sources.")
        return None

    def store_stock_metadata(self, symbol):
        """Lưu thông tin metadata của cổ phiếu vào MongoDB"""
        try:
            existing = db.stocks.find_one({"symbol": symbol})
            if existing:
                return str(existing['_id'])

            stock_doc = {
                "symbol": symbol,
                "created_at": int(datetime.now().timestamp()),
                "market": "Vietnam"
            }
            result = db.stocks.insert_one(stock_doc)
            logger.info(f"Inserted stock metadata for {symbol} → ID: {result.inserted_id}")
            return str(result.inserted_id)

        except Exception as e:
            logger.error(f"Error storing metadata for {symbol}: {e}")
            return None

    def store_candlestick_data(self, stock_id, symbol, df):
        """Lưu dữ liệu OHLCV vào MongoDB (nhân 1000 để chuyển sang đơn vị VNĐ)"""
        try:
            if df is None or df.empty:
                return

            df = df.reset_index()
            records = []

            for _, row in df.iterrows():
                try:
                    date_value = row.get('time') or row.get('date') or row.get('Date')
                    if isinstance(date_value, str):
                        date_ts = int(datetime.strptime(date_value, '%Y-%m-%d').timestamp())
                    else:
                        date_ts = int(date_value.timestamp())

                    # Nhân 1000 để chuyển giá từ nghìn đồng sang đồng VNĐ
                    records.append({
                        "stock_id": stock_id,
                        "symbol": symbol,
                        "date": date_ts,
                        "open": float(row.get('open', row.get('Open', 0))) * 1000,
                        "high": float(row.get('high', row.get('High', 0))) * 1000,
                        "low": float(row.get('low', row.get('Low', 0))) * 1000,
                        "close": float(row.get('close', row.get('Close', 0))) * 1000,
                        "volume": float(row.get('volume', row.get('Volume', 0)))
                    })
                except Exception:
                    continue

            if records:
                db.candlesticks.delete_many({"symbol": symbol})
                db.candlesticks.insert_many(records)
                logger.info(f"Inserted {len(records)} candlesticks for {symbol} (converted to VNĐ).")

        except Exception as e:
            logger.error(f"Error saving candlestick data for {symbol}: {e}")

    def crawl_symbols(self, symbols, start_date="2020-01-01", end_date=None):
        if end_date is None:
            end_date = datetime.now().strftime('%Y-%m-%d')

        success_count = 0
        for symbol in symbols:
            try:
                logger.info(f"\n=== Processing {symbol} ===")
                stock_id = self.store_stock_metadata(symbol)
                df = self.fetch_historical_data(symbol, start_date, end_date)
                if df is not None:
                    self.store_candlestick_data(stock_id, symbol, df)
                    success_count += 1

                # Nghỉ giữa các request để tránh bị rate limit
                time.sleep(2)

            except Exception as e:
                logger.error(f"Error processing {symbol}: {e}")

        logger.info(f"Crawling completed: {success_count}/{len(symbols)} symbols successfully.")


# ==============================
# 🚀 3. MAIN ENTRY POINT
# ==============================
def main():
    crawler = VietnamStockCrawler()

    # Crawl 1 số mã tiêu biểu
    symbols = ['TCB', 'VCB', 'MSN']
    crawler.crawl_symbols(symbols, start_date="2000-01-01", end_date=None)


if __name__ == "__main__":
    main()