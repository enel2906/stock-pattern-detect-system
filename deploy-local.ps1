# ============================================
# Stock Pattern Detection System - Local Deployment Script
# ============================================
# Flow: RabbitMQ (Docker) -> MongoDB (Local) -> Data Service (Python) -> Alert Service (Java) -> React Client
# ============================================

param(
    [switch]$SkipPrerequisites,
    [switch]$StopAll,
    [switch]$Help
)

# Get script directory
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $SCRIPT_DIR

function Write-Color {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Show-Help {
    Write-Color "`n===== Stock Pattern Detection System - Help =====" "Cyan"
    Write-Color "Usage:" "Yellow"
    Write-Color "  .\deploy-local.ps1              # Full deployment"
    Write-Color "  .\deploy-local.ps1 -StopAll     # Stop all services"
    Write-Color "  .\deploy-local.ps1 -Help        # Show this help"
    Write-Color "`nServices:" "Yellow"
    Write-Color "  - RabbitMQ:      localhost:5672, localhost:15672"
    Write-Color "  - MongoDB:       localhost:27017"
    Write-Color "  - Data Service:  localhost:8000"
    Write-Color "  - Alert Service: localhost:60"
    Write-Color "  - React Client:  localhost:5173"
    exit 0
}

function Stop-AllServices {
    Write-Color "`nStopping all services..." "Yellow"
    
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Color "  Stopped Node.js processes" "Green"
    
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Color "  Stopped Python processes" "Green"
    
    Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Color "  Stopped Java processes" "Green"
    
    # Stop any RabbitMQ container (by image name)
    $rabbitContainer = docker ps --format "{{.Names}}|{{.Image}}" 2>$null | Where-Object { $_ -match "rabbitmq" } | ForEach-Object { ($_ -split "\|")[0] }
    if ($rabbitContainer) {
        docker stop $rabbitContainer 2>$null
        Write-Color "  Stopped RabbitMQ container ($rabbitContainer)" "Green"
    }
    
    Write-Color "`nAll services stopped!" "Green"
    exit 0
}

if ($Help) { Show-Help }
if ($StopAll) { Stop-AllServices }

Write-Color "`n============================================" "Magenta"
Write-Color "  Stock Pattern Detection System" "Magenta"
Write-Color "  Local Deployment Script" "Magenta"
Write-Color "============================================`n" "Magenta"

# ============================================
# STEP 0: Check Prerequisites
# ============================================
if (-not $SkipPrerequisites) {
    Write-Color "Step 0: Checking prerequisites..." "Cyan"
    
    $allPassed = $true
    
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Color "  [OK] Docker found" "Green"
    } else {
        Write-Color "  [X] Docker NOT found" "Red"
        $allPassed = $false
    }
    
    if (Get-Command java -ErrorAction SilentlyContinue) {
        Write-Color "  [OK] Java found" "Green"
    } else {
        Write-Color "  [X] Java NOT found" "Red"
        $allPassed = $false
    }
    
    if (Get-Command mvn -ErrorAction SilentlyContinue) {
        Write-Color "  [OK] Maven found" "Green"
    } else {
        Write-Color "  [X] Maven NOT found" "Red"
        $allPassed = $false
    }
    
    if (Get-Command python -ErrorAction SilentlyContinue) {
        Write-Color "  [OK] Python found" "Green"
    } else {
        Write-Color "  [X] Python NOT found" "Red"
        $allPassed = $false
    }
    
    if (Get-Command node -ErrorAction SilentlyContinue) {
        Write-Color "  [OK] Node.js found" "Green"
    } else {
        Write-Color "  [X] Node.js NOT found" "Red"
        $allPassed = $false
    }
    
    # Check Docker running
    $dockerInfo = docker info 2>$null
    if ($dockerInfo) {
        Write-Color "  [OK] Docker is running" "Green"
    } else {
        Write-Color "  [X] Docker is NOT running - Please start Docker Desktop" "Red"
        $allPassed = $false
    }
    
    if (-not $allPassed) {
        Write-Color "`nSome prerequisites are missing. Please install them first." "Red"
        exit 1
    }
    Write-Color "  All prerequisites passed!`n" "Green"
}

