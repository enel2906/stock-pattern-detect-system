$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

Write-Host "=== Java Alert Service ===" -ForegroundColor Cyan
Write-Host "Building with Maven..." -ForegroundColor Yellow
mvn clean package -DskipTests -q

Write-Host ""
Write-Host "Starting server on http://localhost:60" -ForegroundColor Green
Write-Host "WebSocket: ws://localhost:60/ws" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""
mvn spring-boot:run
