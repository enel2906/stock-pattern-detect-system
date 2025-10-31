#!/usr/bin/env python3
"""
Stock Data Service with Multi-level Caching
- Memory Cache (5 min TTL)
- Redis Cache (1 hour TTL) 
- VNStock API (Primary Source)
- Database Fallback (Last Resort)

Author: Senior Developer Team
Version: 1.0.0
"""

import os
import time
import json
import asyncio
from datetime import datetime, date, timedelta
from typing import Optional, Dict, List, Any
from functools import wraps

import pandas as pd
from fastapi import FastAPI, Query, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from cachetools import TTLCache
import redis
from circuitbreaker import circuit
from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert

try:
    from vnstock import Vnstock
except ImportError:
    print("⚠️  Vnstock not installed. Run: pip install vnstock")
    Vnstock = None

# ============================================================================
# CONFIGURATION
# ============================================================================

APP_VERSION = "1.0.0"
MEMORY_CACHE_TTL = 300  # 5 minutes
REDIS_CACHE_TTL = 3600  # 1 hour
RATE_LIMIT_MAX = 10     # 10 requests
RATE_LIMIT_WINDOW = 60  # per 60 seconds

# Redis Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://user:password@localhost:5432/stock_db"
)

# ============================================================================
# INITIALIZE APP
# ============================================================================

app = FastAPI(
    title="Stock Data Service",
    description="Multi-level cached stock data API with VNStock integration",
    version=APP_VERSION
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# LAYER 1: MEMORY CACHE (In-Process)
# ============================================================================

memory_cache = TTLCache(maxsize=1000, ttl=MEMORY_CACHE_TTL)

def generate_cache_key(symbol: str, start: str = None, end: str = None) -> str:
    """Generate unique cache key for symbol and date range"""
    key_parts = [symbol.upper()]
    if start:
        key_parts.append(start)
    if end:
        key_parts.append(end)
    return ":".join(key_parts)

# ============================================================================
# LAYER 2: REDIS CACHE (Distributed)
# ============================================================================

try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2
    )
    redis_client.ping()
    REDIS_AVAILABLE = True
    print(f"✅ Redis connected: {REDIS_HOST}:{REDIS_PORT}")
except Exception as e:
    redis_client = None
    REDIS_AVAILABLE = False
    print(f"⚠️  Redis unavailable: {e}. Continuing without Redis cache.")

# ============================================================================
# LAYER 3: RATE LIMITER FOR VNSTOCK
# ============================================================================

class VNStockRateLimiter:
    """Rate limiter to protect VNStock API calls"""
    
    def __init__(self, max_requests: int = RATE_LIMIT_MAX, window: int = RATE_LIMIT_WINDOW):
        self.max_requests = max_requests
        self.window = window
        self.requests = []
    
    def can_make_request(self) -> bool:
        """Check if we can make a request within rate limit"""
        now = time.time()
        # Remove old requests outside the window
        self.requests = [req_time for req_time in self.requests if now - req_time < self.window]
        
        if len(self.requests) >= self.max_requests:
            return False
        
        self.requests.append(now)
        return True
    
    def get_remaining(self) -> int:
        """Get remaining requests in current window"""
        now = time.time()
        self.requests = [req_time for req_time in self.requests if now - req_time < self.window]
        return max(0, self.max_requests - len(self.requests))

rate_limiter = VNStockRateLimiter()

# ============================================================================
# LAYER 4: DATABASE (Fallback & Storage)
# ============================================================================

Base = declarative_base()

