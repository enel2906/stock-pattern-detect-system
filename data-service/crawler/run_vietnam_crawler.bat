@echo off
echo Vietnam Stock Crawler Setup and Run
echo ====================================

echo.
echo 1. Installing required packages...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo Error: Failed to install packages
    pause
    exit /b 1
)

echo.
echo 2. Checking MongoDB connection...
echo Please ensure MongoDB is running on localhost:27017

echo.
echo 3. Running test crawler...
python test_vietnam_crawler.py

echo.
echo 4. Running main crawler for popular stocks...
python crawlVietnamStockData.py

echo.
echo Crawler completed!
pause