# ============================================
# STEP 1: Start RabbitMQ
# ============================================
Write-Color "Step 1: Starting RabbitMQ (Docker)..." "Cyan"

# Check if any RabbitMQ container is running (by image name containing "rabbitmq")
$existingRabbit = docker ps -a --format "{{.Names}}|{{.Image}}|{{.Status}}" 2>$null | Where-Object { $_ -match "rabbitmq" }

if ($existingRabbit) {
    $containerInfo = $existingRabbit -split "\|"
    $containerName = $containerInfo[0]
    $containerImage = $containerInfo[1]
    $containerStatus = $containerInfo[2]
    
    Write-Color "  Found existing RabbitMQ container: $containerName ($containerImage)" "Yellow"
    
    if ($containerStatus -match "Up") {
        Write-Color "  [OK] RabbitMQ already running" "Green"
    } else {
        Write-Color "  Starting existing container..." "Yellow"
        docker start $containerName | Out-Null
        Write-Color "  [OK] RabbitMQ started ($containerName)" "Green"
        Write-Color "  Waiting for RabbitMQ (10s)..." "Yellow"
        Start-Sleep -Seconds 10
    }
} else {
    Write-Color "  No RabbitMQ container found, creating new one..." "Yellow"
    docker run -d --name stock-rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management | Out-Null
    Write-Color "  [OK] RabbitMQ container created" "Green"
    Write-Color "  Waiting for RabbitMQ (10s)..." "Yellow"
    Start-Sleep -Seconds 10
}

Write-Color "  RabbitMQ UI: http://localhost:15672 (guest/guest)`n" "Gray"

# ============================================
# STEP 2: Check MongoDB
# ============================================
Write-Color "Step 2: Checking MongoDB..." "Cyan"

$mongoTest = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
if ($mongoTest.TcpTestSucceeded) {
    Write-Color "  [OK] MongoDB is running`n" "Green"
} else {
    Write-Color "  [X] MongoDB is NOT running on port 27017" "Red"
    $startMongo = Read-Host "  Start MongoDB in Docker? (y/n)"
    if ($startMongo -eq 'y') {
        $mongoExists = docker ps -a --filter "name=stock-mongodb" --format "{{.Names}}" 2>$null
        if ($mongoExists) {
            docker start stock-mongodb | Out-Null
        } else {
            docker run -d --name stock-mongodb -p 27017:27017 mongo:7.0 | Out-Null
        }
        Write-Color "  [OK] MongoDB started`n" "Green"
        Start-Sleep -Seconds 5
    }
}

# ============================================
# STEP 3: Start Python Data Service (in venv)
# ============================================
Write-Color "Step 3: Starting Python Data Service..." "Cyan"

$dataServicePath = Join-Path $SCRIPT_DIR "data-service"
$venvPath = Join-Path $dataServicePath "venv"

# Create venv if not exists
if (-not (Test-Path $venvPath)) {
    Write-Color "  Creating virtual environment..." "Yellow"
    Push-Location $dataServicePath
    python -m venv venv
    Pop-Location
}

# Create start script for Data Service
$startDataService = Join-Path $dataServicePath "start-service.ps1"
$scriptLines = @(
    '$ErrorActionPreference = "Continue"',
    'Set-Location $PSScriptRoot',
    '',
    'Write-Host "=== Python Data Service ===" -ForegroundColor Cyan',
    'Write-Host "Activating virtual environment..." -ForegroundColor Yellow',
    '& ".\venv\Scripts\Activate.ps1"',
    '',
    'Write-Host "Installing dependencies..." -ForegroundColor Yellow',
    'pip install --upgrade pip --quiet',
    'pip install fastapi uvicorn pymongo aio-pika pandas vnstock yfinance --quiet',
    '',
    '# Try Silver package (optional)',
    'pip install vnstock_news --quiet 2>$null',
    '',
    'Write-Host ""',
    'Write-Host "Starting server on http://localhost:8000" -ForegroundColor Green',
    'Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray',
    'Write-Host ""',
    'python server.py'
)
$scriptLines -join "`r`n" | Out-File -FilePath $startDataService -Encoding UTF8 -Force

