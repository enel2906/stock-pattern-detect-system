import yfinance as yf
import pandas as pd
from pymongo import MongoClient
from datetime import datetime

# MongoDB connection settings
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "candlestick_db"

# Create MongoDB client
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def fetch_and_store_stock_data(symbol, start_date, end_date):
    # Fetch stock metadata and historical candlestick data
    stock = yf.Ticker(symbol)
    stock_info = stock.info
    history = stock.history(start=start_date, end=end_date, interval="1d")

    # Check if stock already exists in the database
    existing_stock = db.stocks.find_one({"symbol": symbol})
    if not existing_stock:
        # Insert new stock metadata into the "stocks" collection
        stock_data = {
            "symbol": symbol,
            "name": stock_info.get("longName", "Unknown"),
            "market": stock_info.get("market", "Unknown"),
        }
        stock_id = db.stocks.insert_one(stock_data).inserted_id
    else:
        stock_id = existing_stock["_id"]

    # Prepare candlestick data
    history.reset_index(inplace=True)
    candlestick_data = []
    for _, row in history.iterrows():
        candlestick = {
            "stock_id": str(stock_id),
            "date": row["Date"].timestamp(),
            "open": row["Open"],
            "high": row["High"],
            "low": row["Low"],
            "close": row["Close"],
            "volume": row["Volume"],
        }
        candlestick_data.append(candlestick)

    # Insert candlestick data into the "candlesticks" collection
    if candlestick_data:
        db.candlesticks.insert_many(candlestick_data)

    print(f"Data for {symbol} has been successfully stored.")

# Example usage
fetch_and_store_stock_data("AAPL", "2000-01-01", "2025-01-15")
fetch_and_store_stock_data("GOOG", "2000-01-01", "2025-01-15")
fetch_and_store_stock_data("AMZN", "2000-01-01", "2025-01-15")
fetch_and_store_stock_data("JBL", "2000-01-01", "2025-01-15")