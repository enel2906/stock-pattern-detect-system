#!/usr/bin/env python3
"""
Test script cho Vietnam Stock Crawler
"""

from crawlVietnamStockData import VietnamStockCrawler
from datetime import datetime, timedelta
import sys

def test_single_stock():
    """Test crawl một cổ phiếu"""
    print("=== Test crawling single stock (VIC) ===")
    
    crawler = VietnamStockCrawler()
    
    # Test với VIC trong 1 tháng gần nhất
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    success = crawler.fetch_and_store_stock_data(
        symbol='VIC',
        start_date=start_date.strftime("%Y-%m-%d"),
        end_date=end_date.strftime("%Y-%m-%d")
    )
    
    if success:
        print("✓ Successfully crawled VIC data")
    else:
        print("✗ Failed to crawl VIC data")

def test_multiple_stocks():
    """Test crawl nhiều cổ phiếu"""
    print("\n=== Test crawling multiple stocks ===")
    
    crawler = VietnamStockCrawler()
    
    # Test với một số cổ phiếu banking
    banking_stocks = ['VCB', 'BID', 'CTG']
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)  # 1 tuần
    
    crawler.crawl_specific_stocks(
        symbols=banking_stocks,
        start_date=start_date.strftime("%Y-%m-%d"),
        end_date=end_date.strftime("%Y-%m-%d")
    )

def test_stock_list():
    """Test lấy danh sách cổ phiếu"""
    print("\n=== Test getting Vietnam stock list ===")
    
    crawler = VietnamStockCrawler()
    stocks = crawler.get_vietnam_stock_list()
    
    print(f"Found {len(stocks)} Vietnam stocks")
    
    # In ra 10 cổ phiếu đầu tiên
    print("First 10 stocks:")
    for i, stock in enumerate(stocks[:10]):
        print(f"{i+1}. {stock['symbol']} - {stock['name']} ({stock['market']})")

def main():
    """Chạy tất cả tests"""
    print("Vietnam Stock Crawler Test Suite")
    print("=" * 50)
    
    try:
        # Test 1: Single stock
        test_single_stock()
        
        # Test 2: Multiple stocks  
        test_multiple_stocks()
        
        # Test 3: Stock list
        test_stock_list()
        
        print("\n" + "=" * 50)
        print("All tests completed!")
        
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nTest failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()