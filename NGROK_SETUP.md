# 🌐 Ngrok Tunnel Setup Guide (Simplified - Single URL)

## 📋 Tổng Quan

**Ngrok** cho phép tạo public URL cho localhost, giải quyết vấn đề:
- ✅ Google OAuth không hỗ trợ private IP (192.168.x.x)
- ✅ Truy cập ứng dụng từ internet
- ✅ Demo cho người khác mà không cần deploy

### 🆕 Single URL + Vite Proxy (Recommended)

Thay vì chạy **3 ngrok tunnels** (Frontend, Backend, Data Service), giờ chỉ cần **1 tunnel**:

```
[Internet] → [Ngrok] → [Vite Dev Server:5173] → Proxy → [Java:60 / Python:8000]
```

**Ưu điểm:**
- ✅ Chỉ cần 1 ngrok URL
- ✅ Chỉ cần 1 Google OAuth redirect URI
- ✅ Không có vấn đề CORS (cùng origin)
- ✅ Đơn giản hơn nhiều!

## 🎯 Khi nào cần dùng Ngrok?

| Trường hợp | Giải pháp |
|------------|-----------|
| Truy cập từ cùng máy (`localhost`) | ✅ Không cần ngrok |
| Truy cập từ LAN (192.168.x.x), **không** cần Google OAuth | ✅ Không cần ngrok |
| Truy cập từ LAN + cần Google OAuth | ⚠️ **Cần ngrok** |
| Demo cho người ngoài mạng LAN | ⚠️ **Cần ngrok** |

---

## 🚀 Cài đặt Ngrok

### Bước 1: Download ngrok

1. Truy cập: https://ngrok.com/download
2. Chọn **Windows** → Download
3. Giải nén file `ngrok.exe`
4. Di chuyển vào thư mục trong PATH (ví dụ: `C:\Windows\System32`)

Hoặc dùng **Chocolatey**:
```powershell
choco install ngrok
```

Hoặc dùng **Winget**:
```powershell
winget install ngrok.ngrok
```

### Bước 2: Tạo tài khoản (miễn phí)

1. Truy cập: https://dashboard.ngrok.com/signup
2. Đăng ký bằng email hoặc GitHub/Google
3. Sau khi đăng nhập, copy **Your Authtoken** từ: https://dashboard.ngrok.com/get-started/your-authtoken

### Bước 3: Cấu hình authtoken

```powershell
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

---

## 📡 Chạy Ngrok Tunnel

### Bước 1: Chạy các services local

```powershell
# Chạy hệ thống local trước
.\deploy-local.bat

# Hoặc chạy riêng từng service:
# Terminal 1 - Java backend
cd alert-service
mvn spring-boot:run

# Terminal 2 - Python data service
cd data-service
uvicorn app.main:app --reload --port 8000

# Terminal 3 - Vite dev server
cd client-service/react-client
npm run dev
```

### Bước 2: Chạy ngrok tunnel

```powershell
# Dùng script có sẵn
.\start-ngrok.bat

# Hoặc chạy trực tiếp
ngrok http 5173
```

### Kết quả

Ngrok sẽ hiển thị:

```
Session Status                online
Account                       your-email@gmail.com
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:5173
```

**Ghi lại URL này** (ví dụ: `https://abc123.ngrok-free.app`)

---

## 🔧 Cách hoạt động

Khi bạn truy cập `https://abc123.ngrok-free.app`:

1. **Static files** (HTML, JS, CSS) → Vite serve trực tiếp
2. **API requests** (`/api/*`, `/stock/*`, `/alert/*`) → Vite proxy đến `localhost:60` (Java)
3. **OAuth requests** (`/oauth2/*`, `/login/oauth2/*`) → Vite proxy đến `localhost:60` (Java)
4. **WebSocket** (`/ws/*`) → Vite proxy đến `localhost:60` (Java)
5. **Data API** (`/data-api/*`) → Vite proxy đến `localhost:8000` (Python)

File cấu hình: `client-service/react-client/vite.config.js`

---

## ⚙️ Cấu hình Google OAuth

### Bước 1: Mở Google Cloud Console

1. Truy cập: https://console.cloud.google.com
2. Chọn project của bạn
3. Vào **APIs & Services** → **Credentials**
4. Click vào OAuth 2.0 Client ID đã tạo

### Bước 2: Thêm Authorized redirect URIs

Thêm URL mới (thay `abc123` bằng subdomain thực của bạn):

```
https://abc123.ngrok-free.app/login/oauth2/code/google
```

⚠️ **Lưu ý**: 
- URL phải **chính xác** (không có trailing slash)
- Dùng **https** (không phải http)
- Mỗi lần restart ngrok, URL sẽ thay đổi (trừ khi dùng paid plan)

### Bước 3: Thêm Authorized JavaScript origins

```
https://abc123.ngrok-free.app
```

### Bước 4: Save

Click **SAVE** và đợi vài phút để changes propagate.

---

## 🖥️ Truy cập ứng dụng

### Bước 1: Mở ngrok Web Interface (optional)

Truy cập: http://localhost:4040

Tại đây bạn có thể:
- Xem tunnel đang chạy
- Copy URL
- Xem request/response logs

