# RabbitMQ Installation Guide for Windows

## Option 1: Install with Chocolatey (Recommended)

### Step 1: Install Chocolatey (if not installed)
Open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### Step 2: Install RabbitMQ
```powershell
choco install rabbitmq -y
```

This will automatically:
- Install Erlang (prerequisite)
- Install RabbitMQ
- Configure as Windows service
- Enable management plugin

### Step 3: Verify Installation
```powershell
# Check if service is running
Get-Service -Name RabbitMQ

# Or
rabbitmq-service.bat status
```

---

## Option 2: Manual Installation

### Step 1: Install Erlang

1. Download Erlang from: https://www.erlang.org/downloads
2. Choose the Windows installer (e.g., `otp_win64_25.3.exe`)
3. Run the installer
4. Accept default installation path: `C:\Program Files\erl-25.3`
5. Add to PATH:
   ```powershell
   $env:Path += ";C:\Program Files\erl-25.3\bin"
   [Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::Machine)
   ```

### Step 2: Install RabbitMQ

1. Download RabbitMQ from: https://www.rabbitmq.com/download.html
2. Choose Windows installer (e.g., `rabbitmq-server-3.12.10.exe`)
3. Run the installer
4. Accept default installation path: `C:\Program Files\RabbitMQ Server`

### Step 3: Install RabbitMQ as Windows Service
```powershell
cd "C:\Program Files\RabbitMQ Server\rabbitmq_server-3.12.10\sbin"
.\rabbitmq-service.bat install
```

### Step 4: Start RabbitMQ Service
```powershell
net start RabbitMQ
```

### Step 5: Enable Management Plugin
```powershell
cd "C:\Program Files\RabbitMQ Server\rabbitmq_server-3.12.10\sbin"
.\rabbitmq-plugins.bat enable rabbitmq_management
```

---

## Verify Installation

### Check Service Status
```powershell
# Option 1: Using net command
net start | findstr RabbitMQ

# Option 2: Using Get-Service
Get-Service -Name RabbitMQ

# Option 3: Using rabbitmq-service
cd "C:\Program Files\RabbitMQ Server\rabbitmq_server-3.12.10\sbin"
.\rabbitmq-service.bat status
```

### Access Management Console
1. Open browser: http://localhost:15672
2. Login with default credentials:
   - Username: `guest`
   - Password: `guest`

### Test Connection
```powershell
# Using PowerShell
Test-NetConnection -ComputerName localhost -Port 5672
Test-NetConnection -ComputerName localhost -Port 15672
```

---

## Common Commands

### Start Service
```powershell
net start RabbitMQ
```

### Stop Service
```powershell
net stop RabbitMQ
```

### Restart Service
```powershell
net stop RabbitMQ
net start RabbitMQ
```

### Check Status
```powershell
rabbitmq-service.bat status
```

### View Logs
```powershell
# Logs location
cd C:\Users\<YourUser>\AppData\Roaming\RabbitMQ\log
notepad rabbit@<hostname>.log
```

---

## Configure for Development

### Enable Management Plugin (if not already enabled)
```powershell
cd "C:\Program Files\RabbitMQ Server\rabbitmq_server-3.12.10\sbin"
.\rabbitmq-plugins.bat enable rabbitmq_management
```

### List Enabled Plugins
```powershell
.\rabbitmq-plugins.bat list
```

### Create Additional User (Optional)
```powershell
# Add user
.\rabbitmqctl.bat add_user myuser mypassword

# Set permissions
.\rabbitmqctl.bat set_permissions -p / myuser ".*" ".*" ".*"

# Set as administrator
.\rabbitmqctl.bat set_user_tags myuser administrator
```

---

## Troubleshooting

### Problem: Service won't start

**Solution 1: Check Erlang installation**
```powershell
erl -version
```
If command not found, reinstall Erlang and add to PATH.

**Solution 2: Check port conflicts**
```powershell
netstat -ano | findstr :5672
netstat -ano | findstr :15672
```
If ports are in use, stop conflicting services.

**Solution 3: Reset RabbitMQ**
```powershell
net stop RabbitMQ
cd "C:\Program Files\RabbitMQ Server\rabbitmq_server-3.12.10\sbin"
.\rabbitmq-service.bat remove
.\rabbitmq-service.bat install
net start RabbitMQ
```

### Problem: Cannot access Management Console

**Solution: Re-enable management plugin**
```powershell
cd "C:\Program Files\RabbitMQ Server\rabbitmq_server-3.12.10\sbin"
.\rabbitmq-plugins.bat disable rabbitmq_management
.\rabbitmq-plugins.bat enable rabbitmq_management
net stop RabbitMQ
net start RabbitMQ
```

### Problem: Guest user cannot login remotely

**Note:** By default, guest user can only login from localhost. This is fine for development.

**To allow remote access (NOT recommended for production):**
1. Create file: `C:\Users\<YourUser>\AppData\Roaming\RabbitMQ\rabbitmq.conf`
2. Add line: `loopback_users.guest = false`
3. Restart RabbitMQ

---

## Uninstall RabbitMQ

### If installed with Chocolatey:
```powershell
choco uninstall rabbitmq -y
```

### If installed manually:
```powershell
# Stop and remove service
net stop RabbitMQ
cd "C:\Program Files\RabbitMQ Server\rabbitmq_server-3.12.10\sbin"
.\rabbitmq-service.bat remove

# Uninstall from Control Panel
# Or use the uninstaller in the installation directory
```

---

## Firewall Configuration (if needed)

```powershell
# Allow RabbitMQ AMQP port
New-NetFirewallRule -DisplayName "RabbitMQ AMQP" -Direction Inbound -LocalPort 5672 -Protocol TCP -Action Allow

# Allow RabbitMQ Management port
New-NetFirewallRule -DisplayName "RabbitMQ Management" -Direction Inbound -LocalPort 15672 -Protocol TCP -Action Allow
```

---

## For Our Project

Default configuration is sufficient:
- Host: `localhost`
- AMQP Port: `5672`
- Management Port: `15672`
- Username: `guest`
- Password: `guest`

No additional configuration needed for development!

---

## Health Check Before Testing

Run these commands to ensure RabbitMQ is ready:

```powershell
# 1. Check service
Get-Service -Name RabbitMQ

# 2. Check ports
Test-NetConnection -ComputerName localhost -Port 5672
Test-NetConnection -ComputerName localhost -Port 15672

# 3. Access management console
Start-Process "http://localhost:15672"
```

If all checks pass, RabbitMQ is ready for the real-time pipeline! 🎉

---

## Quick Reference

| Item | Value |
|------|-------|
| Service Name | RabbitMQ |
| AMQP Port | 5672 |
| Management UI | http://localhost:15672 |
| Default User | guest |
| Default Pass | guest |
| Install Location | C:\Program Files\RabbitMQ Server |
| Log Location | C:\Users\<User>\AppData\Roaming\RabbitMQ\log |

---

## Next Steps

After RabbitMQ is installed and running:
1. ✅ Install Python dependencies: `pip install -r requirements.txt`
2. ✅ Start Python service: `python server.py`
3. ✅ Start Java backend: `mvn spring-boot:run`
4. ✅ Start React frontend: `npm run dev`
5. ✅ Test the real-time pipeline!

See `REALTIME_TESTING.md` for complete testing guide.