class StockOHLCV(Base):
    """Stock OHLCV data model"""
    __tablename__ = 'stock_ohlcv'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(BigInteger, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    def to_dict(self) -> dict:
        return {
            "time": self.date,
            "open": float(self.open),
            "high": float(self.high),
            "low": float(self.low),
            "close": float(self.close),
            "volume": int(self.volume)
        }

# Database engine and session
try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    DB_AVAILABLE = True
    print("✅ Database connected")
except Exception as e:
    engine = None
    SessionLocal = None
    DB_AVAILABLE = False
    print(f"⚠️  Database unavailable: {e}. Continuing without DB fallback.")

# ============================================================================
# DATA NORMALIZATION
# ============================================================================

def _detect_col(df: pd.DataFrame, candidates: list) -> Optional[str]:
    """Detect column name from candidates (case-insensitive)"""
    low = {c.lower(): c for c in df.columns}
    for name in candidates:
        if name.lower() in low:
            return low[name.lower()]
    return None

def normalize_vnstock_data(df: pd.DataFrame) -> List[dict]:
    """
    Normalize VNStock DataFrame to standard format
    Returns: [{"time": "YYYY-MM-DD", "open": float, ...}, ...]
    """
    if df is None or len(df) == 0:
        return []
    
    # Find time column
    time_col = _detect_col(df, ["time", "date", "ngay", "tradingdate"])
    if time_col is None:
        df = df.copy()
        df.reset_index(inplace=True)
        time_col = _detect_col(df, ["time", "date", "index"])
        if time_col is None:
            raise ValueError("Cannot find time column in VNStock data")
    
    # Find OHLCV columns
    open_col = _detect_col(df, ["open", "price_open", "open_price"])
    high_col = _detect_col(df, ["high", "price_high", "high_price"])
    low_col = _detect_col(df, ["low", "price_low", "low_price"])
    close_col = _detect_col(df, ["close", "price_close", "close_price"])
    vol_col = _detect_col(df, ["volume", "vol", "total_volume", "khoi_luong"])
    
    for c in [open_col, high_col, low_col, close_col, vol_col]:
        if c is None:
            raise ValueError("Missing OHLCV columns in VNStock data")
    
    # Convert time to YYYY-MM-DD
    t = df[time_col]
    if pd.api.types.is_datetime64_any_dtype(t):
        time_vals = t.dt.strftime("%Y-%m-%d")
    else:
        try:
            time_vals = pd.to_datetime(t).dt.strftime("%Y-%m-%d")
        except:
            time_vals = pd.to_datetime(t, unit="s").dt.strftime("%Y-%m-%d")
    
    # Build result
    result = []
    for time_str, o, h, l, c, v in zip(
        time_vals,
        df[open_col].astype(float),
        df[high_col].astype(float),
        df[low_col].astype(float),
        df[close_col].astype(float),
        pd.to_numeric(df[vol_col], errors="coerce").fillna(0).astype(int),
    ):
        result.append({
            "time": str(time_str),
            "open": float(o),
            "high": float(h),
            "low": float(l),
            "close": float(c),
            "volume": int(v),
        })
    
    # Sort by time ascending
    result.sort(key=lambda r: r["time"])
    return result

# ============================================================================
# CIRCUIT BREAKER FOR VNSTOCK
# ============================================================================

class VNStockException(Exception):
    """Custom exception for VNStock failures"""
    pass

@circuit(failure_threshold=5, recovery_timeout=60, expected_exception=VNStockException)
async def fetch_from_vnstock(symbol: str, start: str = None, end: str = None) -> List[dict]:
    """
    Fetch data from VNStock with circuit breaker
    Circuit will open after 5 consecutive failures
    """
    if Vnstock is None:
        raise VNStockException("VNStock library not available")
    
    # Check rate limit
    if not rate_limiter.can_make_request():
        raise VNStockException("Rate limit exceeded")
    
    try:
        # Default to full history
        if start is None:
            start = "2000-01-01"
        if end is None:
            end = date.today().strftime("%Y-%m-%d")
        
        # Call VNStock API
        stock = Vnstock().stock(symbol=symbol.upper(), source="VCI")
        df = stock.quote.history(start=start, end=end, interval="1D")
        
        if df is None or len(df) == 0:
            raise VNStockException(f"No data returned for {symbol}")
        
        # Normalize data
        data = normalize_vnstock_data(df)
        print(f"✅ VNStock: Fetched {len(data)} rows for {symbol}")
        return data
        
    except Exception as e:
        print(f"❌ VNStock error for {symbol}: {e}")
        raise VNStockException(str(e))

# ============================================================================
# DATABASE OPERATIONS
# ============================================================================

async def fetch_from_database(symbol: str, start: str = None, end: str = None) -> List[dict]:
    """Fetch data from database (fallback source)"""
    if not DB_AVAILABLE or SessionLocal is None:
        return []
    
    try:
        db = SessionLocal()
        query = db.query(StockOHLCV).filter(StockOHLCV.symbol == symbol.upper())
        
        if start:
            query = query.filter(StockOHLCV.date >= start)
        if end:
            query = query.filter(StockOHLCV.date <= end)
        
        query = query.order_by(StockOHLCV.date.asc())
        rows = query.all()
        db.close()
        
        result = [row.to_dict() for row in rows]
        print(f"✅ Database: Fetched {len(result)} rows for {symbol}")
        return result
        
    except Exception as e:
        print(f"❌ Database error for {symbol}: {e}")
        return []

async def save_to_database(symbol: str, data: List[dict]):
    """Save data to database (background task)"""
    if not DB_AVAILABLE or SessionLocal is None:
        return
    
    try:
        db = SessionLocal()
        for row in data:
            stmt = insert(StockOHLCV).values(
                symbol=symbol.upper(),
                date=row["time"],
                open=row["open"],
                high=row["high"],
                low=row["low"],
                close=row["close"],
                volume=row["volume"]
            ).on_conflict_do_update(
                index_elements=['symbol', 'date'],
                set_=dict(
                    open=row["open"],
                    high=row["high"],
                    low=row["low"],
                    close=row["close"],
                    volume=row["volume"],
                    updated_at=datetime.now()
                )
            )
            db.execute(stmt)
        
        db.commit()
        db.close()
        print(f"💾 Database: Saved {len(data)} rows for {symbol}")
        
    except Exception as e:
        print(f"⚠️  Database save error for {symbol}: {e}")

# ============================================================================
# MULTI-LEVEL CACHE FETCHER
# ============================================================================

async def get_stock_data(
    symbol: str,
    start: str = None,
    end: str = None
) -> tuple[List[dict], str]:
    """
    Fetch stock data with multi-level caching
    Returns: (data, source)
    Source: "memory", "redis", "vnstock", "database"
    """
    cache_key = generate_cache_key(symbol, start, end)
    
    # LAYER 1: Check Memory Cache
    if cache_key in memory_cache:
        print(f"✅ Memory cache HIT for {symbol}")
        return memory_cache[cache_key], "memory"
    
    # LAYER 2: Check Redis Cache
    if REDIS_AVAILABLE and redis_client:
        try:
            redis_data = redis_client.get(f"stock:{cache_key}")
            if redis_data:
                data = json.loads(redis_data)
                # Promote to memory cache
                memory_cache[cache_key] = data
                print(f"✅ Redis cache HIT for {symbol}")
                return data, "redis"
        except Exception as e:
            print(f"⚠️  Redis read error: {e}")
    
    # LAYER 3: Try VNStock API
    try:
        data = await fetch_from_vnstock(symbol, start, end)
        
        # Save to caches
        memory_cache[cache_key] = data
        
        if REDIS_AVAILABLE and redis_client:
            try:
                redis_client.setex(
                    f"stock:{cache_key}",
                    REDIS_CACHE_TTL,
                    json.dumps(data)
                )
            except Exception as e:
                print(f"⚠️  Redis write error: {e}")
        
        return data, "vnstock"
        
    except VNStockException as e:
        print(f"⚠️  VNStock failed for {symbol}: {e}")
    
    # LAYER 4: Fallback to Database
    data = await fetch_from_database(symbol, start, end)
    if data:
        return data, "database"
    
    # No data available
    raise HTTPException(
        status_code=404,
        detail=f"No data available for {symbol}. VNStock and Database both failed."
    )

# ============================================================================
# METRICS & MONITORING
# ============================================================================

request_count = {
    "total": 0,
    "memory": 0,
    "redis": 0,
    "vnstock": 0,
    "database": 0,
    "errors": 0
}

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Stock Data Service",
        "version": APP_VERSION,
        "status": "healthy",
        "features": {
            "memory_cache": True,
            "redis_cache": REDIS_AVAILABLE,
            "vnstock_api": Vnstock is not None,
            "database_fallback": DB_AVAILABLE
        }
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    redis_status = "healthy"
    if REDIS_AVAILABLE and redis_client:
        try:
            redis_client.ping()
        except:
            redis_status = "unhealthy"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "memory_cache": {"status": "healthy", "size": len(memory_cache)},
            "redis_cache": {"status": redis_status if REDIS_AVAILABLE else "disabled"},
            "vnstock_api": {"status": "healthy" if Vnstock else "unavailable"},
            "database": {"status": "healthy" if DB_AVAILABLE else "unavailable"},
            "rate_limiter": {"remaining": rate_limiter.get_remaining()}
        }
    }