### Bước 2: Truy cập qua ngrok URL

Mở browser và truy cập ngrok URL:
```
https://abc123.ngrok-free.app
```

⚠️ **Lần đầu** sẽ thấy trang cảnh báo ngrok → Click **"Visit Site"**

---

## 🔐 Đăng nhập Google qua Ngrok

Sau khi cấu hình xong:

1. Truy cập app qua ngrok URL
2. Click **"Đăng nhập với Google"**
3. Chọn tài khoản Google
4. Authorize app
5. Google redirect về → Vite proxy → Java backend
6. Đăng nhập thành công! 🎉

---

## ❓ Troubleshooting

### Lỗi "redirect_uri_mismatch"

**Nguyên nhân**: URL trong Google Console không khớp

**Giải pháp**:
1. Copy chính xác URL từ ngrok
2. Thêm `/login/oauth2/code/google` vào cuối
3. Đảm bảo dùng `https://`
4. Không có trailing slash
5. Đợi 2-3 phút sau khi save

### Lỗi "ERR_NGROK_6024" - Tunnel not found

**Nguyên nhân**: Ngrok tunnel đã tắt hoặc URL sai

**Giải pháp**:
1. Kiểm tra terminal ngrok còn chạy không
2. Restart ngrok và copy URL mới
3. Cập nhật Google Console với URL mới

### API calls fail - 502 Bad Gateway

**Nguyên nhân**: Vite proxy không thể kết nối đến backend

**Giải pháp**:
1. Kiểm tra Java backend đang chạy trên port 60
2. Kiểm tra Python service đang chạy trên port 8000
3. Kiểm tra Vite dev server đang chạy trên port 5173

### WebSocket không kết nối được

**Nguyên nhân**: WebSocket proxy chưa hoạt động

**Giải pháp**:
1. Kiểm tra Vite config có `ws: true` cho `/ws` proxy
2. Refresh trang và thử lại

### Ngrok free plan giới hạn

**Giới hạn**:
- URL random mỗi lần restart
- Rate limit requests
- Sessions expire sau 2 hours

**Giải pháp**:
- Upgrade lên paid plan để có static domain
- Hoặc restart và cập nhật Google Console mỗi session

---

## 📊 Flow Diagram (Single URL + Proxy)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your Phone    │     │  Ngrok Cloud    │     │ Your Computer   │
│   (Browser)     │     │                 │     │   (Services)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. Access            │                       │
         │  abc123.ngrok-free.app│                       │
         ├──────────────────────>│                       │
         │                       │                       │
         │                       │  2. Forward to        │
         │                       │  Vite:5173            │
         │                       ├──────────────────────>│
         │                       │                       │
         │                       │  3. React App         │
         │                       │<──────────────────────┤
         │                       │                       │
         │  4. Frontend HTML     │                       │
         │<──────────────────────┤                       │
         │                       │                       │
         │  5. API call /api/*   │                       │
         │  (same origin!)       │                       │
         ├──────────────────────>│                       │
         │                       │                       │
         │                       │  6. Forward to        │
         │                       │  Vite:5173            │
         │                       ├──────────────────────>│
         │                       │       │               │
         │                       │       │ Vite Proxy    │
         │                       │       ▼               │
         │                       │  Java:60              │
         │                       │                       │
         │                       │  7. API Response      │
         │                       │<──────────────────────┤
         │                       │                       │
         │  8. JSON Data         │                       │
         │<──────────────────────┤                       │
         │                       │                       │

Proxy Routes (vite.config.js):
  /api/*      → localhost:60 (Java)
  /oauth2/*   → localhost:60 (Java)
  /login/*    → localhost:60 (Java)
  /ws/*       → localhost:60 (Java WebSocket)
  /stock/*    → localhost:60 (Java)
  /alert/*    → localhost:60 (Java)
  /data-api/* → localhost:8000 (Python)
```

---

## 🔧 Script Reference

### start-ngrok.ps1

```powershell
# Start ngrok tunnel
.\start-ngrok.ps1

# Show help
.\start-ngrok.ps1 -Help
```

Script tự động kiểm tra:
- ✅ Ngrok installed
- ✅ Vite dev server running (port 5173)
- ✅ Java backend running (port 60)
- ✅ Python service running (port 8000)

---

## 📝 Quick Checklist

- [ ] Ngrok installed (`ngrok --version`)
- [ ] Authtoken configured (`ngrok config check`)
- [ ] **Vite dev server** running on port 5173 (`npm run dev`)
- [ ] Java backend running on port 60
- [ ] Python service running on port 8000
- [ ] Ngrok tunnel running (`.\start-ngrok.bat`)
- [ ] Google Console updated with ngrok redirect URI
- [ ] Waited 2-3 minutes for Google changes to propagate
- [ ] Access app via ngrok URL
- [ ] Clicked "Visit Site" on ngrok warning page

---

## 🎉 Done!

Bạn đã có thể:
- Truy cập ứng dụng từ bất kỳ đâu qua internet
- Đăng nhập Google OAuth hoạt động bình thường
- Demo cho người khác mà không cần deploy lên cloud
- Chỉ cần quản lý **1 URL** thay vì 3!
