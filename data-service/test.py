from datetime import datetime, timedelta
from vnstock import Vnstock

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
            return None
            
        stock = Vnstock().stock(symbol=symbol, source='VCI')
        
        # Nếu không có ngày, lấy tất cả dữ liệu có thể (từ 10 năm trước)
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=3650)).strftime('%Y-%m-%d')
        if end_date is None:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        # Lấy dữ liệu lịch sử
        df = stock.quote.history(start=start_date, end=end_date, interval="1m")
        
        if df is not None and not df.empty:
            return df
        else:
            return None
            
    except Exception as e:
        return None
    
if __name__ == "__main__":
    # Ví dụ sử dụng
    symbol = "VCB"
    market = "HOSE"
    start_date = (datetime.now() - timedelta(days=3650)).strftime('%Y-%m-%d')
    end_date = datetime.now().strftime('%Y-%m-%d')
    
    data = get_stock_data_vnstock(symbol, market, start_date, end_date)
    if data is not None:
        print(data.tail())
    