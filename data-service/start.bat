@echo off
echo ================================================
echo  Stock Data Service - Quick Start
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1/5] Checking virtual environment...
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo [2/5] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/5] Installing dependencies...
pip install -r requirements.txt --quiet

echo [4/5] Checking configuration...
if not exist ".env" (
    echo Creating .env from example...
    copy .env.example .env
    echo Please edit .env file with your settings if needed
)

echo [5/5] Starting server...
echo.
echo ================================================
echo  Server starting on http://localhost:60
echo  API Docs: http://localhost:60/docs
echo  Health Check: http://localhost:60/health
echo  Metrics: http://localhost:60/metrics
echo ================================================
echo.
echo Press Ctrl+C to stop the server
echo.

python app.py

pause