@app.get("/metrics")
async def metrics():
    """Service metrics"""
    cache_hit_rate = 0
    if request_count["total"] > 0:
        hits = request_count["memory"] + request_count["redis"]
        cache_hit_rate = (hits / request_count["total"]) * 100
    
    return {
        "requests": request_count,
        "cache_hit_rate": f"{cache_hit_rate:.2f}%",
        "cache_sizes": {
            "memory": len(memory_cache),
            "memory_max": memory_cache.maxsize
        },
        "rate_limiter": {
            "remaining": rate_limiter.get_remaining(),
            "max_per_minute": rate_limiter.max_requests
        }
    }

@app.get("/stock")
async def get_stock(
    symbol: str = Query(..., description="Stock symbol (e.g., HPG, VCB)"),
    start: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    background_tasks: BackgroundTasks = None
):
    """
    Get stock OHLCV data with multi-level caching
    
    Returns data in format compatible with Java backend:
    {
        "code": 0,
        "message": "success", 
        "symbol": "HPG",
        "data": [{"date": timestamp, "open": float, ...}]
    }
    """
    start_time = time.time()
    request_count["total"] += 1
    
    try:
        # Fetch data
        data, source = await get_stock_data(symbol, start, end)
        request_count[source] += 1
        
        # Convert format to match Java backend (timestamp instead of string)
        java_format_data = []
        for row in data:
            try:
                dt = datetime.strptime(row["time"], "%Y-%m-%d")
                timestamp = int(dt.timestamp())
                java_format_data.append({
                    "date": timestamp,
                    "open": row["open"],
                    "high": row["high"],
                    "low": row["low"],
                    "close": row["close"],
                    "volume": row.get("volume", 0)
                })
            except:
                continue
        
        # Schedule background save to database (only for VNStock data)
        if source == "vnstock" and background_tasks and DB_AVAILABLE:
            background_tasks.add_task(save_to_database, symbol, data)
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        return JSONResponse(
            content={
                "code": 0,
                "message": "success",
                "symbol": symbol.upper(),
                "data": java_format_data
            },
            headers={
                "X-Data-Source": source,
                "X-Cache-Hit": "true" if source in ["memory", "redis"] else "false",
                "X-Duration-Ms": str(duration_ms),
                "X-Rate-Limit-Remaining": str(rate_limiter.get_remaining())
            }
        )
        
    except HTTPException as e:
        request_count["errors"] += 1
        raise e
    except Exception as e:
        request_count["errors"] += 1
        print(f"❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cache/clear")
