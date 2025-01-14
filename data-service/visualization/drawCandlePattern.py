import requests
import pandas as pd
import plotly.graph_objects as go
from tkinter import Tk, Label, Button, OptionMenu, StringVar

# Hàm gọi API để lấy dữ liệu giá cổ phiếu
def get_stock_data(symbol):
    api_url = f"http://localhost:60/stock?symbol={symbol}"
    response = requests.get(api_url)
    if response.status_code == 200:
        result = response.json()
        if "data" in result:
            return result["data"]
        else:
            return []  # Nếu không có dữ liệu
    else:
        print(f"Error: {response.status_code}")
        return []

# Hàm tính SMA (Simple Moving Average)
def calculate_sma(prices, window):
    return prices.rolling(window=window).mean()

# Hàm vẽ biểu đồ nến với SMA
def plot_candlestick(data):
    if not data:
        print("No data to plot.")
        return

    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'], unit='s')

    # Tính SMA
    df['SMA_20'] = calculate_sma(df['close'], window=20)
    df['SMA_50'] = calculate_sma(df['close'], window=50)

    # Vẽ biểu đồ nến
    fig = go.Figure(data=[go.Candlestick(
        x=df['date'],
        open=df['open'],
        high=df['high'],
        low=df['low'],
        close=df['close'],
        increasing_line_color='green',
        decreasing_line_color='red'
    )])

    # Thêm SMA vào biểu đồ
    fig.add_trace(go.Scatter(x=df['date'], y=df['SMA_20'], mode='lines', name='SMA 20', line=dict(color='blue', width=2)))
    fig.add_trace(go.Scatter(x=df['date'], y=df['SMA_50'], mode='lines', name='SMA 50', line=dict(color='orange', width=2)))

    # Cấu hình biểu đồ
    fig.update_layout(
        title='Candlestick Chart with SMA',
        xaxis_title='Date',
        yaxis_title='Price (USD)',
        xaxis_rangeslider_visible=False
    )

    fig.show()

# Hàm xử lý khi người dùng chọn stockId
def on_stock_select(symbol):
    print(f"Selected Stock: {symbol}")
    stock_data = get_stock_data(symbol)
    if stock_data:
        plot_candlestick(stock_data)
    else:
        print("No data available.")

# Giao diện người dùng
def create_gui():
    root = Tk()
    root.title("Stock Candlestick Chart")

    # Danh sách stockId
    stock_list = ["APPL", "AMZN", "GOOG", "JBL"]

    # Tạo menu chọn stockId
    selected_stock = StringVar(root)
    selected_stock.set(stock_list[0])

    Label(root, text="Select Stock:").pack()
    dropdown = OptionMenu(root, selected_stock, *stock_list)
    dropdown.pack()

    # Nút "Fetch Data"
    Button(root, text="Fetch Data", command=lambda: on_stock_select(selected_stock.get())).pack()

    root.mainloop()

# Chạy ứng dụng
create_gui()
