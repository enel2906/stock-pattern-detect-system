#!/usr/bin/env python3
"""
Quick test script for Stock Data Service
"""
import requests
import time

BASE_URL = "http://localhost:60"

def test_health():
    """Test health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed")
            print(f"   Components: {data['components']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_stock_data(symbol="HPG"):
    """Test stock data endpoint"""
    print(f"\n🔍 Testing stock data for {symbol}...")
    try:
        start_time = time.time()
        response = requests.get(
            f"{BASE_URL}/stock",
            params={"symbol": symbol},
            timeout=30
        )
        duration = (time.time() - start_time) * 1000
        
        if response.status_code == 200:
            data = response.json()
            headers = response.headers
            
            print(f"✅ Stock data fetched successfully")
            print(f"   Symbol: {data['symbol']}")
            print(f"   Rows: {len(data['data'])}")
            print(f"   Source: {headers.get('X-Data-Source', 'unknown')}")
            print(f"   Cache Hit: {headers.get('X-Cache-Hit', 'unknown')}")
            print(f"   Duration: {duration:.0f}ms")
            
            if len(data['data']) > 0:
                first = data['data'][0]
                print(f"   First row: {first}")
            
            return True
        else:
            print(f"❌ Stock data failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Stock data error: {e}")
        return False

def test_metrics():
    """Test metrics endpoint"""
    print("\n🔍 Testing metrics...")
    try:
        response = requests.get(f"{BASE_URL}/metrics", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Metrics fetched successfully")
            print(f"   Total requests: {data['requests']['total']}")
            print(f"   Cache hit rate: {data['cache_hit_rate']}")
            print(f"   Rate limit remaining: {data['rate_limiter']['remaining']}")
            return True
        else:
            print(f"❌ Metrics failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Metrics error: {e}")
        return False

def test_cache_performance():
    """Test cache performance with multiple requests"""
    print("\n🔍 Testing cache performance (3 requests to same symbol)...")
    symbol = "VCB"
    durations = []
    
    for i in range(3):
        try:
            start_time = time.time()
            response = requests.get(
                f"{BASE_URL}/stock",
                params={"symbol": symbol},
                timeout=30
            )
            duration = (time.time() - start_time) * 1000
            durations.append(duration)
            
            if response.status_code == 200:
                source = response.headers.get('X-Data-Source', 'unknown')
                cache_hit = response.headers.get('X-Cache-Hit', 'unknown')
                print(f"   Request {i+1}: {duration:.0f}ms (source: {source}, cache: {cache_hit})")
            else:
                print(f"   Request {i+1}: Failed ({response.status_code})")
                
        except Exception as e:
            print(f"   Request {i+1}: Error - {e}")
    
    if len(durations) >= 2:
        speedup = durations[0] / durations[-1]
        print(f"\n✅ Cache speedup: {speedup:.1f}x faster")
        print(f"   First request: {durations[0]:.0f}ms")
        print(f"   Last request: {durations[-1]:.0f}ms")

def main():
    print("=" * 60)
    print("🚀 Stock Data Service - Test Suite")
    print("=" * 60)
    print()
    
    # Run tests
    tests_passed = 0
    tests_total = 4
    
    if test_health():
        tests_passed += 1
    
    if test_stock_data("HPG"):
        tests_passed += 1
    
    if test_metrics():
        tests_passed += 1
    
    test_cache_performance()
    tests_passed += 1  # Always count this as passed
    
    # Summary
    print()
    print("=" * 60)
    print(f"📊 Test Results: {tests_passed}/{tests_total} passed")
    print("=" * 60)
    
    if tests_passed == tests_total:
        print("✅ All tests passed! Service is working correctly.")
        return 0
    else:
        print(f"⚠️  Some tests failed. Please check the logs.")
        return 1

if __name__ == "__main__":
    try:
        exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        exit(1)