# Start in new terminal
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $startDataService
Write-Color "  [OK] Data Service starting in new terminal" "Green"
Write-Color "  API: http://localhost:8000`n" "Gray"

Write-Color "  Waiting for Data Service (15s)..." "Yellow"
Start-Sleep -Seconds 15

# ============================================
# STEP 4: Start Java Alert Service
# ============================================
Write-Color "Step 4: Starting Java Alert Service..." "Cyan"

$alertServicePath = Join-Path $SCRIPT_DIR "alert-service"

# Create start script for Alert Service
$startAlertService = Join-Path $alertServicePath "start-service.ps1"
$scriptLines = @(
    '$ErrorActionPreference = "Continue"',
    'Set-Location $PSScriptRoot',
    '',
    'Write-Host "=== Java Alert Service ===" -ForegroundColor Cyan',
    'Write-Host "Building with Maven..." -ForegroundColor Yellow',
    'mvn clean package -DskipTests -q',
    '',
    'Write-Host ""',
    'Write-Host "Starting server on http://localhost:60" -ForegroundColor Green',
    'Write-Host "WebSocket: ws://localhost:60/ws" -ForegroundColor Green',
    'Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray',
    'Write-Host ""',
    'mvn spring-boot:run'
)
$scriptLines -join "`r`n" | Out-File -FilePath $startAlertService -Encoding UTF8 -Force

# Start in new terminal
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $startAlertService
Write-Color "  [OK] Alert Service starting in new terminal" "Green"
Write-Color "  API: http://localhost:60" "Gray"
Write-Color "  WebSocket: ws://localhost:60/ws`n" "Gray"

Write-Color "  Waiting for Alert Service to build (30s)..." "Yellow"
Start-Sleep -Seconds 30

# ============================================
# STEP 5: Start React Client
# ============================================
Write-Color "Step 5: Starting React Client..." "Cyan"

$clientPath = Join-Path $SCRIPT_DIR "client-service\react-client"

# Create start script for React
$startReact = Join-Path $clientPath "start-service.ps1"
$scriptLines = @(
    '$ErrorActionPreference = "Continue"',
    'Set-Location $PSScriptRoot',
    '',
    'Write-Host "=== React Client ===" -ForegroundColor Cyan',
    '',
    'if (-not (Test-Path "node_modules")) {',
    '    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow',
    '    npm install',
    '}',
    '',
    'Write-Host ""',
    'Write-Host "Starting on http://localhost:5173" -ForegroundColor Green',
    'Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray',
    'Write-Host ""',
    'npm run dev'
)
$scriptLines -join "`r`n" | Out-File -FilePath $startReact -Encoding UTF8 -Force

# Start in new terminal
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $startReact
Write-Color "  [OK] React Client starting in new terminal" "Green"
Write-Color "  Web: http://localhost:5173`n" "Gray"

Start-Sleep -Seconds 5

# ============================================
# DONE
# ============================================
Write-Color "`n============================================" "Green"
Write-Color "  DEPLOYMENT COMPLETE!" "Green"
Write-Color "============================================" "Green"

Write-Color "`nService URLs:" "Cyan"
Write-Color "  Web App:      http://localhost:5173" "White"
Write-Color "  Alert API:    http://localhost:60" "White"
Write-Color "  Data API:     http://localhost:8000" "White"
Write-Color "  RabbitMQ:     http://localhost:15672" "White"

# Get local IP
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notmatch "^169" 
} | Select-Object -First 1).IPAddress

if ($localIP) {
    Write-Color "`nLAN Access:" "Cyan"
    Write-Color "  Your IP: $localIP" "Yellow"
    Write-Color "  Other devices: http://${localIP}:5173" "Yellow"
}

Write-Color "`nTo stop all: .\deploy-local.ps1 -StopAll" "Gray"
Write-Color ""
