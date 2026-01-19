# ============================================
# Ngrok Tunnel Setup Script (Simplified)
# ============================================
# Creates SINGLE ngrok tunnel for Frontend (port 5173)
# Vite dev server proxies all API requests to backend services
# ============================================

param(
    [switch]$Help
)

function Write-Color {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Show-Help {
    Write-Color "`n===== Ngrok Tunnel Setup - Help =====" "Cyan"
    Write-Color "Usage:" "Yellow"
    Write-Color "  .\start-ngrok.ps1              # Start ngrok tunnel"
    Write-Color "  .\start-ngrok.ps1 -Help        # Show this help"
    Write-Color "`nRequirements:" "Yellow"
    Write-Color "  1. Install ngrok: https://ngrok.com/download"
    Write-Color "  2. Create free account and get authtoken"
    Write-Color "  3. Run: ngrok config add-authtoken YOUR_TOKEN"
    Write-Color "`nHow it works:" "Yellow"
    Write-Color "  - Single ngrok URL tunnels to Vite dev server (port 5173)"
    Write-Color "  - Vite proxy routes /api, /oauth2, /ws to Java backend (port 60)"
    Write-Color "  - Vite proxy routes /data-api to Python service (port 8000)"
    Write-Color "  - No CORS issues - everything is same origin!"
    Write-Color "`nAfter starting:" "Yellow"
    Write-Color "  1. Copy the ngrok URL shown (e.g., https://xxx.ngrok-free.app)"
    Write-Color "  2. Add to Google OAuth redirect URIs:"
    Write-Color "     https://xxx.ngrok-free.app/login/oauth2/code/google"
    Write-Color "  3. Access your app via the ngrok URL"
    exit 0
}

if ($Help) { Show-Help }

Write-Color "`n============================================" "Magenta"
Write-Color "  Ngrok Tunnel Setup (Single URL + Proxy)" "Magenta"
Write-Color "============================================`n" "Magenta"

# Check if ngrok is installed
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Color "[X] ngrok is NOT installed!" "Red"
    Write-Color "`nTo install ngrok:" "Yellow"
    Write-Color "  1. Download from: https://ngrok.com/download" "White"
    Write-Color "  2. Extract to a folder in your PATH" "White"
    Write-Color "  3. Create account at: https://dashboard.ngrok.com/signup" "White"
    Write-Color "  4. Get authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken" "White"
    Write-Color "  5. Run: ngrok config add-authtoken YOUR_AUTHTOKEN" "White"
    exit 1
}

Write-Color "[OK] ngrok found" "Green"

# Check if services are running
Write-Color "`nChecking services..." "Cyan"

$viteRunning = Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet -WarningAction SilentlyContinue
$javaRunning = Test-NetConnection -ComputerName localhost -Port 60 -InformationLevel Quiet -WarningAction SilentlyContinue
$pythonRunning = Test-NetConnection -ComputerName localhost -Port 8000 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($viteRunning) { Write-Color "  [OK] Vite dev server (5173)" "Green" }
else { Write-Color "  [!] Vite dev server (5173) - NOT running" "Yellow" }

if ($javaRunning) { Write-Color "  [OK] Java backend (60)" "Green" }
else { Write-Color "  [!] Java backend (60) - NOT running" "Yellow" }

if ($pythonRunning) { Write-Color "  [OK] Python data service (8000)" "Green" }
else { Write-Color "  [!] Python data service (8000) - NOT running" "Yellow" }

if (-not $viteRunning) {
    Write-Color "`n[!] Vite dev server is required for proxy to work!" "Red"
    Write-Color "    Start it first: cd client-service/react-client && npm run dev" "Yellow"
    $continue = Read-Host "`nContinue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") { exit 1 }
}

Write-Color "`nStarting ngrok tunnel to Vite (port 5173)..." "Yellow"
Write-Color "Press Ctrl+C to stop the tunnel`n" "Gray"

# Start ngrok and keep this window open
ngrok http 5173

# This will only execute after ngrok is closed
Write-Color "`nNgrok tunnel closed." "Gray"
Write-Color "4. On first visit, click 'Visit Site' on ngrok warning page" "White"
Write-Color ""

# Wait for user to read instructions
Write-Color "Press Enter to open ngrok web interface (http://localhost:4040)..." "Gray"
Read-Host

Start-Process "http://localhost:4040"
