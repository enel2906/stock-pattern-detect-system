$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

Write-Host "=== Python Data Service ===" -ForegroundColor Cyan
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install --upgrade pip --quiet
pip install fastapi uvicorn pymongo aio-pika pandas vnstock yfinance --quiet

# Try Silver package (optional)
pip install vnstock_news --quiet 2>$null

Write-Host ""
Write-Host "Starting server on http://localhost:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""
python server.py
