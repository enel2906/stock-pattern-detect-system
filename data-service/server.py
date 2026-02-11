"""
Stock Data Service
Tự động lấy và cập nhật dữ liệu cổ phiếu từ các sàn HOSE, HNX, UPCOM
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict
import time
import json
import pandas as pd

# Tắt warning từ Pandas về deprecated downcasting
pd.set_option('future.no_silent_downcasting', True)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient, ASCENDING
from pymongo.errors import PyMongoError
import uvicorn
import aio_pika
from aio_pika import connect_robust, Message, DeliveryMode, ExchangeType

# Import vnstock_data (thay thế vnstock cũ)
try:
    from vnstock_data import Company, Finance, Listing, Trading, Quote
    VNSTOCK_DATA_AVAILABLE = True
    print("✅ vnstock_data loaded successfully")
except ImportError as e:
    print(f"Warning: vnstock_data not installed - {e}")
    print("  → Install with: pip install vnstock_data")
    Company = None
    Finance = None
    Listing = None
    Trading = None
    Quote = None
    VNSTOCK_DATA_AVAILABLE = False

# Legacy vnstock support (fallback)
try:
    from vnstock import Vnstock
    VNSTOCK_LEGACY_AVAILABLE = True
except ImportError:
    print("Warning: vnstock (legacy) not installed")
    Vnstock = None
    VNSTOCK_LEGACY_AVAILABLE = False

try:
    import yfinance as yf
except ImportError:
    print("Warning: yfinance not installed. Install with: pip install yfinance")
    yf = None

# Import vnstock_news cho gói Silver
try:
    from vnstock_news import Crawler as NewsCrawler
    from vnstock_news import News as NewsParser
    VNSTOCK_NEWS_AVAILABLE = True
    print("✅ vnstock_news loaded successfully")
except (ImportError, SyntaxError) as e:
    print(f"Warning: vnstock_news not available - {type(e).__name__}: {e}")
    print("  → News feature will use VCI Company API as fallback")
    print("  → To fix: Try 'pip install vnstock_news --upgrade' or check Python version compatibility")
    NewsCrawler = None
    NewsParser = None
    VNSTOCK_NEWS_AVAILABLE = False
except Exception as e:
    print(f"Warning: vnstock_news failed to load - {type(e).__name__}: {e}")
    NewsCrawler = None
    NewsParser = None
    VNSTOCK_NEWS_AVAILABLE = False

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# International stock symbols (US stocks via vnstock)
INTERNATIONAL_SYMBOLS = ['AMZN', 'TSLA', 'MSFT', 'AAPL', 'GOOG', 'NVDA']

# Cấu hình
MONGODB_URI = "mongodb://localhost:27017/candlestick_db"
RABBITMQ_URI = "amqp://guest:guest@localhost:5672/"
PORT = 8000
UPDATE_INTERVAL = 20
PRICE_BOARD_UPDATE_INTERVAL = 1  # 1 giây - interval cập nhật bảng giá realtime
RESET_DB = False  # Đặt True nếu muốn xóa và nạp lại dữ liệu toàn bộ (chỉ dùng khi cần)
INITIAL_BACKFILL_DAYS = 3650  # 10 năm dữ liệu lịch sử cho lần init đầu tiên
UPDATE_LOOKBACK_DAYS = 3  # Số ngày để xem lại khi cập nhật (để recover missing/revised data)

# [DEPRECATED] Danh sách mã cổ phiếu cố định - KHÔNG CÒN SỬ DỤNG
# Admin sẽ quản lý danh sách này qua API: /api/admin/stocks
# Giữ lại để tham khảo các mã phổ biến
STOCK_SYMBOLS_REFERENCE = {
    'HOSE': [
        # Banking
        'VCB', 'BID', 'CTG', 'TCB', 'VPB', 'MBB', 'ACB', 'SHB', 'STB', 'HDB', 'TPB', 'VIB', 'LPB',
        # Real Estate
        'VHM', 'VIC', 'VRE', 'KDH', 'NVL', 'PDR', 'DIG', 'DXG',
        # Securities
        'SSI', 'VND', 'VIX', 'HCM', 'VCI', 'FTS', 'BSI',
        # Retail & Consumer
        'MWG', 'MSN', 'VNM', 'PNJ', 'DGW', 'FRT',
        # Industrial & Others
        'HPG', 'FPT', 'GVR', 'DGC', 'VGC', 'GAS'
    ],  # 40 mã HOSE
    'HNX': [
        'PVS', 'SHS', 'CEO', 'IDC', 'MBS', 'TNG', 'HUT', 'VC3', 'LAS', 'TIG'
    ],  # 10 mã HNX
    'UPCOM': [
        'BSR', 'OIL', 'VGI', 'VEA', 'ACV', 'QNS', 'MCH', 'VTP', 'FOX', 'C4G'
    ]  # 10 mã UPCOM
}

# FastAPI app
app = FastAPI(title="Stock Data Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB client
mongo_client = None
db = None
stocks_collection = None
candlesticks_collection = None

# Vnstock instance
vnstock = None

# RabbitMQ connection
rabbitmq_connection = None
rabbitmq_channel = None
rabbitmq_exchange = None

# Price Board RabbitMQ connection (separate for price board updates)
rabbitmq_price_board_exchange = None

# Background task reference
update_task = None
price_board_task = None


def init_mongodb():
    """Khởi tạo kết nối MongoDB"""
    global mongo_client, db, stocks_collection, candlesticks_collection
    
    try:
        mongo_client = MongoClient(MONGODB_URI)
        db = mongo_client.get_database()
        stocks_collection = db['stocks']
        candlesticks_collection = db['candlesticks']
        
        # Tạo index
        stocks_collection.create_index([("symbol", ASCENDING)], unique=True)
        # _id sẽ là composite key: stock_id + "_" + yyyyMMdd
        # Index phụ để query nhanh theo stock_id và date_str
        candlesticks_collection.create_index([("stock_id", ASCENDING), ("date_str", ASCENDING)])
        candlesticks_collection.create_index([("date", ASCENDING)])
        
        logger.info("MongoDB connected successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        return False


async def init_rabbitmq():
    """Khởi tạo kết nối RabbitMQ"""
    global rabbitmq_connection, rabbitmq_channel, rabbitmq_exchange, rabbitmq_price_board_exchange
    
    try:
        rabbitmq_connection = await connect_robust(RABBITMQ_URI)
        rabbitmq_channel = await rabbitmq_connection.channel()
        
        # Declare exchange for stock updates (candlestick data)
        rabbitmq_exchange = await rabbitmq_channel.declare_exchange(
            'stock.market.data',
            ExchangeType.TOPIC,
            durable=True
        )
        
        # Declare exchange for price board updates (realtime trading data)
        rabbitmq_price_board_exchange = await rabbitmq_channel.declare_exchange(
            'stock.price.board',
            ExchangeType.TOPIC,
            durable=True
        )
        
        logger.info("RabbitMQ connected successfully (stock.market.data + stock.price.board)")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to RabbitMQ: {e}")
        return False


async def publish_stock_update(candle_data: dict, symbol: str):
    """
    Publish stock update to RabbitMQ
    
    Args:
        candle_data: Dictionary containing candle data (open, high, low, close, volume, time)
        symbol: Stock symbol
    """
    global rabbitmq_exchange
    
    try:
        # Nếu chưa có exchange, thử kết nối lại
        if not rabbitmq_exchange:
            logger.info("RabbitMQ exchange not initialized, attempting to reconnect...")
            reconnected = await init_rabbitmq()
            
            if not reconnected or not rabbitmq_exchange:
                logger.warning("Failed to reconnect to RabbitMQ, skipping publish")
                return
            
            logger.info("Successfully reconnected to RabbitMQ")
        
        routing_key = f"stock.update.{symbol}"
        
        message_body = json.dumps({
            "symbol": symbol,
            "timestamp": candle_data.get("date", int(datetime.now().timestamp())),
            "open": candle_data.get("open"),
            "high": candle_data.get("high"),
            "low": candle_data.get("low"),
            "close": candle_data.get("close"),
            "volume": candle_data.get("volume"),
            "dateStr": candle_data.get("date_str")
        })
        
        message = Message(
            body=message_body.encode(),
            delivery_mode=DeliveryMode.PERSISTENT,
            content_type='application/json'
        )
        
        await rabbitmq_exchange.publish(
            message,
            routing_key=routing_key
        )
        
        logger.info(f"Published update for {symbol}: {routing_key}")
    except Exception as e:
        logger.error(f"Error publishing stock update for {symbol}: {e}")
        # Reset exchange để trigger reconnect ở lần tiếp theo
        rabbitmq_exchange = None


async def publish_price_board_update(price_board_data: list):
    """
    Publish price board update to RabbitMQ
    
    Args:
        price_board_data: List of stock price data from trading.price_board()
    """
    global rabbitmq_price_board_exchange
    
    try:
        # Nếu chưa có exchange, thử kết nối lại
        if not rabbitmq_price_board_exchange:
            logger.info("RabbitMQ price board exchange not initialized, attempting to reconnect...")
            reconnected = await init_rabbitmq()
            
            if not reconnected or not rabbitmq_price_board_exchange:
                logger.warning("Failed to reconnect to RabbitMQ for price board, skipping publish")
                return
            
            logger.info("Successfully reconnected to RabbitMQ for price board")
        
        routing_key = "price.board.update"
        
        message_body = json.dumps({
            "data": price_board_data,
            "total": len(price_board_data),
            "timestamp": datetime.now().isoformat()
        })
        
        message = Message(
            body=message_body.encode(),
            delivery_mode=DeliveryMode.NOT_PERSISTENT,  # Non-persistent for realtime data
            content_type='application/json'
        )
        
        await rabbitmq_price_board_exchange.publish(
            message,
            routing_key=routing_key
        )
        
        logger.debug(f"Published price board update: {len(price_board_data)} stocks")
    except Exception as e:
        logger.error(f"Error publishing price board update: {e}")
        # Reset exchange để trigger reconnect ở lần tiếp theo
        rabbitmq_price_board_exchange = None


def validate_symbols(symbols_list):
    """
    Validate và clean danh sách symbols
    
    Args:
        symbols_list: List of stock symbols
    
    Returns:
        List of cleaned, valid symbols
    """
    valid_symbols = []
    for symbol in symbols_list:
        if not symbol:
            continue
        # Clean: strip whitespace, uppercase, remove special chars
        cleaned = str(symbol).strip().upper()
        # Validate: chỉ chấp nhận chữ cái và số (3-4 ký tự thường gặp)
        if cleaned and cleaned.isalnum() and 1 <= len(cleaned) <= 10:
            valid_symbols.append(cleaned)
        else:
            logger.warning(f"Invalid symbol filtered out: '{symbol}' (cleaned: '{cleaned}')")
    
    return valid_symbols


async def update_price_board_realtime():
    """
    Background task: Cập nhật bảng giá realtime mỗi PRICE_BOARD_UPDATE_INTERVAL giây
    và publish qua RabbitMQ để alert-service push qua WebSocket
    """
    logger.info(f"Starting price board realtime update loop (interval: {PRICE_BOARD_UPDATE_INTERVAL}s)")
    
    while True:
        try:
            if Trading is None:
                logger.warning("Trading API not available, skipping price board update")
                await asyncio.sleep(PRICE_BOARD_UPDATE_INTERVAL)
                continue
            
            # Lấy tất cả mã Việt Nam từ database (không bao gồm US stocks)
            vietnam_stocks = list(stocks_collection.find(
                {"market": {"$ne": "US"}},
                {"symbol": 1}
            ))
            symbols_list = [stock['symbol'] for stock in vietnam_stocks]
            
            # Validate và clean symbols
            symbols_list = validate_symbols(symbols_list)
            
            if not symbols_list:
                logger.debug("No valid stocks to fetch price board")
                await asyncio.sleep(PRICE_BOARD_UPDATE_INTERVAL)
                continue
            
            logger.debug(f"Fetching price board for {len(symbols_list)} valid symbols")
            
            # Khởi tạo Trading adapter
            trading = Trading(source="vci")
            
            # Lấy bảng giá với error handling
            try:
                df = trading.price_board(symbols_list=symbols_list)
            except Exception as api_error:
                logger.error(f"Trading API error: {api_error}")
                logger.debug(f"Failed symbols list (first 10): {symbols_list[:10]}")
                await asyncio.sleep(PRICE_BOARD_UPDATE_INTERVAL)
                continue
            
            if df is None or df.empty:
                logger.debug("Empty price board data received")
                await asyncio.sleep(PRICE_BOARD_UPDATE_INTERVAL)
                continue
            
            # === Xử lý dữ liệu tương tự get_price_board API ===
            result_df = pd.DataFrame()
            
            try:
                result_df['symbol'] = df[('listing', 'symbol')].astype(str)
                result_df['refPrice'] = df[('listing', 'ref_price')].fillna(0).astype(float)
                result_df['ceilingPrice'] = df[('listing', 'ceiling')].fillna(0).astype(float)
                result_df['floorPrice'] = df[('listing', 'floor')].fillna(0).astype(float)
                result_df['matchPrice'] = df[('match', 'match_price')].fillna(0).astype(float)
                result_df['matchVolume'] = df[('match', 'accumulated_volume')].fillna(0).astype(int)
                result_df['matchValue'] = df[('match', 'accumulated_value')].fillna(0).astype(float)
                result_df['highest'] = df[('match', 'highest')].fillna(0).astype(float)
                result_df['lowest'] = df[('match', 'lowest')].fillna(0).astype(float)
                result_df['openPrice'] = df[('match', 'open_price')].fillna(0).astype(float)
                result_df['avgPrice'] = df[('match', 'avg_match_price')].fillna(0).astype(float)
                result_df['bid1Price'] = df[('bid_ask', 'bid_1_price')].fillna(0).astype(float)
                result_df['bid1Volume'] = df[('bid_ask', 'bid_1_volume')].fillna(0).astype(int)
                result_df['bid2Price'] = df[('bid_ask', 'bid_2_price')].fillna(0).astype(float)
                result_df['bid2Volume'] = df[('bid_ask', 'bid_2_volume')].fillna(0).astype(int)
                result_df['bid3Price'] = df[('bid_ask', 'bid_3_price')].fillna(0).astype(float)
                result_df['bid3Volume'] = df[('bid_ask', 'bid_3_volume')].fillna(0).astype(int)
                result_df['ask1Price'] = df[('bid_ask', 'ask_1_price')].fillna(0).astype(float)
                result_df['ask1Volume'] = df[('bid_ask', 'ask_1_volume')].fillna(0).astype(int)
                result_df['ask2Price'] = df[('bid_ask', 'ask_2_price')].fillna(0).astype(float)
                result_df['ask2Volume'] = df[('bid_ask', 'ask_2_volume')].fillna(0).astype(int)
                result_df['ask3Price'] = df[('bid_ask', 'ask_3_price')].fillna(0).astype(float)
                result_df['ask3Volume'] = df[('bid_ask', 'ask_3_volume')].fillna(0).astype(int)
            except KeyError as e:
                logger.error(f"Missing column in price board data: {e}")
                await asyncio.sleep(PRICE_BOARD_UPDATE_INTERVAL)
                continue
            
            # Tính change và changePercent
            result_df['change'] = (result_df['matchPrice'] - result_df['refPrice']).round(2)
            result_df['changePercent'] = (
                (result_df['change'] / result_df['refPrice'].replace(0, 1)) * 100
            ).round(2)
            result_df.loc[result_df['refPrice'] == 0, 'changePercent'] = 0
            
            # Chuyển đổi sang list of dicts
            price_board_data = result_df.to_dict(orient='records')
            
            # Publish to RabbitMQ
            await publish_price_board_update(price_board_data)
            
            logger.debug(f"Price board updated: {len(price_board_data)} stocks")
            
        except Exception as e:
            logger.error(f"Error in price board realtime update: {e}")
        
        await asyncio.sleep(PRICE_BOARD_UPDATE_INTERVAL)


def is_database_empty():
    """Kiểm tra xem database có dữ liệu hay không"""
    try:
        stocks_count = stocks_collection.count_documents({})
        return stocks_count == 0
    except Exception as e:
        logger.error(f"Failed to check database: {e}")
        return True


def clear_database():
    """Xóa toàn bộ dữ liệu trong stocks và candlesticks (chỉ khi được yêu cầu rõ ràng)"""
    try:
        stocks_count = stocks_collection.count_documents({})
        candles_count = candlesticks_collection.count_documents({})
        
        stocks_collection.delete_many({})
        candlesticks_collection.delete_many({})
        
        logger.info(f"Cleared database: {stocks_count} stocks, {candles_count} candlesticks")
        return True
    except Exception as e:
        logger.error(f"Failed to clear database: {e}")
        return False


def get_last_candle_date(stock_id: str) -> str:
    """Lấy ngày của candle gần nhất trong DB cho một stock
    
    Returns:
        date_str (YYYY-MM-DD) hoặc None nếu không có candle
    """
    try:
        # Query candle gần nhất (sorted descending by date)
        latest_candle = candlesticks_collection.find_one(
            {"stock_id": stock_id},
            sort=[("date", -1)]
        )
        
        if latest_candle:
            # Chuyển date_str từ yyyyMMdd sang yyyy-MM-dd
            date_str = latest_candle['date_str']
            return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
        return None
    except Exception as e:
        logger.error(f"Error getting last candle date for stock_id {stock_id}: {e}")
        return None


def get_stock_data_yfinance(symbol: str, period: str = "5y"):
    """
    Lấy dữ liệu lịch sử từ yfinance
    
    Args:
        symbol: Mã cổ phiếu
        period: Khoảng thời gian (mặc định 5y)
    """
    try:
        if yf is None:
            logger.error("yfinance is not installed")
            return None
        
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval="1d", prepost=True)
        
        if df is not None and not df.empty:
            df = df.dropna()
            df.columns = df.columns.str.lower()
            logger.info(f"Fetched {len(df)} records for {symbol} using yfinance")
            return df
        else:
            logger.warning(f"No data returned for {symbol}")
            return None
            
    except Exception as e:
        logger.error(f"Error fetching data for {symbol} with yfinance: {e}")
        return None


def get_stock_data_vnstock(symbol: str, market: str, start_date: str = None, end_date: str = None):
    """
    Lấy dữ liệu lịch sử từ vnstock
    
    Args:
        symbol: Mã cổ phiếu
        market: Sàn giao dịch
        start_date: Ngày bắt đầu (YYYY-MM-DD)
        end_date: Ngày kết thúc (YYYY-MM-DD)
    """
    try:
        if Vnstock is None:
            logger.error("vnstock is not installed")
            return None
        
        # Nếu không có ngày, lấy tất cả dữ liệu có thể (từ INITIAL_BACKFILL_DAYS trước)
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=INITIAL_BACKFILL_DAYS)).strftime('%Y-%m-%d')
        if end_date is None:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        # Nếu là thị trường US, dùng MSN source
        if market == 'US':
            # 1. Tìm symbol_id qua search
            search = Vnstock().stock(source='MSN').listing.search_symbol_id(symbol)
            
            if search is None or len(search) == 0:
                logger.error(f"Không tìm thấy symbol_id cho {symbol}")
                return None
            
            symbol_id = search.iloc[0]["symbol_id"]
            logger.info(f"Found symbol_id for {symbol}: {symbol_id}")
            
            # 2. Lấy lịch sử giá
            df = Vnstock().stock(symbol=symbol_id, source='MSN').quote.history(
                start=start_date,
                end=end_date,
                interval="1D"
            )
        else:
            # Thị trường Việt Nam dùng VCI source
            stock = Vnstock().stock(symbol=symbol, source='VCI')
            df = stock.quote.history(start=start_date, end=end_date, interval="1D")
        
        if df is not None and not df.empty:
            logger.info(f"Fetched {len(df)} records for {symbol}")
            return df
        else:
            logger.warning(f"No data returned for {symbol}")
            return None
            
    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {e}")
        return None


def save_stock_to_db(symbol: str, name: str, market: str, country: str = "Vietnam"):
    """Lưu thông tin cổ phiếu vào database"""
    try:
        stock_doc = {
            "symbol": symbol,
            "name": name,
            "market": market,
            "country": country,
            "data_source": "vnstock",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        result = stocks_collection.update_one(
            {"symbol": symbol},
            {"$set": stock_doc},
            upsert=True
        )
        
        # Lấy stock_id
        stock = stocks_collection.find_one({"symbol": symbol})
        return str(stock['_id']) if stock else None
        
    except Exception as e:
        logger.error(f"Error saving stock {symbol}: {e}")
        return None


def save_candlesticks_to_db(stock_id: str, df):
    """Lưu dữ liệu nến vào database với composite ID"""
    try:
        if df is None or df.empty:
            return 0
        
        # Reset index để time trở thành column
        df_reset = df.reset_index()
        
        # Chuẩn bị dữ liệu
        candlesticks = []
        for _, row in df_reset.iterrows():
            # Xử lý timestamp từ cột 'time' hoặc index
            try:
                if 'time' in row:
                    date_val = row['time']
                elif 'date' in row:
                    date_val = row['date']
                else:
                    # Lấy cột đầu tiên (thường là time/date)
                    date_val = row.iloc[0]
                
                # Chuyển đổi sang datetime object để format
                if isinstance(date_val, (int, float)):
                    dt = datetime.fromtimestamp(int(date_val))
                elif hasattr(date_val, 'to_pydatetime'):
                    dt = date_val.to_pydatetime()
                elif hasattr(date_val, 'timestamp'):
                    dt = date_val
                else:
                    # Parse string date
                    date_str = str(date_val)[:10]  # Lấy YYYY-MM-DD
                    dt = datetime.strptime(date_str, '%Y-%m-%d')
                
                # Tạo các định dạng date
                timestamp = int(dt.timestamp())
                date_str = dt.strftime('%Y%m%d')  # Format: yyyyMMdd
                
            except Exception as e:
                logger.warning(f"Error parsing date for row: {e}, skipping")
                continue
            
            # Tạo composite ID: stock_id + "_" + yyyyMMdd
            composite_id = f"{stock_id}_{date_str}"
            
            candle = {
                "_id": composite_id,  # Sử dụng _id làm primary key
                "stock_id": stock_id,
                "date": timestamp,  # Timestamp for sorting and time-based queries
                "date_str": date_str,  # yyyyMMdd format for easy filtering
                "open": float(row.get('open', 0)),
                "high": float(row.get('high', 0)),
                "low": float(row.get('low', 0)),
                "close": float(row.get('close', 0)),
                "volume": float(row.get('volume', 0))
            }
            candlesticks.append(candle)
        
        # Bulk insert với upsert - sử dụng pymongo.UpdateOne
        from pymongo import UpdateOne
        
        operations = []
        for candle in candlesticks:
            operations.append(
                UpdateOne(
                    filter={"_id": candle["_id"]},
                    update={"$set": candle},
                    upsert=True
                )
            )
        
        if operations:
            result = candlesticks_collection.bulk_write(operations)
            logger.info(f"Saved/Updated {result.upserted_count + result.modified_count} candlesticks for stock_id: {stock_id}")
            
            # Trả về list các candle mới được insert/update
            # Chỉ trả về những candle có upserted hoặc modified
            new_candles = []
            
            # Lấy các candle được upserted (mới tạo)
            if result.upserted_count > 0:
                for idx, candle_id in result.upserted_ids.items():
                    if idx < len(candlesticks):
                        new_candles.append(candlesticks[idx])
            
            # Lấy các candle được modified (cập nhật)
            # Vì bulk_write không trả về modified IDs, ta sẽ lấy tất cả candles có trong batch
            # và kiểm tra updated_at (hoặc đơn giản trả về tất cả nếu có modified)
            if result.modified_count > 0:
                # Lấy candles không nằm trong upserted_ids
                upserted_indices = set(result.upserted_ids.keys())
                for idx, candle in enumerate(candlesticks):
                    if idx not in upserted_indices:
                        new_candles.append(candle)
            
            return new_candles
        
        return []
        
    except Exception as e:
        logger.error(f"Error saving candlesticks for stock_id {stock_id}: {e}")
        return []


async def initialize_data():
    """Khởi tạo dữ liệu ban đầu (chỉ khi DB trống hoặc RESET_DB=True)
    
    Lưu ý: Không sử dụng STOCK_SYMBOLS cứng nữa.
    - Nếu DB trống: Chỉ init dữ liệu US stocks (hardcoded vì không có admin để thêm)
    - Nếu DB có data: Lấy danh sách từ database để update
    - Admin sẽ quản lý danh sách VN stocks qua API
    """
    logger.info("Starting data initialization...")
    
    # Kiểm tra xem DB đã có dữ liệu hay không
    db_empty = is_database_empty()
    
    # Nếu DB đã có dữ liệu và RESET_DB=False, bỏ qua initialization
    if not db_empty and not RESET_DB:
        logger.info("Database already has data. Skipping initialization.")
        logger.info("Admin can manage Vietnam stocks via /api/admin/stocks endpoints.")
        return
    
    # Nếu cần reset, xóa dữ liệu cũ
    if not db_empty and RESET_DB:
        logger.info("RESET_DB=True. Clearing existing data...")
        clear_database()
    
    total_stocks = 0
    total_candles = 0
    start_time = time.time()
    
    # === Không còn init VN stocks từ STOCK_SYMBOLS ===
    # Admin sẽ thêm VN stocks qua trang quản lý
    logger.info("=== Vietnam stocks will be managed by Admin via web interface ===")
    logger.info("Use /api/admin/stocks endpoints to add stocks")
    
    # === Chỉ init dữ liệu cổ phiếu quốc tế (US stocks - hardcoded) ===
    logger.info("=== Initializing international stock data (US - hardcoded) ===")
    
    for symbol in INTERNATIONAL_SYMBOLS:
        try:
            # Lưu thông tin stock trước
            stock_id = save_stock_to_db(
                symbol=symbol,
                name=f"{symbol} - US",
                market="US",
                country="United States"
            )
            
            if stock_id:
                total_stocks += 1
                
                # Lấy dữ liệu lịch sử bằng yfinance
                logger.info(f"Fetching historical data for {symbol} (US) using yfinance")
                df = get_stock_data_yfinance(symbol, period="10y")
                
                if df is not None:
                    # Lưu candlesticks (trả về list candles)
                    new_candles = save_candlesticks_to_db(stock_id, df)
                    total_candles += len(new_candles)
                
                # Delay để tránh rate limit
                await asyncio.sleep(2)
            
        except Exception as e:
            logger.error(f"Error processing international stock {symbol}: {e}")
            continue
    
    elapsed = time.time() - start_time
    logger.info(f"=== Total initialization completed: {total_stocks} stocks, {total_candles} candlesticks (took {elapsed:.2f}s) ===")


async def update_latest_data():
    """Cập nhật dữ liệu incrementally cho cổ phiếu Việt Nam dựa trên ngày cuối cùng trong DB"""
    while True:
        try:
            logger.info("Starting periodic update (incremental sync)...")
            
            # Chỉ lấy danh sách stocks Việt Nam (không lấy US stocks)
            stocks = list(stocks_collection.find({"market": {"$ne": "US"}}))
            
            updated_count = 0
            end_date = datetime.now().strftime('%Y-%m-%d')
            
            for stock in stocks:
                try:
                    symbol = stock['symbol']
                    market = stock['market']
                    stock_id = str(stock['_id'])
                    
                    # Lấy ngày của candle gần nhất trong DB
                    last_candle_date = get_last_candle_date(stock_id)
                    
                    if last_candle_date:
                        # Tính số ngày khoảng trống giữa last_candle_date và hiện tại
                        last_date_dt = datetime.strptime(last_candle_date, '%Y-%m-%d')
                        days_gap = (datetime.now() - last_date_dt).days
                        
                        # Nếu khoảng cách > UPDATE_LOOKBACK_DAYS, cần backfill toàn bộ khoảng trống
                        if days_gap > UPDATE_LOOKBACK_DAYS:
                            # Lấy từ ngày cuối cùng (không trừ lookback) để tránh bỏ sót
                            start_date = last_candle_date
                            logger.warning(f"Gap detected for {symbol}: {days_gap} days. Full backfill from {start_date} to {end_date}")
                        else:
                            # Nếu đã có dữ liệu gần đây, sync từ (last_date - lookback_days) để recover missing/revised data
                            start_date_dt = last_date_dt - timedelta(days=UPDATE_LOOKBACK_DAYS)
                            start_date = start_date_dt.strftime('%Y-%m-%d')
                            logger.info(f"Incremental sync for {symbol}: {start_date} to {end_date}")
                    else:
                        # Nếu chưa có dữ liệu, lấy từ UPDATE_LOOKBACK_DAYS trước
                        start_date = (datetime.now() - timedelta(days=UPDATE_LOOKBACK_DAYS)).strftime('%Y-%m-%d')
                        logger.info(f"First sync for {symbol}: {start_date} to {end_date}")
                    
                    # Lấy dữ liệu từ start_date đến end_date
                    df = get_stock_data_vnstock(symbol, market, start_date, end_date) 
                    
                    if df is not None and not df.empty:
                        # Lưu vào DB và nhận về list các candle mới được insert/update
                        new_candles = save_candlesticks_to_db(stock_id, df)
                        
                        if len(new_candles) > 0:
                            updated_count += 1
                            
                            # Update timestamp
                            stocks_collection.update_one(
                                {"_id": stock['_id']},
                                {"$set": {"updated_at": datetime.now()}}
                            )
                            
                            # Chỉ publish các candle MỚI được insert/update
                            logger.info(f"Publishing {len(new_candles)} new/updated candles for {symbol}")
                            for candle in new_candles:
                                try:
                                    await publish_stock_update(candle, symbol)
                                except Exception as e:
                                    logger.warning(f"Error publishing candle for {symbol}: {e}")
                                    continue
                    
                    # Delay ngắn giữa các request
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    logger.error(f"Error updating {stock.get('symbol', 'unknown')}: {e}")
                    continue
            
            logger.info(f"Update completed: {updated_count}/{len(stocks)} stocks updated")
            
            # Chờ đến lần update tiếp theo (15 phút thay vì 1 phút)
            logger.info(f"Waiting {UPDATE_INTERVAL} seconds until next update...")
            await asyncio.sleep(UPDATE_INTERVAL)
            
        except Exception as e:
            logger.error(f"Error in update loop: {e}")
            await asyncio.sleep(UPDATE_INTERVAL)


@app.on_event("startup")
async def startup_event():

    global update_task, price_board_task
    
    logger.info(f"Starting up Stock Data Service (RESET_DB={RESET_DB})...")
    
    if not init_mongodb():
        return
    
    if not await init_rabbitmq():
        logger.warning("RabbitMQ initialization failed, will continue without message publishing")
    
    # Khởi tạo dữ liệu chỉ khi DB trống hoặc RESET_DB=True
    await initialize_data()

    # Bắt đầu background update loop cho candlestick data
    update_task = asyncio.create_task(update_latest_data())
    
    # Bắt đầu background update loop cho price board realtime
    price_board_task = asyncio.create_task(update_price_board_realtime())
    
    logger.info(f"Server started on port {PORT}. Candlestick update: {UPDATE_INTERVAL}s, Price board update: {PRICE_BOARD_UPDATE_INTERVAL}s")


@app.on_event("shutdown")
async def shutdown_event():
    global update_task, price_board_task, rabbitmq_connection

    if update_task:
        update_task.cancel()
        try:
            await update_task
        except asyncio.CancelledError:
            pass
    
    if price_board_task:
        price_board_task.cancel()
        try:
            await price_board_task
        except asyncio.CancelledError:
            pass

    if rabbitmq_connection:
        await rabbitmq_connection.close()
    
    if mongo_client:
        mongo_client.close()
    
    logger.info("Server shutdown complete")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Stock Data Service",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/stocks")
async def get_stocks(market: str = None):
    """Lấy danh sách cổ phiếu"""
    try:
        query = {}
        if market:
            query["market"] = market.upper()
        
        stocks = list(stocks_collection.find(query, {"_id": 0}))
        return {"stocks": stocks, "total": len(stocks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/candlesticks/{symbol}")
async def get_candlesticks(
    symbol: str, 
    limit: int = 100,
    start_date: str = None,
    end_date: str = None
):
    """
    Lấy dữ liệu nến của một mã cổ phiếu
    
    Args:
        symbol: Mã cổ phiếu
        limit: Số lượng nến tối đa (mặc định 100)
        start_date: Ngày bắt đầu (format: YYYYMMDD hoặc YYYY-MM-DD)
        end_date: Ngày kết thúc (format: YYYYMMDD hoặc YYYY-MM-DD)
    """
    try:
        # Tìm stock
        stock = stocks_collection.find_one({"symbol": symbol.upper()})
        if not stock:
            raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")
        
        stock_id = str(stock['_id'])
        
        # Xây dựng query
        query = {"stock_id": stock_id}
        
        # Thêm filter theo date range nếu có
        if start_date or end_date:
            date_filter = {}
            
            # Convert start_date
            if start_date:
                # Xử lý format YYYY-MM-DD hoặc YYYYMMDD
                start_str = start_date.replace('-', '')
                date_filter["$gte"] = start_str
            
            # Convert end_date
            if end_date:
                # Xử lý format YYYY-MM-DD hoặc YYYYMMDD
                end_str = end_date.replace('-', '')
                date_filter["$lte"] = end_str
            
            if date_filter:
                query["date_str"] = date_filter
        
        # Lấy candlesticks, không cần ẩn _id vì nó chứa thông tin hữu ích
        candles = list(candlesticks_collection.find(
            query,
            {"_id": 1, "stock_id": 1, "date": 1, "date_str": 1, 
             "open": 1, "high": 1, "low": 1, "close": 1, "volume": 1}
        ).sort("date", -1).limit(limit))
        
        # Đổi tên _id thành id trong response để phù hợp với Java Entity
        for candle in candles:
            candle["id"] = candle.pop("_id")
        
        return {
            "symbol": symbol,
            "candlesticks": candles,
            "total": len(candles)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/force-update")
async def force_update():
    """Trigger cập nhật dữ liệu ngay lập tức"""
    try:
        logger.info("Manual update triggered")
        # Thực hiện cập nhật trong background
        asyncio.create_task(update_latest_data_once())
        return {"message": "Update started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/price-board")
async def get_price_board(symbols: str = None):
    """
    Lấy bảng giá real-time của các mã cổ phiếu (TỐI ƯU HÓA với Pandas Vectorization)
    
    Args:
        symbols: Danh sách mã cổ phiếu, cách nhau bởi dấu phẩy (VD: VCB,ACB,TCB)
                 Nếu không truyền sẽ lấy tất cả mã Việt Nam từ database
    
    Returns:
        List of stock quotes with trading information
    """
    try:
        if Trading is None:
            raise HTTPException(status_code=503, detail="Trading API not available")
        
        # Lấy danh sách mã cổ phiếu
        if symbols:
            symbols_list = [s.strip().upper() for s in symbols.split(',') if s.strip()]
        else:
            # Lấy tất cả mã Việt Nam từ database (không bao gồm US stocks)
            vietnam_stocks = list(stocks_collection.find(
                {"market": {"$ne": "US"}},
                {"symbol": 1}
            ))
            symbols_list = [stock['symbol'] for stock in vietnam_stocks]
        
        # Validate và clean symbols
        symbols_list = validate_symbols(symbols_list)
        
        if not symbols_list:
            return {"data": [], "total": 0, "error": "No valid symbols provided"}
        
        logger.info(f"Fetching price board for {len(symbols_list)} valid symbols")
        
        # Khởi tạo Trading adapter
        trading = Trading(source="vci")
        
        # Lấy bảng giá với error handling
        try:
            df = trading.price_board(symbols_list=symbols_list)
        except Exception as api_error:
            logger.error(f"Trading API error: {api_error}")
            logger.debug(f"Failed symbols list (first 10): {symbols_list[:10]}")
            return {"data": [], "total": 0, "error": f"Trading API error: {str(api_error)}"}
        
        if df is None or df.empty:
            return {"data": [], "total": 0}
        
        # === TỐI ƯU HÓA: Sử dụng Pandas Vectorization thay vì vòng lặp ===
        
        # Tạo DataFrame mới với cấu trúc phẳng (flatten columns)
        result_df = pd.DataFrame()
        
        # Trích xuất dữ liệu từ multi-level columns (nhanh hơn vòng lặp)
        try:
            result_df['symbol'] = df[('listing', 'symbol')].astype(str)
            result_df['refPrice'] = df[('listing', 'ref_price')].fillna(0).astype(float)
            result_df['ceilingPrice'] = df[('listing', 'ceiling')].fillna(0).astype(float)
            result_df['floorPrice'] = df[('listing', 'floor')].fillna(0).astype(float)
            result_df['matchPrice'] = df[('match', 'match_price')].fillna(0).astype(float)
            result_df['matchVolume'] = df[('match', 'accumulated_volume')].fillna(0).astype(int)
            result_df['matchValue'] = df[('match', 'accumulated_value')].fillna(0).astype(float)
            result_df['highest'] = df[('match', 'highest')].fillna(0).astype(float)
            result_df['lowest'] = df[('match', 'lowest')].fillna(0).astype(float)
            result_df['openPrice'] = df[('match', 'open_price')].fillna(0).astype(float)
            result_df['avgPrice'] = df[('match', 'avg_match_price')].fillna(0).astype(float)
            result_df['bid1Price'] = df[('bid_ask', 'bid_1_price')].fillna(0).astype(float)
            result_df['bid1Volume'] = df[('bid_ask', 'bid_1_volume')].fillna(0).astype(int)
            result_df['bid2Price'] = df[('bid_ask', 'bid_2_price')].fillna(0).astype(float)
            result_df['bid2Volume'] = df[('bid_ask', 'bid_2_volume')].fillna(0).astype(int)
            result_df['bid3Price'] = df[('bid_ask', 'bid_3_price')].fillna(0).astype(float)
            result_df['bid3Volume'] = df[('bid_ask', 'bid_3_volume')].fillna(0).astype(int)
            result_df['ask1Price'] = df[('bid_ask', 'ask_1_price')].fillna(0).astype(float)
            result_df['ask1Volume'] = df[('bid_ask', 'ask_1_volume')].fillna(0).astype(int)
            result_df['ask2Price'] = df[('bid_ask', 'ask_2_price')].fillna(0).astype(float)
            result_df['ask2Volume'] = df[('bid_ask', 'ask_2_volume')].fillna(0).astype(int)
            result_df['ask3Price'] = df[('bid_ask', 'ask_3_price')].fillna(0).astype(float)
            result_df['ask3Volume'] = df[('bid_ask', 'ask_3_volume')].fillna(0).astype(int)
        except KeyError as e:
            logger.error(f"Missing column in price board data: {e}")
            return {"data": [], "total": 0, "error": f"Data structure error: {str(e)}"}
        
        # Tính change và changePercent (VECTORIZED - nhanh gấp nhiều lần)
        result_df['change'] = (result_df['matchPrice'] - result_df['refPrice']).round(2)
        result_df['changePercent'] = (
            (result_df['change'] / result_df['refPrice'].replace(0, 1)) * 100
        ).round(2)
        # Đặt changePercent = 0 nếu refPrice = 0
        result_df.loc[result_df['refPrice'] == 0, 'changePercent'] = 0
        
        # Chuyển đổi sang list of dicts (nhanh nhất với orient='records')
        data = result_df.to_dict(orient='records')
        
        logger.info(f"Successfully fetched price board for {len(data)} symbols")
        
        return {
            "data": data,
            "total": len(data),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching price board: {e}")
        # Trả về empty data thay vì 500 error để UI vẫn hoạt động
        return {"data": [], "total": 0, "error": str(e)}


@app.get("/api/candlestick")
async def get_candlestick_by_id(candlestick_id: str = None, stock_id: str = None, date: str = None):
    """
    Lấy một nến cụ thể theo composite ID hoặc stock_id + date
    
    Args:
        candlestick_id: Composite ID (format: stock_id_yyyyMMdd)
        stock_id: ID của stock (dùng kèm với date)
        date: Ngày (format: YYYYMMDD hoặc YYYY-MM-DD)
    
    Example:
        /api/candlestick?candlestick_id=507f1f77bcf86cd799439011_20250117
        /api/candlestick?stock_id=507f1f77bcf86cd799439011&date=20250117
        /api/candlestick?stock_id=507f1f77bcf86cd799439011&date=2025-01-17
    """
    try:
        # Nếu có candlestick_id thì query trực tiếp bằng _id
        if candlestick_id:
            candle = candlesticks_collection.find_one({"_id": candlestick_id})
        # Nếu có stock_id và date thì tạo composite ID
        elif stock_id and date:
            # Convert date format nếu cần
            date_str = date.replace('-', '')
            composite_id = f"{stock_id}_{date_str}"
            candle = candlesticks_collection.find_one({"_id": composite_id})
        else:
            raise HTTPException(
                status_code=400, 
                detail="Either candlestick_id or (stock_id + date) is required"
            )
        
        if not candle:
            raise HTTPException(status_code=404, detail="Candlestick not found")
        
        # Đổi tên _id thành id trong response để phù hợp với Java Entity
        candle["id"] = candle.pop("_id")
        
        return candle
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def update_latest_data_once():
    """Cập nhật dữ liệu một lần (cho force update) - sử dụng incremental sync"""
    stocks = list(stocks_collection.find({"market": {"$ne": "US"}}))  # Chỉ Vietnam stocks
    end_date = datetime.now().strftime('%Y-%m-%d')
    
    updated_count = 0
    for stock in stocks:
        try:
            symbol = stock['symbol']
            market = stock['market']
            stock_id = str(stock['_id'])
            
            # Lấy ngày của candle gần nhất trong DB
            last_candle_date = get_last_candle_date(stock_id)
            
            if last_candle_date:
                # Tính số ngày khoảng trống
                last_date_dt = datetime.strptime(last_candle_date, '%Y-%m-%d')
                days_gap = (datetime.now() - last_date_dt).days
                
                # Nếu khoảng cách > UPDATE_LOOKBACK_DAYS, backfill toàn bộ
                if days_gap > UPDATE_LOOKBACK_DAYS:
                    start_date = last_candle_date
                    logger.warning(f"Force update: Gap detected for {symbol}: {days_gap} days. Backfilling from {start_date}")
                else:
                    # Incremental sync từ (last_date - lookback_days)
                    start_date_dt = last_date_dt - timedelta(days=UPDATE_LOOKBACK_DAYS)
                    start_date = start_date_dt.strftime('%Y-%m-%d')
            else:
                # Nếu chưa có dữ liệu
                start_date = (datetime.now() - timedelta(days=UPDATE_LOOKBACK_DAYS)).strftime('%Y-%m-%d')
            
            logger.info(f"Force update for {symbol}: {start_date} to {end_date}")
            df = get_stock_data_vnstock(symbol, market, start_date, end_date)
            
            if df is not None and not df.empty:
                new_candles = save_candlesticks_to_db(stock_id, df)
                if len(new_candles) > 0:
                    updated_count += 1
                    stocks_collection.update_one(
                        {"_id": stock['_id']},
                        {"$set": {"updated_at": datetime.now()}}
                    )
            
            await asyncio.sleep(2)
        except Exception as e:
            logger.error(f"Error in force update for {stock.get('symbol')}: {e}")
    
    logger.info(f"Force update completed: {updated_count}/{len(stocks)} stocks updated")


@app.get("/api/company/news/{symbol}")
async def get_company_news(symbol: str, limit: int = 20, source: str = "vci"):
    """
    Lấy tin tức liên quan đến mã cổ phiếu (Nâng cấp với vnstock_news - Gói Silver)
    
    Args:
        symbol: Mã cổ phiếu (VD: VCI, ACB, TCB)
        limit: Số lượng tin tức tối đa (mặc định 20)
        source: Nguồn tin tức:
                - "vci": Từ VCI/Company API (mặc định)
                - "cafef": Từ CafeF
                - "vietstock": Từ VietStock  
                - "vnexpress": Từ VnExpress
                - "all": Tổng hợp từ nhiều nguồn
    
    Returns:
        List of news articles with title, url, publish_time, summary, source
    """
    try:
        symbol = symbol.upper()
        logger.info(f"Fetching news for {symbol} from source: {source}")
        
        news_list = []
        
        # Nếu source là "vci" hoặc "all", lấy tin từ Company API trước
        if source in ["vci", "all"] and Company is not None:
            try:
                company = Company(source="vci", symbol=symbol)
                news_df = company.news()
                
                if news_df is not None and not news_df.empty:
                    for _, row in news_df.head(limit if source == "vci" else limit // 2).iterrows():
                        try:
                            publish_time = None
                            if 'public_date' in row and row['public_date']:
                                try:
                                    publish_time = datetime.fromtimestamp(int(row['public_date'])/1000).isoformat()
                                except:
                                    publish_time = None
                            
                            news_item = {
                                "id": str(row.get('news_id', row.get('id', ''))),
                                "title": str(row.get('news_title', '')),
                                "subTitle": str(row.get('news_sub_title', '')),
                                "summary": str(row.get('news_short_content', ''))[:500],
                                "url": str(row.get('news_source_link', '')),
                                "imageUrl": str(row.get('news_image_url', '')),
                                "publishTime": publish_time,
                                "priceChange": float(row.get('price_change_pct', 0)) if row.get('price_change_pct') else 0,
                                "source": "VCI"
                            }
                            news_list.append(news_item)
                        except Exception as e:
                            logger.error(f"Error processing VCI news row: {e}")
                            continue
            except Exception as e:
                logger.warning(f"Could not fetch VCI news for {symbol}: {e}")
        
        # Nếu source là báo cụ thể hoặc "all", sử dụng vnstock_news
        if source != "vci" and VNSTOCK_NEWS_AVAILABLE:
            news_sources = [source] if source != "all" else ["cafef", "vietstock"]
            
            for news_source in news_sources:
                try:
                    crawler = NewsCrawler(site_name=news_source)
                    articles_df = crawler.get_articles_from_feed(
                        limit_per_feed=limit if source != "all" else limit // 2,
                        timeout=10
                    )
                    
                    if articles_df is not None and not articles_df.empty:
                        # Lọc tin theo keyword (tên mã cổ phiếu)
                        keyword = symbol.lower()
                        
                        for _, row in articles_df.iterrows():
                            try:
                                title = str(row.get('title', '')).lower()
                                description = str(row.get('short_description', '')).lower()
                                
                                # Chỉ lấy tin có liên quan đến mã cổ phiếu (nếu có keyword)
                                # Hoặc lấy tất cả nếu là source cụ thể
                                if source != "all" or keyword in title or keyword in description:
                                    publish_time = None
                                    if 'publish_time' in row and row['publish_time']:
                                        try:
                                            if isinstance(row['publish_time'], datetime):
                                                publish_time = row['publish_time'].isoformat()
                                            else:
                                                publish_time = str(row['publish_time'])
                                        except:
                                            publish_time = None
                                    
                                    news_item = {
                                        "id": f"{news_source}_{hash(row.get('url', ''))}",
                                        "title": str(row.get('title', '')),
                                        "subTitle": "",
                                        "summary": str(row.get('short_description', ''))[:500],
                                        "url": str(row.get('url', '')),
                                        "imageUrl": "",
                                        "publishTime": publish_time,
                                        "priceChange": 0,
                                        "source": news_source.upper()
                                    }
                                    news_list.append(news_item)
                            except Exception as e:
                                logger.error(f"Error processing {news_source} news row: {e}")
                                continue
                                
                except Exception as e:
                    logger.warning(f"Could not fetch {news_source} news: {e}")
                    continue
        
        # Sắp xếp theo thời gian publish (mới nhất lên trước)
        news_list.sort(key=lambda x: x.get('publishTime') or '', reverse=True)
        
        # Giới hạn số lượng
        news_list = news_list[:limit]
        
        logger.info(f"Successfully fetched {len(news_list)} news for {symbol}")
        
        return {
            "symbol": symbol,
            "news": news_list,
            "total": len(news_list),
            "timestamp": datetime.now().isoformat(),
            "source": source
        }
        
    except Exception as e:
        logger.error(f"Error fetching news for {symbol}: {e}")
        return {"symbol": symbol, "news": [], "total": 0, "error": str(e)}


@app.get("/api/market/news")
async def get_market_news(
    source: str = "cafef",
    limit: int = 30,
    keyword: str = None
):
    """
    Lấy tin tức thị trường tổng hợp từ các nguồn báo tài chính (vnstock_news - Gói Silver)
    
    Args:
        source: Nguồn tin tức:
                - "cafef": CafeF (mặc định)
                - "vietstock": VietStock
                - "vnexpress": VnExpress
                - "tuoitre": Tuổi Trẻ
                - "baodautu": Báo Đầu Tư
                - "vneconomy": VnEconomy
                - "all": Tổng hợp từ nhiều nguồn
        limit: Số lượng tin tức tối đa (mặc định 30)
        keyword: Từ khóa tìm kiếm (tùy chọn)
    
    Returns:
        List of market news articles from financial news sources
    """
    try:
        if not VNSTOCK_NEWS_AVAILABLE:
            return {
                "news": [],
                "total": 0,
                "error": "vnstock_news not available. Please upgrade to Silver package.",
                "timestamp": datetime.now().isoformat()
            }
        
        logger.info(f"Fetching market news from {source}, limit={limit}, keyword={keyword}")
        
        news_list = []
        
        # Danh sách các nguồn báo tài chính
        if source == "all":
            news_sources = ["cafef", "vietstock", "vnexpress", "tuoitre"]
            limit_per_source = max(limit // len(news_sources), 10)
        else:
            news_sources = [source]
            limit_per_source = limit
        
        for news_source in news_sources:
            try:
                crawler = NewsCrawler(site_name=news_source)
                articles_df = crawler.get_articles_from_feed(
                    limit_per_feed=limit_per_source,
                    timeout=15
                )
                
                if articles_df is not None and not articles_df.empty:
                    for _, row in articles_df.iterrows():
                        try:
                            title = str(row.get('title', ''))
                            description = str(row.get('short_description', ''))
                            
                            # Lọc theo keyword nếu có
                            if keyword:
                                keyword_lower = keyword.lower()
                                if keyword_lower not in title.lower() and keyword_lower not in description.lower():
                                    continue
                            
                            publish_time = None
                            if 'publish_time' in row and row['publish_time']:
                                try:
                                    if isinstance(row['publish_time'], datetime):
                                        publish_time = row['publish_time'].isoformat()
                                    else:
                                        publish_time = str(row['publish_time'])
                                except:
                                    publish_time = None
                            
                            news_item = {
                                "id": f"{news_source}_{hash(row.get('url', ''))}",
                                "title": title,
                                "subTitle": "",
                                "summary": description[:500] if description else "",
                                "url": str(row.get('url', '')),
                                "imageUrl": "",
                                "publishTime": publish_time,
                                "author": str(row.get('author', '')) if row.get('author') else "",
                                "source": news_source.upper()
                            }
                            news_list.append(news_item)
                        except Exception as e:
                            logger.error(f"Error processing {news_source} market news row: {e}")
                            continue
                            
            except Exception as e:
                logger.warning(f"Could not fetch market news from {news_source}: {e}")
                continue
        
        # Sắp xếp theo thời gian publish (mới nhất lên trước)
        news_list.sort(key=lambda x: x.get('publishTime') or '', reverse=True)
        
        # Giới hạn số lượng
        news_list = news_list[:limit]
        
        logger.info(f"Successfully fetched {len(news_list)} market news articles")
        
        return {
            "news": news_list,
            "total": len(news_list),
            "source": source,
            "keyword": keyword,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching market news: {e}")
        return {"news": [], "total": 0, "error": str(e)}


@app.get("/api/news/sources")
async def get_available_news_sources():
    """
    Lấy danh sách các nguồn tin tức có sẵn
    
    Returns:
        List of available news sources with their status
    """
    sources = [
        {"id": "vci", "name": "VCI (Company News)", "type": "company", "available": Company is not None},
        {"id": "cafef", "name": "CafeF", "type": "market", "available": VNSTOCK_NEWS_AVAILABLE},
        {"id": "vietstock", "name": "VietStock", "type": "market", "available": VNSTOCK_NEWS_AVAILABLE},
        {"id": "vnexpress", "name": "VnExpress", "type": "market", "available": VNSTOCK_NEWS_AVAILABLE},
        {"id": "tuoitre", "name": "Tuổi Trẻ", "type": "market", "available": VNSTOCK_NEWS_AVAILABLE},
        {"id": "baodautu", "name": "Báo Đầu Tư", "type": "market", "available": VNSTOCK_NEWS_AVAILABLE},
        {"id": "vneconomy", "name": "VnEconomy", "type": "market", "available": VNSTOCK_NEWS_AVAILABLE},
    ]
    
    return {
        "sources": sources,
        "vnstock_news_available": VNSTOCK_NEWS_AVAILABLE,
        "vnstock_data_available": VNSTOCK_DATA_AVAILABLE,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/company/info/{symbol}")
async def get_company_info(symbol: str):
    """
    Lấy thông tin chi tiết về công ty sử dụng vnstock_data
    
    Args:
        symbol: Mã cổ phiếu (VD: VCB, ACB, TCB)
    
    Returns:
        Company information including overview, shareholders, officers, subsidiaries, events, trading_stats, ratio_summary
    """
    try:
        if Company is None or not VNSTOCK_DATA_AVAILABLE:
            raise HTTPException(status_code=503, detail="vnstock_data Company API không khả dụng")
        
        symbol = symbol.upper()
        logger.info(f"Đang lấy thông tin công ty cho {symbol} sử dụng vnstock_data...")
        
        # Khởi tạo Company adapter từ vnstock_data
        company = Company(source="vci", symbol=symbol)
        
        # Helper function để convert DataFrame sang JSON-safe
        def df_to_json_safe(df, limit=None):
            if df is None:
                return []
            try:
                if hasattr(df, 'empty') and df.empty:
                    return []
                data = df.head(limit) if limit else df
                
                # Flatten multi-level columns if present
                if hasattr(data, 'columns') and isinstance(data.columns, pd.MultiIndex):
                    data.columns = ['_'.join(map(str, col)).strip() for col in data.columns.values]
                
                data = data.reset_index(drop=True)
                data = data.fillna('')
                result = data.to_dict(orient='records')
                
                import numpy as np
                def clean_value(val):
                    if isinstance(val, (float, np.floating)):
                        if np.isnan(val) or np.isinf(val):
                            return None
                        return float(val)
                    elif isinstance(val, (int, np.integer)):
                        return int(val)
                    elif isinstance(val, bool):
                        return bool(val)
                    elif val is None or val == '':
                        return None
                    return str(val)
                
                cleaned_result = []
                for record in result:
                    cleaned_record = {k: clean_value(v) for k, v in record.items()}
                    cleaned_result.append(cleaned_record)
                
                return cleaned_result
            except Exception as e:
                logger.error(f"Lỗi convert DataFrame: {e}")
                return []
        
        result = {
            "symbol": symbol,
            "overview": None,
            "shareholders": [],
            "officers": [],
            "subsidiaries": [],
            "events": [],
            "tradingStats": None,
            "ratioSummary": None,
            "timestamp": datetime.now().isoformat()
        }
        
        # 1. Lấy thông tin tổng quan công ty
        try:
            logger.info(f"  → Đang lấy overview cho {symbol}...")
            overview_df = company.overview()
            if overview_df is not None and not overview_df.empty:
                overview_data = df_to_json_safe(overview_df)
                result["overview"] = overview_data[0] if overview_data else None
                logger.info(f"     Overview: OK")
        except Exception as e:
            logger.warning(f"     Không thể lấy overview: {e}")
        
        # 2. Lấy danh sách cổ đông lớn
        try:
            logger.info(f"  → Đang lấy shareholders cho {symbol}...")
            shareholders_df = company.shareholders()
            result["shareholders"] = df_to_json_safe(shareholders_df, 20)
            logger.info(f"     Shareholders: {len(result['shareholders'])} records")
        except Exception as e:
            logger.warning(f"     Không thể lấy shareholders: {e}")
        
        # 3. Lấy thông tin ban lãnh đạo
        try:
            logger.info(f"  → Đang lấy officers cho {symbol}...")
            officers_df = company.officers(filter_by='working')
            result["officers"] = df_to_json_safe(officers_df, 30)
            logger.info(f"     Officers: {len(result['officers'])} records")
        except Exception as e:
            logger.warning(f"     Không thể lấy officers: {e}")
        
        # 4. Lấy công ty con/liên kết
        try:
            logger.info(f"  → Đang lấy subsidiaries cho {symbol}...")
            subsidiaries_df = company.subsidiaries()
            result["subsidiaries"] = df_to_json_safe(subsidiaries_df, 50)
            logger.info(f"     Subsidiaries: {len(result['subsidiaries'])} records")
        except Exception as e:
            logger.warning(f"     Không thể lấy subsidiaries: {e}")
        
        # 5. Lấy sự kiện công ty
        try:
            logger.info(f"  → Đang lấy events cho {symbol}...")
            events_df = company.events()
            result["events"] = df_to_json_safe(events_df, 20)
            logger.info(f"     Events: {len(result['events'])} records")
        except Exception as e:
            logger.warning(f"     Không thể lấy events: {e}")
        
        # 6. Lấy thống kê giao dịch
        try:
            logger.info(f"  → Đang lấy trading_stats cho {symbol}...")
            trading_stats_df = company.trading_stats()
            if trading_stats_df is not None and not trading_stats_df.empty:
                trading_data = df_to_json_safe(trading_stats_df)
                result["tradingStats"] = trading_data[0] if trading_data else None
                logger.info(f"     Trading Stats: OK")
        except Exception as e:
            logger.warning(f"     Không thể lấy trading_stats: {e}")
        
        # 7. Lấy tóm tắt chỉ số tài chính (ratio_summary)
        try:
            logger.info(f"  → Đang lấy ratio_summary cho {symbol}...")
            ratio_summary_df = company.ratio_summary()
            if ratio_summary_df is not None and not ratio_summary_df.empty:
                ratio_data = df_to_json_safe(ratio_summary_df)
                result["ratioSummary"] = ratio_data[0] if ratio_data else None
                logger.info(f"     Ratio Summary: OK")
        except Exception as e:
            logger.warning(f"     Không thể lấy ratio_summary: {e}")
        
        logger.info(f"Đã lấy xong thông tin công ty cho {symbol}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi lấy thông tin công ty {symbol}: {e}", exc_info=True)
        return {
            "symbol": symbol,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@app.get("/api/company/financial/{symbol}")
async def get_financial_report(symbol: str, period: str = "year"):
    """
    Lấy báo cáo tài chính của công ty sử dụng vnstock_data
    
    Args:
        symbol: Mã cổ phiếu (VD: VCI, ACB, TCB)
        period: Chu kỳ báo cáo ("year" hoặc "quarter")
    
    Returns:
        Financial reports including balance sheet, income statement, cash flow, and ratio_summary
    """
    try:
        if Finance is None or not VNSTOCK_DATA_AVAILABLE:
            raise HTTPException(status_code=503, detail="vnstock_data Finance API không khả dụng")
        
        symbol = symbol.upper()
        # Validate period
        if period not in ["year", "quarter"]:
            period = "year"
        
        logger.info(f"Đang lấy báo cáo tài chính cho {symbol}, period: {period}...")
        
        # Khởi tạo Finance adapter từ vnstock_data
        finance = Finance(source="vci", symbol=symbol, period=period)
        
        # Lấy các báo cáo tài chính
        logger.info(f"  → Đang lấy balance_sheet cho {symbol}...")
        balance_sheet = finance.balance_sheet(lang="vi")
        logger.info(f"     Balance Sheet: {len(balance_sheet) if balance_sheet is not None else 0} rows")
        
        logger.info(f"  → Đang lấy income_statement cho {symbol}...")
        income_statement = finance.income_statement(lang="vi")
        logger.info(f"     Income Statement: {len(income_statement) if income_statement is not None else 0} rows")
        
        logger.info(f"  → Đang lấy cash_flow cho {symbol}...")
        cash_flow = finance.cash_flow(lang="vi")
        logger.info(f"     Cash Flow: {len(cash_flow) if cash_flow is not None else 0} rows")
        
        logger.info(f"  → Đang lấy ratio cho {symbol}...")
        ratios = finance.ratio(lang="vi")
        logger.info(f"     Ratios: {len(ratios) if ratios is not None else 0} rows")
        
        # Lấy ratio_summary từ Company API (chỉ số tài chính tóm tắt)
        ratio_summary = None
        try:
            logger.info(f"  → Đang lấy ratio_summary từ Company API cho {symbol}...")
            company = Company(source="vci", symbol=symbol)
            ratio_summary_df = company.ratio_summary()
            if ratio_summary_df is not None and not ratio_summary_df.empty:
                logger.info(f"     Ratio Summary: {len(ratio_summary_df)} rows")
        except Exception as e:
            logger.warning(f"     Không thể lấy ratio_summary: {e}")
            ratio_summary_df = None
        
        # Helper function to safely convert DataFrame to JSON-serializable format
        def df_to_json_safe(df, limit=None):
            if df is None or df.empty:
                return []
            try:
                # Lấy số dòng giới hạn
                data = df.head(limit) if limit else df
                
                logger.debug(f"Processing DataFrame with shape {data.shape}")
                
                # Flatten multi-level columns if present (convert tuples to strings)
                if isinstance(data.columns, pd.MultiIndex):
                    # Join tuple column names with underscore
                    data.columns = ['_'.join(map(str, col)).strip() for col in data.columns.values]
                
                # Reset index to make it a regular column
                data = data.reset_index(drop=True)
                
                # Replace NaN/inf với empty string
                data = data.fillna('')
                
                # Convert to dict with orient='records'
                result = data.to_dict(orient='records')
                
                # Clean up the data - convert numpy types to Python types và handle inf
                import json
                import numpy as np
                
                def clean_value(val):
                    """Convert numpy/pandas types to JSON-serializable Python types"""
                    if isinstance(val, (float, np.floating)):
                        if np.isnan(val) or np.isinf(val):
                            return None
                        return float(val)
                    elif isinstance(val, (int, np.integer)):
                        return int(val)
                    elif isinstance(val, bool):
                        return bool(val)
                    elif val is None or val == '':
                        return None
                    return str(val)
                
                # Clean all values in result
                cleaned_result = []
                for record in result:
                    cleaned_record = {k: clean_value(v) for k, v in record.items()}
                    cleaned_result.append(cleaned_record)
                
                return cleaned_result
                
            except Exception as e:
                logger.error(f"Lỗi convert DataFrame: {e}", exc_info=True)
                return []
        
        # Chuyển đổi sang dict (lấy 5 năm/quý gần nhất)
        balance_sheet_data = df_to_json_safe(balance_sheet, 5)
        income_statement_data = df_to_json_safe(income_statement, 5)
        cash_flow_data = df_to_json_safe(cash_flow, 5)
        ratios_data = df_to_json_safe(ratios, 20)
        ratio_summary_data = df_to_json_safe(ratio_summary_df) if ratio_summary_df is not None else None
        
        result = {
            "symbol": symbol,
            "period": period,
            "balanceSheet": balance_sheet_data,
            "incomeStatement": income_statement_data,
            "cashFlow": cash_flow_data,
            "ratios": ratios_data,
            "ratioSummary": ratio_summary_data[0] if ratio_summary_data else None,
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Đã lấy xong báo cáo tài chính cho {symbol}")
        logger.info(f"  → Balance Sheet: {len(balance_sheet_data)} records")
        logger.info(f"  → Income Statement: {len(income_statement_data)} records")
        logger.info(f"  → Cash Flow: {len(cash_flow_data)} records")
        logger.info(f"  → Ratios: {len(ratios_data)} records")
        logger.info(f"  → Ratio Summary: {'OK' if result['ratioSummary'] else 'N/A'}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi lấy báo cáo tài chính cho {symbol}: {e}", exc_info=True)
        return {
            "symbol": symbol,
            "period": period,
            "balanceSheet": [],
            "incomeStatement": [],
            "cashFlow": [],
            "ratios": [],
            "ratioSummary": None,
            "error": str(e)
        }


# ==================== STOCK MANAGEMENT APIs ====================

@app.get("/api/admin/stocks")
async def admin_get_all_stocks():
    """
    [Admin] Lấy danh sách tất cả mã cổ phiếu trong database
    """
    try:
        stocks = list(stocks_collection.find({}))
        
        result = []
        for stock in stocks:
            result.append({
                "id": str(stock['_id']),
                "symbol": stock.get('symbol'),
                "name": stock.get('name'),
                "market": stock.get('market'),
                "country": stock.get('country', 'Vietnam'),
                "createdAt": stock.get('created_at'),
            })
        
        return {"stocks": result, "total": len(result)}
    except Exception as e:
        logger.error(f"Error getting stocks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/stocks")
async def admin_add_stock(data: dict):
    """
    [Admin] Thêm mã cổ phiếu mới
    
    Body:
        symbol: Mã cổ phiếu (VD: VCB)
        name: Tên công ty
        market: Sàn giao dịch (HOSE, HNX, UPCOM)
    """
    try:
        symbol = data.get('symbol', '').upper()
        name = data.get('name', '')
        market = data.get('market', 'HOSE').upper()
        
        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol is required")
        
        # Kiểm tra xem mã đã tồn tại chưa
        existing = stocks_collection.find_one({"symbol": symbol})
        if existing:
            raise HTTPException(status_code=400, detail=f"Stock {symbol} already exists")
        
        # Lưu vào database
        stock_id = save_stock_to_db(
            symbol=symbol,
            name=name or f"{symbol} - {market}",
            market=market,
            country="Vietnam"
        )
        
        if not stock_id:
            raise HTTPException(status_code=500, detail="Failed to save stock")
        
        # Lấy dữ liệu lịch sử cho mã mới
        logger.info(f"Fetching historical data for new stock {symbol}")
        df = get_stock_data_vnstock(symbol, market)
        
        candles_count = 0
        if df is not None and not df.empty:
            new_candles = save_candlesticks_to_db(stock_id, df)
            candles_count = len(new_candles)
        
        return {
            "success": True,
            "message": f"Stock {symbol} added successfully with {candles_count} candlesticks",
            "stock": {
                "id": stock_id,
                "symbol": symbol,
                "name": name,
                "market": market
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding stock: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/admin/stocks/{stock_id}")
async def admin_delete_stock(stock_id: str):
    """
    [Admin] Xóa mã cổ phiếu và dữ liệu candlestick tương ứng
    """
    try:
        from bson import ObjectId
        
        # Tìm stock
        stock = stocks_collection.find_one({"_id": ObjectId(stock_id)})
        if not stock:
            raise HTTPException(status_code=404, detail="Stock not found")
        
        symbol = stock.get('symbol')
        
        # Xóa tất cả candlesticks của stock này
        candles_deleted = candlesticks_collection.delete_many({"stock_id": stock_id})
        
        # Xóa stock
        stocks_collection.delete_one({"_id": ObjectId(stock_id)})
        
        logger.info(f"Deleted stock {symbol} and {candles_deleted.deleted_count} candlesticks")
        
        return {
            "success": True,
            "message": f"Stock {symbol} deleted successfully",
            "candlesDeleted": candles_deleted.deleted_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting stock: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/stocks/available")
async def admin_get_available_stocks(exchange: str = None, search: str = None):
    """
    [Admin] Lấy danh sách mã cổ phiếu có sẵn từ vnstock để thêm mới
    
    Args:
        exchange: Sàn giao dịch (HOSE, HNX, UPCOM). Nếu không truyền sẽ lấy tất cả.
        search: Tìm kiếm theo tên hoặc symbol
    
    Returns:
        Danh sách mã cổ phiếu có sẵn (đã loại trừ các mã đang có trong DB)
    """
    try:
        if Listing is None:
            raise HTTPException(status_code=503, detail="Listing API not available")
        
        # Khởi tạo Listing adapter
        listing = Listing(source="vci")
        
        # Lấy tất cả symbols
        all_symbols_df = listing.all_symbols(to_df=True)
        
        if all_symbols_df is None or all_symbols_df.empty:
            return {"stocks": [], "total": 0}
        
        # Chuẩn hóa tên cột
        all_symbols_df.columns = [str(col).lower().replace(' ', '_') for col in all_symbols_df.columns]
        
        # Filter theo exchange nếu có
        if exchange:
            exchange = exchange.upper()
            if 'exchange' in all_symbols_df.columns:
                all_symbols_df = all_symbols_df[all_symbols_df['exchange'].str.upper() == exchange]
            elif 'san' in all_symbols_df.columns:
                all_symbols_df = all_symbols_df[all_symbols_df['san'].str.upper() == exchange]
        
        # Lấy danh sách mã đã có trong DB
        existing_symbols = set(
            stock['symbol'] for stock in stocks_collection.find({}, {"symbol": 1})
        )
        
        # Loại bỏ các mã đã có
        symbol_col = 'symbol' if 'symbol' in all_symbols_df.columns else 'ticker'
        all_symbols_df = all_symbols_df[~all_symbols_df[symbol_col].isin(existing_symbols)]
        
        # Filter theo search nếu có
        if search:
            search = search.upper()
            name_col = 'organ_name' if 'organ_name' in all_symbols_df.columns else 'company_name' if 'company_name' in all_symbols_df.columns else None
            
            if name_col:
                mask = (
                    all_symbols_df[symbol_col].str.upper().str.contains(search, na=False) |
                    all_symbols_df[name_col].str.upper().str.contains(search, na=False)
                )
            else:
                mask = all_symbols_df[symbol_col].str.upper().str.contains(search, na=False)
            
            all_symbols_df = all_symbols_df[mask]
        
        # Giới hạn số lượng kết quả
        all_symbols_df = all_symbols_df.head(100)
        
        # Chuyển đổi sang list of dict
        result = []
        for _, row in all_symbols_df.iterrows():
            symbol = row.get('symbol') or row.get('ticker')
            name = row.get('organ_name') or row.get('company_name') or row.get('name') or ''
            exchange_val = row.get('exchange') or row.get('san') or 'UNKNOWN'
            
            result.append({
                "symbol": symbol,
                "name": name,
                "exchange": str(exchange_val).upper()
            })
        
        return {"stocks": result, "total": len(result)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting available stocks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/stocks/stats")
async def admin_get_stocks_stats():
    """
    [Admin] Lấy thống kê về stocks
    """
    try:
        # Đếm theo market
        pipeline = [
            {"$group": {"_id": "$market", "count": {"$sum": 1}}}
        ]
        market_counts = list(stocks_collection.aggregate(pipeline))
        
        stats = {
            "total": stocks_collection.count_documents({}),
            "byMarket": {item["_id"]: item["count"] for item in market_counts},
            "totalCandlesticks": candlesticks_collection.count_documents({})
        }
        
        return stats
    except Exception as e:
        logger.error(f"Error getting stocks stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/stocks/update-names")
async def admin_update_stock_names():
    """
    [Admin] Cập nhật tên công ty cho các mã cổ phiếu Việt Nam từ vnstock
    
    Hàm này sẽ:
    1. Lấy tất cả stocks Việt Nam từ database
    2. Gọi vnstock Listing API để lấy danh sách với tên công ty đầy đủ
    3. Cập nhật trường 'name' cho từng stock
    
    Returns:
        Số lượng stocks đã được cập nhật
    """
    try:
        if Listing is None:
            raise HTTPException(status_code=503, detail="Listing API not available")
        
        # Lấy tất cả stocks Việt Nam từ database (không bao gồm US)
        vietnam_stocks = list(stocks_collection.find({"market": {"$ne": "US"}}))
        
        if not vietnam_stocks:
            return {"updated": 0, "message": "No Vietnam stocks found in database"}
        
        # Khởi tạo Listing adapter
        listing = Listing(source="vci")
        
        # Lấy tất cả symbols với thông tin đầy đủ
        all_symbols_df = listing.all_symbols(to_df=True)
        
        if all_symbols_df is None or all_symbols_df.empty:
            raise HTTPException(status_code=503, detail="Failed to fetch listing data from vnstock")
        
        # Chuẩn hóa tên cột
        all_symbols_df.columns = [str(col).lower().replace(' ', '_') for col in all_symbols_df.columns]
        
        # Xác định cột symbol và name
        symbol_col = 'symbol' if 'symbol' in all_symbols_df.columns else 'ticker'
        name_col = 'organ_name' if 'organ_name' in all_symbols_df.columns else 'company_name' if 'company_name' in all_symbols_df.columns else None
        
        if name_col is None:
            raise HTTPException(status_code=503, detail="Cannot find company name column in listing data")
        
        # Tạo mapping symbol -> name
        symbol_to_name = {}
        for _, row in all_symbols_df.iterrows():
            symbol = str(row.get(symbol_col, '')).upper()
            name = row.get(name_col, '')
            if symbol and name:
                symbol_to_name[symbol] = name
        
        logger.info(f"Loaded {len(symbol_to_name)} symbols from vnstock listing")
        
        # Cập nhật từng stock
        updated_count = 0
        skipped_count = 0
        not_found_symbols = []
        
        for stock in vietnam_stocks:
            symbol = stock.get('symbol', '').upper()
            current_name = stock.get('name', '')
            
            # Nếu stock có trong mapping
            if symbol in symbol_to_name:
                new_name = symbol_to_name[symbol]
                
                # Chỉ cập nhật nếu tên khác (hoặc tên hiện tại là dạng "SYMBOL - MARKET")
                if current_name != new_name:
                    stocks_collection.update_one(
                        {"_id": stock['_id']},
                        {"$set": {"name": new_name, "updated_at": datetime.now()}}
                    )
                    updated_count += 1
                    logger.info(f"Updated {symbol}: '{current_name}' → '{new_name}'")
                else:
                    skipped_count += 1
            else:
                not_found_symbols.append(symbol)
                logger.warning(f"Symbol {symbol} not found in vnstock listing")
        
        result = {
            "updated": updated_count,
            "skipped": skipped_count,
            "notFound": len(not_found_symbols),
            "notFoundSymbols": not_found_symbols[:20],  # Giới hạn 20 symbols
            "message": f"Updated {updated_count} stocks, skipped {skipped_count}, not found {len(not_found_symbols)}"
        }
        
        logger.info(f"Stock names update completed: {result['message']}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating stock names: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=PORT,
        reload=False,
        log_level="info"
    )
