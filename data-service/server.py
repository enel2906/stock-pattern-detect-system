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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient, ASCENDING
from pymongo.errors import PyMongoError
import uvicorn
import aio_pika
from aio_pika import connect_robust, Message, DeliveryMode, ExchangeType

# Import vnstock và yfinance
try:
    from vnstock import Vnstock
except ImportError:
    print("Warning: vnstock not installed. Install with: pip install vnstock")
    Vnstock = None

try:
    import yfinance as yf
except ImportError:
    print("Warning: yfinance not installed. Install with: pip install yfinance")
    yf = None

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
UPDATE_INTERVAL = 60  # 60 giây (1 phút) - tránh vượt rate limit

# Danh sách mã cổ phiếu cần theo dõi
STOCK_SYMBOLS = {
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

# Background task reference
update_task = None


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
    global rabbitmq_connection, rabbitmq_channel, rabbitmq_exchange
    
    try:
        rabbitmq_connection = await connect_robust(RABBITMQ_URI)
        rabbitmq_channel = await rabbitmq_connection.channel()
        
        # Declare exchange
        rabbitmq_exchange = await rabbitmq_channel.declare_exchange(
            'stock.market.data',
            ExchangeType.TOPIC,
            durable=True
        )
        
        logger.info("RabbitMQ connected successfully")
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


def clear_database():
    """Xóa toàn bộ dữ liệu trong stocks và candlesticks"""
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
        
        # Nếu không có ngày, lấy tất cả dữ liệu có thể (từ 10 năm trước)
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=3650)).strftime('%Y-%m-%d')
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
    """Khởi tạo dữ liệu ban đầu"""
    logger.info("Starting data initialization...")
    
    # Xóa dữ liệu cũ
    clear_database()
    
    total_stocks = 0
    total_candles = 0
    
    # === Phần 1: Lấy dữ liệu cổ phiếu Việt Nam ===
    logger.info("=== Initializing Vietnam stock data ===")
    for market, symbols in STOCK_SYMBOLS.items():
        logger.info(f"Processing {market} market with {len(symbols)} stocks")
        
        for symbol in symbols:
            try:
                logger.info(f"Fetching historical data for {symbol} ({market})")
                
                # Lưu thông tin stock
                stock_id = save_stock_to_db(
                    symbol=symbol,
                    name=f"{symbol} - {market}",
                    market=market
                )
                
                if stock_id:
                    total_stocks += 1
                    
                    # Lấy dữ liệu lịch sử (10 năm)
                    df = get_stock_data_vnstock(symbol, market)
                    
                    if df is not None:
                        # Lưu candlesticks (trả về list candles)
                        new_candles = save_candlesticks_to_db(stock_id, df)
                        total_candles += len(new_candles)
                    
                    # Delay để tránh rate limit
                    await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Error processing {symbol}: {e}")
                continue
    
    logger.info(f"Vietnam data initialization completed: {total_stocks} stocks, {total_candles} candlesticks")
    
    # === Phần 2: Lấy dữ liệu cổ phiếu quốc tế (US stocks) ===
    logger.info("=== Initializing international stock data ===")
    
    for symbol in INTERNATIONAL_SYMBOLS:
        try:
            logger.info(f"Fetching historical data for {symbol} (US) using yfinance")
            
            # Lưu thông tin stock
            stock_id = save_stock_to_db(
                symbol=symbol,
                name=f"{symbol} - US",
                market="US",
                country="United States"
            )
            
            if stock_id:
                total_stocks += 1
                
                # Lấy dữ liệu lịch sử 5 năm bằng yfinance
                df = get_stock_data_yfinance(symbol, period="5y")
                
                if df is not None:
                    # Lưu candlesticks (trả về list candles)
                    new_candles = save_candlesticks_to_db(stock_id, df)
                    total_candles += len(new_candles)
                
                # Delay để tránh rate limit
                await asyncio.sleep(2)
            
        except Exception as e:
            logger.error(f"Error processing international stock {symbol}: {e}")
            continue
    
    logger.info(f"=== Total initialization completed: {total_stocks} stocks, {total_candles} candlesticks ===")


async def update_latest_data():
    """Cập nhật dữ liệu mới nhất cho cổ phiếu Việt Nam (không cập nhật cổ phiếu nước ngoài)"""
    while True:
        try:
            logger.info("Starting periodic update...")
            
            # Chỉ lấy danh sách stocks Việt Nam (không lấy US stocks)
            stocks = list(stocks_collection.find({"market": {"$ne": "US"}}))
            
            # Lấy dữ liệu 5 ngày gần nhất (để đảm bảo không bỏ sót)
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            
            updated_count = 0
            for stock in stocks:
                try:
                    symbol = stock['symbol']
                    market = stock['market']
                    stock_id = str(stock['_id'])
                    
                    # Lấy dữ liệu mới nhất
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
            
            # Chờ đến lần update tiếp theo
            logger.info(f"Waiting {UPDATE_INTERVAL} seconds until next update...")
            await asyncio.sleep(UPDATE_INTERVAL)
            
        except Exception as e:
            logger.error(f"Error in update loop: {e}")
            await asyncio.sleep(UPDATE_INTERVAL)


@app.on_event("startup")
async def startup_event():

    global update_task
    
    if not init_mongodb():
        return
    
    if not await init_rabbitmq():
        logger.warning("RabbitMQ initialization failed, will continue without message publishing")
    
    await initialize_data()

    update_task = asyncio.create_task(update_latest_data())
    logger.info(f"Server started on port {PORT}")


@app.on_event("shutdown")
async def shutdown_event():
    global update_task, rabbitmq_connection

    if update_task:
        update_task.cancel()
        try:
            await update_task
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
    """Cập nhật dữ liệu một lần (cho force update)"""
    stocks = list(stocks_collection.find({}))
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d')
    
    for stock in stocks:
        try:
            symbol = stock['symbol']
            market = stock['market']
            stock_id = str(stock['_id'])
            
            df = get_stock_data_vnstock(symbol, market, start_date, end_date)
            
            if df is not None:
                save_candlesticks_to_db(stock_id, df)
                stocks_collection.update_one(
                    {"_id": stock['_id']},
                    {"$set": {"updated_at": datetime.now()}}
                )
            
            await asyncio.sleep(2)
        except Exception as e:
            logger.error(f"Error in force update for {stock.get('symbol')}: {e}")


if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=PORT,
        reload=False,
        log_level="info"
    )
