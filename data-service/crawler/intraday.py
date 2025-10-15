# @title Lấy dữ liệu intraday của mã VIC (phiên bản mới vnstock 3.1.0+)
# !pip install -U vnstock

from vnstock import Vnstock

# 1️⃣ Khởi tạo đối tượng cổ phiếu VIC từ nguồn dữ liệu VCI
stock = Vnstock().stock(symbol='VIC', source='VCI')

# 2️⃣ Lấy dữ liệu intraday (không cần tham số interval)
intraday_df = stock.quote.intraday()

# 3️⃣ Hiển thị kết quả
print(intraday_df.head())
