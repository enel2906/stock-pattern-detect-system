"""
Test script để kiểm tra symbols validation
"""
from pymongo import MongoClient

# Hàm validate symbols (copy từ server.py)
def validate_symbols(symbols_list):
    """
    Validate và clean danh sách symbols
    
    Args:
        symbols_list: List of stock symbols
    
    Returns:
        List of cleaned, valid symbols
    """
    valid_symbols = []
    invalid_symbols = []
    
    for symbol in symbols_list:
        if not symbol:
            continue
        # Clean: strip whitespace, uppercase, remove special chars
        cleaned = str(symbol).strip().upper()
        # Validate: chỉ chấp nhận chữ cái và số (3-4 ký tự thường gặp)
        if cleaned and cleaned.isalnum() and 1 <= len(cleaned) <= 10:
            valid_symbols.append(cleaned)
        else:
            invalid_symbols.append((symbol, cleaned))
    
    return valid_symbols, invalid_symbols


def main():
    # Kết nối MongoDB
    client = MongoClient('mongodb://localhost:27017/candlestick_db')
    db = client.get_database()
    stocks_collection = db['stocks']
    
    # Lấy tất cả stocks Việt Nam
    vietnam_stocks = list(stocks_collection.find(
        {"market": {"$ne": "US"}},
        {"symbol": 1}
    ))
    
    symbols_list = [stock['symbol'] for stock in vietnam_stocks]
    
    print(f"📊 Total Vietnam stocks in database: {len(symbols_list)}")
    print(f"📋 First 20 symbols: {symbols_list[:20]}")
    print()
    
    # Validate
    valid, invalid = validate_symbols(symbols_list)
    
    print(f"✅ Valid symbols: {len(valid)}")
    print(f"❌ Invalid symbols: {len(invalid)}")
    
    if invalid:
        print("\n🚨 Invalid symbols found:")
        for orig, cleaned in invalid[:20]:
            print(f"  - Original: '{orig}' | Cleaned: '{cleaned}'")
    
    print(f"\n✅ Valid symbols (first 30): {valid[:30]}")
    
    # Kiểm tra symbols có khoảng trắng
    with_spaces = [s for s in symbols_list if s != s.strip()]
    if with_spaces:
        print(f"\n⚠️  Symbols with spaces: {with_spaces}")
    
    # Kiểm tra symbols có ký tự đặc biệt
    non_alnum = [s for s in symbols_list if not s.isalnum()]
    if non_alnum:
        print(f"\n⚠️  Symbols with special chars: {non_alnum}")
    
    client.close()


if __name__ == "__main__":
    main()