async def clear_cache(layer: Optional[str] = Query("all", description="memory, redis, or all")):
    """Clear cache (for debugging)"""
    result = {}
    
    if layer in ["memory", "all"]:
        memory_cache.clear()
        result["memory"] = "cleared"
    
    if layer in ["redis", "all"] and REDIS_AVAILABLE and redis_client:
        try:
            redis_client.flushdb()
            result["redis"] = "cleared"
        except Exception as e:
            result["redis"] = f"error: {e}"
    
    return {"status": "success", "cleared": result}

# ============================================================================
# STARTUP & SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize resources on startup"""
    print("=" * 60)
    print("🚀 Stock Data Service Starting...")
    print("=" * 60)
    print(f"✅ Memory Cache: TTL={MEMORY_CACHE_TTL}s, MaxSize={memory_cache.maxsize}")
    print(f"{'✅' if REDIS_AVAILABLE else '⚠️ '} Redis Cache: TTL={REDIS_CACHE_TTL}s")
    print(f"{'✅' if Vnstock else '⚠️ '} VNStock API: Available={Vnstock is not None}")
    print(f"{'✅' if DB_AVAILABLE else '⚠️ '} Database: Available={DB_AVAILABLE}")
    print(f"✅ Rate Limiter: {rate_limiter.max_requests} req/{rate_limiter.window}s")
    print("=" * 60)

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup resources on shutdown"""
    print("🛑 Stock Data Service Shutting Down...")
    if redis_client:
        redis_client.close()

# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "60"))
    
    print(f"\n🌐 Starting server on http://localhost:{port}")
    print(f"📚 API Docs: http://localhost:{port}/docs")
    print(f"📊 Metrics: http://localhost:{port}/metrics")
    print(f"❤️  Health: http://localhost:{port}/health\n")
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
