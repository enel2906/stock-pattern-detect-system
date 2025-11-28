"""
International Stock Data Service
Lấy dữ liệu cổ phiếu quốc tế, forex, commodities từ yfinance
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import pandas as pd

# Import yfinance
try:
    import yfinance as yf
except ImportError:
    print("Warning: yfinance not installed. Install with: pip install yfinance")
    yf = None

logger = logging.getLogger(__name__)

# Danh sách symbols quốc tế cần theo dõi
INTERNATIONAL_SYMBOLS = {
    'FOREX': [
        {'symbol': 'EURUSD=X', 'name': 'EUR/USD', 'type': 'Currency'},
    ],
    'COMMODITIES': [
        {'symbol': 'GC=F', 'name': 'Gold Futures', 'type': 'Commodity'},
    ],
    'US_STOCKS': [
        {'symbol': 'AAPL', 'name': 'Apple Inc.', 'type': 'Stock'},
        {'symbol': 'GOOGL', 'name': 'Alphabet Inc.', 'type': 'Stock'},
        {'symbol': 'MSFT', 'name': 'Microsoft Corporation', 'type': 'Stock'},
        {'symbol': 'AMZN', 'name': 'Amazon.com Inc.', 'type': 'Stock'},
        {'symbol': 'TSLA', 'name': 'Tesla Inc.', 'type': 'Stock'},
    ]
}


def get_international_data(symbol: str, start_date: str = None, end_date: str = None) -> Optional[pd.DataFrame]:
    """
    Lấy dữ liệu lịch sử từ yfinance
    
    Args:
        symbol: Symbol (e.g., 'EURUSD=X', 'GC=F', 'AAPL')
        start_date: Ngày bắt đầu (YYYY-MM-DD)
        end_date: Ngày kết thúc (YYYY-MM-DD)
    
    Returns:
        DataFrame với columns: Open, High, Low, Close, Volume
    """
    try:
        if yf is None:
            logger.error("yfinance is not installed")
            return None
        
        # Nếu không có ngày, lấy 5 năm dữ liệu
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=1825)).strftime('%Y-%m-%d')
        if end_date is None:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        # Tạo ticker object
        ticker = yf.Ticker(symbol)
        
        # Lấy dữ liệu lịch sử
        df = ticker.history(start=start_date, end=end_date, interval="1d")
        
        if df is not None and not df.empty:
            # Chuẩn hóa tên cột về lowercase để consistent với vnstock
            df.columns = df.columns.str.lower()
            
            # Đảm bảo có đủ các cột cần thiết
            required_cols = ['open', 'high', 'low', 'close', 'volume']
            for col in required_cols:
                if col not in df.columns:
                    df[col] = 0.0
            
            logger.info(f"Fetched {len(df)} records for {symbol}")
            return df[required_cols]
        else:
            logger.warning(f"No data returned for {symbol}")
            return None
            
    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {e}")
        return None


def save_international_stock(stocks_collection, symbol: str, name: str, market: str, asset_type: str, country: str = "International"):
    """
    Lưu thông tin stock quốc tế vào database
    
    Args:
        stocks_collection: MongoDB collection
        symbol: Symbol
        name: Tên đầy đủ
        market: Market/Category (FOREX, COMMODITIES, US_STOCKS, etc.)
        asset_type: Loại tài sản (Currency, Commodity, Stock, Index, Cryptocurrency)
        country: Quốc gia
    
    Returns:
        stock_id hoặc None
    """
    try:
        stock_doc = {
            "symbol": symbol,
            "name": name,
            "market": market,
            "asset_type": asset_type,
            "country": country,
            "data_source": "yfinance",
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
        logger.error(f"Error saving international stock {symbol}: {e}")
        return None


def save_international_candlesticks(candlesticks_collection, stock_id: str, df: pd.DataFrame) -> int:
    """
    Lưu candlesticks của stock quốc tế vào database
    
    Args:
        candlesticks_collection: MongoDB collection
        stock_id: ID của stock
        df: DataFrame chứa dữ liệu OHLCV
    
    Returns:
        Số lượng candlesticks đã lưu
    """
    try:
        if df is None or df.empty:
            return 0
        
        from pymongo import UpdateOne
        
        # Reset index để time trở thành column
        df_reset = df.reset_index()
        
        operations = []
        for _, row in df_reset.iterrows():
            try:
                # Xử lý timestamp
                if 'date' in row:
                    date_val = row['date']
                elif 'time' in row:
                    date_val = row['time']
                else:
                    date_val = row.iloc[0]
                
                # Convert sang datetime
                if isinstance(date_val, (int, float)):
                    dt = datetime.fromtimestamp(int(date_val))
                elif hasattr(date_val, 'to_pydatetime'):
                    dt = date_val.to_pydatetime()
                elif hasattr(date_val, 'timestamp'):
                    dt = date_val
                else:
                    date_str = str(date_val)[:10]
                    dt = datetime.strptime(date_str, '%Y-%m-%d')
                
                timestamp = int(dt.timestamp())
                date_str = dt.strftime('%Y%m%d')
                
                # Tạo composite ID
                composite_id = f"{stock_id}_{date_str}"
                
                candle = {
                    "_id": composite_id,
                    "stock_id": stock_id,
                    "date": timestamp,
                    "date_str": date_str,
                    "open": float(row.get('open', 0)),
                    "high": float(row.get('high', 0)),
                    "low": float(row.get('low', 0)),
                    "close": float(row.get('close', 0)),
                    "volume": float(row.get('volume', 0))
                }
                
                operations.append(
                    UpdateOne(
                        filter={"_id": composite_id},
                        update={"$set": candle},
                        upsert=True
                    )
                )
                
            except Exception as e:
                logger.warning(f"Error processing row for stock_id {stock_id}: {e}")
                continue
        
        if operations:
            result = candlesticks_collection.bulk_write(operations)
            count = result.upserted_count + result.modified_count
            logger.info(f"Saved/Updated {count} international candlesticks for stock_id: {stock_id}")
            return count
        
        return 0
        
    except Exception as e:
        logger.error(f"Error saving international candlesticks for stock_id {stock_id}: {e}")
        return 0


async def initialize_international_data(stocks_collection, candlesticks_collection):
    """
    Khởi tạo dữ liệu quốc tế
    
    Args:
        stocks_collection: MongoDB stocks collection
        candlesticks_collection: MongoDB candlesticks collection
    
    Returns:
        Tuple (total_stocks, total_candles)
    """
    logger.info("Starting international data initialization...")
    
    if yf is None:
        logger.error("yfinance is not installed, skipping international data initialization")
        return 0, 0
    
    total_stocks = 0
    total_candles = 0
    
    # Lấy dữ liệu cho từng category
    for market, symbols_list in INTERNATIONAL_SYMBOLS.items():
        logger.info(f"Processing {market} with {len(symbols_list)} symbols")
        
        for item in symbols_list:
            try:
                symbol = item['symbol']
                name = item['name']
                asset_type = item['type']
                
                logger.info(f"Fetching data for {symbol} ({name})")
                
                # Lưu thông tin stock
                stock_id = save_international_stock(
                    stocks_collection=stocks_collection,
                    symbol=symbol,
                    name=name,
                    market=market,
                    asset_type=asset_type
                )
                
                if stock_id:
                    total_stocks += 1
                    
                    # Lấy dữ liệu lịch sử (5 năm)
                    df = get_international_data(symbol)
                    
                    if df is not None and not df.empty:
                        # Lưu candlesticks
                        count = save_international_candlesticks(
                            candlesticks_collection=candlesticks_collection,
                            stock_id=stock_id,
                            df=df
                        )
                        total_candles += count
                
            except Exception as e:
                logger.error(f"Error processing {item.get('symbol', 'unknown')}: {e}")
                continue
    
    logger.info(f"International data initialization completed: {total_stocks} stocks, {total_candles} candlesticks")
    return total_stocks, total_candles


def get_all_international_symbols() -> List[Dict]:
    """
    Lấy danh sách tất cả symbols quốc tế
    
    Returns:
        List of dicts với keys: symbol, name, market, type
    """
    all_symbols = []
    for market, symbols_list in INTERNATIONAL_SYMBOLS.items():
        for item in symbols_list:
            all_symbols.append({
                'symbol': item['symbol'],
                'name': item['name'],
                'market': market,
                'type': item['type']
            })
    return all_symbols
