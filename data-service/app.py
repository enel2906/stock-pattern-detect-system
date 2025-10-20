"""
Flask API để cung cấp dữ liệu intraday từ vnstock
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from vnstock import Vnstock
import logging
from datetime import datetime, timedelta
import pandas as pd
import random

app = Flask(__name__)
CORS(app)  # Enable CORS cho tất cả routes

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_mock_data(symbol, limit=5, base_price=45000):
    """
    Tạo mock data cho testing khi vnstock không hoạt động
    """
    result = []
    current_time = datetime.now()
    
    for i in range(limit):
        # Tạo giá ngẫu nhiên quanh base_price
        variance = random.uniform(-0.02, 0.02)  # ±2%
        open_price = base_price * (1 + variance)
        
        variance = random.uniform(-0.01, 0.01)
        high_price = open_price * (1 + abs(variance))
        
        variance = random.uniform(-0.01, 0.01)
        low_price = open_price * (1 - abs(variance))
        
        variance = random.uniform(-0.01, 0.01)
        close_price = open_price * (1 + variance)
        
        # Đảm bảo high là cao nhất, low là thấp nhất
        high_price = max(open_price, high_price, close_price)
        low_price = min(open_price, low_price, close_price)
        
        candle = {
            'time': (current_time - timedelta(minutes=(limit-i)*5)).strftime('%H:%M:%S'),
            'open': round(open_price, 2),
            'high': round(high_price, 2),
            'low': round(low_price, 2),
            'close': round(close_price, 2),
            'volume': random.randint(100000, 1000000)
        }
        result.append(candle)
        
        # Update base price cho candle tiếp theo
        base_price = close_price
    
    return result


@app.route('/intraday/<symbol>', methods=['GET'])
def get_intraday_data(symbol):
    """
    Lấy dữ liệu intraday cho một mã cổ phiếu
    
    Args:
        symbol: Mã cổ phiếu (VD: VIC, VNM, FPT)
        limit: Số lượng nến cần lấy (default: 5)
    
    Returns:
        JSON array of candle data
    """
    try:
        # Lấy tham số limit từ query string
        limit = request.args.get('limit', default=5, type=int)
        use_mock = request.args.get('mock', default='false', type=str).lower() == 'true'
        
        logger.info(f"Fetching intraday data for {symbol}, limit={limit}, use_mock={use_mock}")
        
        # Nếu yêu cầu mock data hoặc gặp lỗi với vnstock
        if use_mock:
            logger.info(f"Using mock data for {symbol}")
            result = generate_mock_data(symbol, limit)
            return jsonify(result)
        
        try:
            # Thử lấy dữ liệu từ vnstock
            stock = Vnstock().stock(symbol=symbol.upper(), source='VCI')
            intraday_df = stock.quote.intraday()
            
            # Kiểm tra nếu DataFrame không rỗng và có dữ liệu
            if intraday_df is not None and not intraday_df.empty:
                logger.info(f"vnstock returned data with columns: {intraday_df.columns.tolist()}")
                
                # Lấy N dòng cuối cùng (mới nhất)
                recent_data = intraday_df.tail(limit)
                
                # Chuyển đổi DataFrame thành list of dict
                result = []
                for idx, row in recent_data.iterrows():
                    # Xử lý tên cột có thể khác nhau
                    candle = {
                        'time': str(row.get('time', row.get('Time', idx))),
                        'open': float(row.get('open', row.get('Open', row.get('o', 0)))),
                        'high': float(row.get('high', row.get('High', row.get('h', 0)))),
                        'low': float(row.get('low', row.get('Low', row.get('l', 0)))),
                        'close': float(row.get('close', row.get('Close', row.get('c', 0)))),
                        'volume': int(row.get('volume', row.get('Volume', row.get('v', 0))))
                    }
                    result.append(candle)
                
                if len(result) > 0:
                    logger.info(f"Successfully fetched {len(result)} candles from vnstock for {symbol}")
                    return jsonify(result)
            
            # Nếu không có dữ liệu từ vnstock, fallback sang mock data
            logger.warning(f"vnstock returned empty data for {symbol}, using mock data")
            result = generate_mock_data(symbol, limit)
            return jsonify(result)
            
        except Exception as vnstock_error:
            logger.error(f"vnstock error for {symbol}: {str(vnstock_error)}")
            logger.info(f"Falling back to mock data for {symbol}")
            result = generate_mock_data(symbol, limit)
            return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in get_intraday_data for {symbol}: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'symbol': symbol,
            'message': 'Failed to fetch data. Please try again or use mock data by adding ?mock=true'
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'data-service'
    })


if __name__ == '__main__':
    logger.info("Starting Data Service on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
