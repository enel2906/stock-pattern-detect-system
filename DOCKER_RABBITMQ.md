# RabbitMQ Docker Setup - Quick Start

## ✅ You Already Have RabbitMQ Running!

Your RabbitMQ container is already set up:
```
CONTAINER ID: 93a350aea097
IMAGE: rabbitmq:4.2.1-management
PORTS: 
  - 5672 (AMQP)
  - 15672 (Management UI)
NAME: my-rabbit
```

## 🔧 Quick Commands

### Start RabbitMQ Container
```powershell
docker start my-rabbit
```

### Stop RabbitMQ Container
```powershell
docker stop my-rabbit
```

### Check Status
```powershell
docker ps -a | findstr rabbit
```

### View Logs
```powershell
docker logs my-rabbit
```

### Follow Logs in Real-Time
```powershell
docker logs -f my-rabbit
```

### Restart Container
```powershell
docker restart my-rabbit
```

## 🌐 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Management UI | http://localhost:15672 | guest/guest |
| AMQP Port | localhost:5672 | guest/guest |

## ✅ Verification Steps

### 1. Check if Container is Running
```powershell
docker ps | findstr rabbit
```

**Expected Output:**
```
93a350aea097   rabbitmq:4.2.1-management   ...   Up X minutes   0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp   my-rabbit
```

### 2. Test AMQP Port
```powershell
Test-NetConnection -ComputerName localhost -Port 5672
```

**Expected Output:**
```
TcpTestSucceeded : True
```

### 3. Test Management UI
```powershell
Test-NetConnection -ComputerName localhost -Port 15672
```

Or open in browser: http://localhost:15672

### 4. Login to Management UI
- URL: http://localhost:15672
- Username: `guest`
- Password: `guest`

## 🚀 Start Your Real-Time Pipeline

Now that RabbitMQ is running, start your services:

### Terminal 1: Start RabbitMQ (if not running)
```powershell
docker start my-rabbit
```

### Terminal 2: Python Data Service
```powershell
cd D:\PNM\Hust\DATN\stock-pattern-detect-system\data-service
python server.py
```

**Look for:**
```
INFO:server:RabbitMQ connected successfully
INFO:server:Published update for VCB: stock.update.VCB
```

### Terminal 3: Java Backend
```powershell
cd D:\PNM\Hust\DATN\stock-pattern-detect-system\alert-service
mvn spring-boot:run
```

**Look for:**
```
Received stock update for symbol: VCB
Sent stock update to WebSocket topic: /topic/stock-updates/VCB
```

### Terminal 4: React Frontend
```powershell
cd D:\PNM\Hust\DATN\stock-pattern-detect-system\client-service\react-client
npm run dev
```

## 🔍 Troubleshooting

### Issue: Container Exited

**Check why it exited:**
```powershell
docker logs my-rabbit
```

**Restart it:**
```powershell
docker start my-rabbit
```

### Issue: Port Already in Use

**Check what's using the port:**
```powershell
netstat -ano | findstr :5672
netstat -ano | findstr :15672
```

**Kill the process (if needed):**
```powershell
# Replace <PID> with the actual process ID
Stop-Process -Id <PID> -Force
```

### Issue: Cannot Connect to RabbitMQ

**1. Ensure container is running:**
```powershell
docker ps | findstr rabbit
```

**2. Check container health:**
```powershell
docker inspect my-rabbit | findstr Status
```

**3. Restart container:**
```powershell
docker restart my-rabbit
```

**4. Wait a few seconds for RabbitMQ to fully start:**
```powershell
# Give it 10 seconds to initialize
Start-Sleep -Seconds 10
```

## 📊 Monitor Your Pipeline

### Check RabbitMQ Management UI
1. Open http://localhost:15672
2. Login with guest/guest
3. Go to "Exchanges" → Find `stock.market.data`
4. Go to "Queues" → Find `stock.live.updates`
5. Check message rates

### Check Python Service Logs
Look for:
```
INFO:server:Published update for VCB: stock.update.VCB
```

### Check Java Backend Logs
Look for:
```
Received stock update for symbol: VCB
```

### Check React Console
Open browser console (F12) and look for:
```
WebSocket connected for symbol: VCB
Received stock update: {symbol: "VCB", ...}
```

## 🎯 Quick Health Check Script

Create a file `check_rabbitmq.ps1`:
```powershell
# Check if RabbitMQ container is running
$container = docker ps --filter "name=my-rabbit" --format "{{.Status}}"

if ($container -like "Up*") {
    Write-Host "✅ RabbitMQ container is running" -ForegroundColor Green
    
    # Test AMQP port
    $amqp = Test-NetConnection -ComputerName localhost -Port 5672 -WarningAction SilentlyContinue
    if ($amqp.TcpTestSucceeded) {
        Write-Host "✅ AMQP port 5672 is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ AMQP port 5672 is not accessible" -ForegroundColor Red
    }
    
    # Test Management port
    $mgmt = Test-NetConnection -ComputerName localhost -Port 15672 -WarningAction SilentlyContinue
    if ($mgmt.TcpTestSucceeded) {
        Write-Host "✅ Management UI port 15672 is accessible" -ForegroundColor Green
        Write-Host "🌐 Access at: http://localhost:15672" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Management UI port 15672 is not accessible" -ForegroundColor Red
    }
} else {
    Write-Host "❌ RabbitMQ container is not running" -ForegroundColor Red
    Write-Host "Start it with: docker start my-rabbit" -ForegroundColor Yellow
}
```

Run it:
```powershell
.\check_rabbitmq.ps1
```

## 🔄 If You Need to Recreate the Container

Only if you have issues and need to start fresh:

```powershell
# Stop and remove existing container
docker stop my-rabbit
docker rm my-rabbit

# Create new container
docker run -d `
  --name my-rabbit `
  -p 5672:5672 `
  -p 15672:15672 `
  rabbitmq:4.2.1-management

# Wait for it to start
Start-Sleep -Seconds 10

# Check status
docker ps | findstr rabbit
```

## 📝 Important Notes

✅ **Your container is persistent** - Data is preserved when stopped/started  
✅ **Auto-restart on reboot** - Add `--restart unless-stopped` if needed  
✅ **No installation required** - Everything runs in Docker  
✅ **Easy cleanup** - Just remove the container when done

## 🎉 You're All Set!

Your RabbitMQ is ready. Just make sure it's running before starting the Python service:

```powershell
# Quick start
docker start my-rabbit
Start-Sleep -Seconds 5
cd data-service
python server.py
```

Look for the success message:
```
INFO:server:RabbitMQ connected successfully
```
