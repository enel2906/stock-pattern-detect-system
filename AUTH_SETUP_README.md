# Stock Pattern Detection System - Authentication Setup

## 🎯 Tổng Quan

Hệ thống authentication hoàn chỉnh với:
- ✅ Đăng ký/Đăng nhập bằng username/email & password
- ✅ OAuth 2.0 Google Login
- ✅ JWT Token-based authentication
- ✅ MongoDB database
- ✅ Protected routes
- ✅ Auto token refresh

---

## 🚀 Backend Setup (alert-service)

### 1. Cài đặt MongoDB

Đảm bảo MongoDB đang chạy tại `mongodb://localhost:27017/candlestick_db`

```bash
# Kiểm tra MongoDB
mongo --version

# Start MongoDB (Windows)
net start MongoDB

# Start MongoDB (Linux/Mac)
sudo systemctl start mongod
```

### 2. Cấu hình Google OAuth

1. Truy cập [Google Cloud Console](https://console.cloud.google.com)
2. Tạo project mới hoặc chọn project có sẵn
3. Navigate: **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Configure OAuth consent screen (nếu chưa có):
   - User Type: **External** (cho testing)
   - App name: `Stock Pattern Detection`
   - Support email: Your email
   - Add test users: Your Gmail accounts
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: `Stock Pattern Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:60`
   - Authorized redirect URIs:
     - `http://localhost:60/login/oauth2/code/google`
     - `http://localhost:60/api/auth/google/callback`
7. Click **CREATE**
8. Copy **Client ID** và **Client Secret**

⚠️ **LƯU Ý QUAN TRỌNG**:
- Đảm bảo cả 2 redirect URIs đều được thêm
- URI phải khớp chính xác (không có trailing slash)
- Nếu thay đổi port, phải cập nhật lại redirect URIs

### 3. Cập nhật application.properties

Mở file `alert-service/src/main/resources/application.properties` và cập nhật:

```properties
# JWT Configuration (THAY ĐỔI SECRET KEY!)
jwt.secret=your-secret-key-must-be-at-least-256-bits-long-change-this-in-production
jwt.expiration=900000
jwt.refresh-expiration=604800000

# Google OAuth2 (THAY ĐỔI CLIENT ID & SECRET)
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID_HERE
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET_HERE
spring.security.oauth2.client.registration.google.scope=profile,email
spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/login/oauth2/code/google
```

⚠️ **QUAN TRỌNG**: Đổi `jwt.secret` thành chuỗi ngẫu nhiên dài ít nhất 256 bits!

### 4. Build & Run Backend

```bash
cd alert-service
mvn clean install
mvn spring-boot:run
```

Backend sẽ chạy tại: `http://localhost:60`

---

## 🎨 Frontend Setup (react-client)

### 1. Install Dependencies

```bash
cd client-service/react-client
npm install
```

### 2. Run Frontend

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

---

## 📋 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/refresh?refreshToken=<token>` | Refresh access token |
| GET | `/api/user/me` | Lấy thông tin user (cần authentication) |
| GET | `/oauth2/authorization/google` | Redirect đến Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |

### Stock Data (Cần Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stock?symbol=<symbol>` | Lấy dữ liệu stock |
| GET | `/alert/candle-stick/<symbol>?candlePattern=<pattern>` | Phát hiện pattern |

---

## 🧪 Test Authentication

### Test với Postman

#### 1. Register User

```http
POST http://localhost:60/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test@123",
  "fullName": "Test User",
  "age": 25
}
```

Response:
```json
{
  "code": 0,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "user": {
      "id": "...",
      "username": "testuser",
      "email": "test@example.com",
      "fullName": "Test User",
      "age": 25,
      "authProvider": "LOCAL"
    }
  }
}
```

#### 2. Login

```http
POST http://localhost:60/api/auth/login
Content-Type: application/json

{
  "usernameOrEmail": "testuser",
  "password": "Test@123"
}
```

#### 3. Get Current User (với token)

```http
GET http://localhost:60/api/user/me
Authorization: Bearer <accessToken>
```

---

## 🔐 Password Requirements

- Tối thiểu 8 ký tự
- Phải chứa:
  - Ít nhất 1 chữ hoa (A-Z)
  - Ít nhất 1 chữ thường (a-z)
  - Ít nhất 1 số (0-9)
  - Ít nhất 1 ký tự đặc biệt (@#$%^&+=)

Ví dụ hợp lệ: `Test@123`, `SecureP@ss1`, `MyP@ssw0rd`

---

## 🎯 User Flow

### Registration Flow
1. User điền form đăng ký
2. Frontend validate form
3. POST `/api/auth/register`
4. Backend:
   - Kiểm tra username/email đã tồn tại
   - Hash password với BCrypt
   - Lưu user vào MongoDB
   - Generate JWT tokens
5. Frontend:
   - Lưu tokens vào localStorage
   - Redirect về trang chủ

### Login Flow
1. User điền username/email & password
2. POST `/api/auth/login`
3. Backend:
   - Authenticate user
   - Generate JWT tokens
4. Frontend:
   - Lưu tokens vào localStorage
   - Redirect về trang chủ

### Google OAuth Flow
1. User click "Đăng nhập với Google"
2. Frontend gọi `authApi.googleLogin()` → Redirect đến `http://localhost:60/oauth2/authorization/google`
3. Backend Spring Security OAuth2 redirect user đến Google OAuth consent screen
4. User đăng nhập Google và authorize application
5. Google redirect về `http://localhost:60/login/oauth2/code/google` với authorization code
6. Backend Spring Security:
   - Exchange code với Google để lấy access token
   - Gọi Google API để lấy user info (email, name, sub/googleId)
   - Trigger `CustomOAuth2UserService.loadUser()`
7. `CustomOAuth2UserService.processOAuth2User()`:
   - Tìm user trong MongoDB theo email
   - Nếu tồn tại: Update googleId (nếu chưa có)
   - Nếu chưa tồn tại: Tạo user mới với:
     - `username` = email prefix (trước @)
     - `email` = Google email
     - `fullName` = Google name
     - `googleId` = Google sub
     - `authProvider` = GOOGLE
     - `password` = null (không cần vì OAuth)
8. Spring Security redirect về `http://localhost:60/api/auth/google/callback`
9. `OAuth2Controller.handleGoogleCallback()`:
   - Nhận OAuth2User từ Spring Security
   - Gọi `CustomOAuth2UserService.handleOAuth2Success()`
   - Generate JWT tokens (accessToken + refreshToken)
   - Redirect về frontend: `http://localhost:5173/auth/callback?accessToken=xxx&refreshToken=yyy`
10. Frontend `AuthCallbackPage`:
    - Extract tokens từ URL query params
    - Lưu vào localStorage:
      - `localStorage.setItem('accessToken', ...)`
      - `localStorage.setItem('refreshToken', ...)`
    - Reload trang để AuthContext load user
    - Redirect về trang chủ `/`
11. Frontend `AuthContext`:
    - Detect tokens trong localStorage
    - Gọi `/api/user/me` với Bearer token
    - Load user info và set state
12. User đã đăng nhập thành công!

### Protected Routes
1. User access protected route
2. Frontend check `accessToken` trong localStorage
3. Nếu không có token → Redirect `/login`
4. Nếu có token → Attach vào header `Authorization: Bearer <token>`
5. Backend verify JWT token
6. Nếu token expired → Frontend gọi `/api/auth/refresh`
7. Nếu refresh thành công → Retry request với token mới

---

## 🗂️ Database Schema (MongoDB)

### Collection: `users`

```javascript
{
  _id: ObjectId,
  username: String (unique, indexed),
  email: String (unique, indexed),
  password: String (hashed, nullable for Google OAuth),
  fullName: String,
  age: Number,
  authProvider: "LOCAL" | "GOOGLE",
  googleId: String (nullable),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🛠️ Troubleshooting

### Backend không start

```bash
# Kiểm tra MongoDB
mongo

# Kiểm tra port 60 có bị chiếm
netstat -ano | findstr :60

# Clean build
cd alert-service
mvn clean install -U
```

**Circular dependency error**:
- Đã được fix bằng cách inject `JwtAuthenticationFilter` vào method parameter thay vì constructor
- Nếu vẫn gặp lỗi, check Spring Boot version compatibility

### Google OAuth không hoạt động

**Lỗi thường gặp**:

1. **Error 400: redirect_uri_mismatch**
   - Kiểm tra redirect URI trong Google Console khớp chính xác
   - URI: `http://localhost:60/login/oauth2/code/google`
   - Không có trailing slash, không có typo

2. **Error 401: invalid_client**
   - Client ID hoặc Client Secret sai
   - Kiểm tra `application.properties`
   - Đảm bảo không có khoảng trắng thừa

3. **Access blocked: This app's request is invalid**
   - Chưa configure OAuth consent screen
   - Chưa add test users
   - App chưa được verify (dùng External + test users)

4. **Cannot resolve user info**
   - Google+ API chưa được enable (không bắt buộc với OAuth2)
   - Network issue hoặc Google API down

**Debug steps**:
```bash
# Check backend logs
# Tìm dòng log:
# - "OAuth2 authorization request"
# - "OAuth2 user info"
# - "Creating/Updating user from Google"

# Test redirect manually
curl -v http://localhost:60/oauth2/authorization/google
# Should redirect to accounts.google.com
```

### Frontend không kết nối được backend

1. Kiểm tra CORS settings trong `SecurityConfig.java`
2. Kiểm tra backend đang chạy tại port 60
3. Kiểm tra frontend URL trong `cors.allowed-origins`
4. Check browser console for CORS errors

### Token expired

- Access token có thời hạn 15 phút
- Refresh token có thời hạn 7 ngày
- Frontend tự động refresh khi access token hết hạn

### MongoDB connection issues

```bash
# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
sudo systemctl status mongod

# Check connection
mongo --eval "db.version()"
```

## 📊 Google OAuth Flow Diagram

```
┌─────────┐                    ┌──────────┐                  ┌─────────┐
│         │                    │          │                  │         │
│ Browser │                    │ Backend  │                  │  Google │
│         │                    │  (60)    │                  │  OAuth  │
└────┬────┘                    └────┬─────┘                  └────┬────┘
     │                              │                             │
     │ 1. Click "Login with Google"│                             │
     ├─────────────────────────────>│                             │
     │                              │                             │
     │ 2. Redirect to OAuth2        │                             │
     │    /oauth2/authorization/google                            │
     ├─────────────────────────────>│                             │
     │                              │                             │
     │                              │ 3. Redirect to Google       │
     │                              │    with client_id           │
     │<─────────────────────────────┤                             │
     │                              │                             │
     │ 4. Show consent screen       │                             │
     ├──────────────────────────────────────────────────────────>│
     │                              │                             │
     │ 5. User authorizes           │                             │
     ├──────────────────────────────────────────────────────────>│
     │                              │                             │
     │ 6. Redirect with auth code   │                             │
     │    /login/oauth2/code/google?code=xxx                      │
     │<──────────────────────────────────────────────────────────┤
     │                              │                             │
     │ 7. Forward code to backend   │                             │
     ├─────────────────────────────>│                             │
     │                              │                             │
     │                              │ 8. Exchange code for token  │
     │                              ├────────────────────────────>│
     │                              │                             │
     │                              │ 9. Return access token      │
     │                              │    + user info (email,name) │
     │                              │<────────────────────────────┤
     │                              │                             │
     │                              │ 10. Create/Update user      │
     │                              │     in MongoDB              │
     │                              │                             │
     │                              │ 11. Generate JWT tokens     │
     │                              │     (accessToken + refresh) │
     │                              │                             │
     │ 12. Redirect to callback     │                             │
     │     /auth/callback?          │                             │
     │     accessToken=xxx&         │                             │
     │     refreshToken=yyy         │                             │
     │<─────────────────────────────┤                             │
     │                              │                             │
     │ 13. Extract & save tokens    │                             │
     │     to localStorage          │                             │
     │                              │                             │
     │ 14. Redirect to home (/)     │                             │
     │                              │                             │
     │ 15. Access protected API     │                             │
     │     with Bearer token        │                             │
     ├─────────────────────────────>│                             │
     │                              │                             │
     │ 16. Return stock data        │                             │
     │<─────────────────────────────┤                             │
     │                              │                             │
```

### Key Components trong Flow:

1. **Frontend (`authApi.googleLogin()`)**:
   ```javascript
   window.location.href = 'http://localhost:60/oauth2/authorization/google';
   ```

2. **Spring Security OAuth2 Auto Config**:
   - Tự động handle authorization flow
   - Exchange code with Google
   - Call `CustomOAuth2UserService`

3. **CustomOAuth2UserService**:
   ```java
   - processOAuth2User() → Create/Update user
   - handleOAuth2Success() → Generate JWT
   ```

4. **OAuth2Controller**:
   ```java
   @GetMapping("/callback")
   // Redirect with tokens in URL
   ```

5. **Frontend AuthCallbackPage**:
   ```javascript
   - Extract tokens from URL params
   - Save to localStorage
   - Reload to apply auth state
   ```

---

## 🔧 Code Flow Chi Tiết

### Backend (`alert-service`)

```
src/main/java/com/example/alert/
├── config/
│   └── SecurityConfig.java          # Spring Security configuration
├── controller/
│   ├── AuthController.java          # Register, login, refresh endpoints
│   ├── OAuth2Controller.java        # Google OAuth callback
│   └── UserController.java          # User info endpoints
├── domain/
│   └── User.java                    # User entity (MongoDB document)
├── dto/
│   ├── AuthResponse.java            # JWT response DTO
│   ├── LoginRequest.java            # Login request DTO
│   ├── RegisterRequest.java         # Register request DTO
│   └── UserDto.java                 # User data DTO
├── repository/
│   └── UserRepository.java          # MongoDB repository
├── security/
│   ├── JwtAuthenticationFilter.java # JWT filter
│   ├── JwtService.java              # JWT generation/validation
│   └── UserPrincipal.java           # Spring Security UserDetails
└── service/
    ├── AuthService.java             # Auth business logic
    └── CustomOAuth2UserService.java # Google OAuth user service
```

### Frontend (`react-client`)

```
src/
├── components/
│   ├── auth/
│   │   ├── AuthForms.css            # Auth forms styling
│   │   ├── LoginForm.jsx            # Login form component
│   │   ├── RegisterForm.jsx         # Register form component
│   │   └── ProtectedRoute.jsx       # Protected route wrapper
│   ├── Header.jsx                   # App header with user menu
│   └── StockChart.jsx               # Stock chart component
├── context/
│   └── AuthContext.jsx              # Global auth state management
├── pages/
│   ├── AuthPage.jsx                 # Login/Register page
│   └── AuthCallbackPage.jsx         # OAuth callback handler
├── services/
│   ├── api.js                       # Stock API calls
│   └── authApi.js                   # Auth API calls
├── App.jsx                          # Main app with routing
└── main.jsx                         # App entry point with providers
```

---

## 🎨 Screenshots

### Login Page
![Login](docs/login.png)

### Register Page
![Register](docs/register.png)

### Main Dashboard (Authenticated)
![Dashboard](docs/dashboard.png)

---

## 📝 Notes

- **Security**: Đổi `jwt.secret` trong production!
- **HTTPS**: Sử dụng HTTPS trong production
- **Tokens**: Không lưu sensitive data trong localStorage (consider httpOnly cookies)
- **Rate Limiting**: Implement rate limiting cho login endpoints
- **Password Reset**: Chức năng reset password có thể thêm sau
- **Email Verification**: Email verification có thể thêm sau

---

## 🤝 Contributing

Nếu có bug hoặc feature request, vui lòng tạo issue trên GitHub.

---

## 📄 License

MIT License
