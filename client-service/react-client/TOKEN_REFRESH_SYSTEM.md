# Token Refresh System Documentation

## Overview
Hệ thống quản lý JWT token với auto-refresh được tích hợp vào ứng dụng React để tự động làm mới access token trước khi hết hạn.

## Cấu hình Token

### Backend (application.properties)
```properties
jwt.expiration=900000          # Access token: 15 phút (900,000 ms)
jwt.refresh-expiration=604800000   # Refresh token: 7 ngày (604,800,000 ms)
```

### Endpoints
- `POST /api/auth/login` - Đăng nhập và nhận access token + refresh token
- `POST /api/auth/register` - Đăng ký và nhận access token + refresh token
- `POST /api/auth/refresh?refreshToken={token}` - Làm mới access token
- `GET /api/user/me` - Lấy thông tin user hiện tại (yêu cầu auth)

## Kiến trúc

### 1. Token Utilities (`utils/tokenUtils.js`)
Các hàm tiện ích để xử lý JWT token:
- `decodeToken(token)` - Giải mã JWT token để lấy payload
- `isTokenExpired(token)` - Kiểm tra token đã hết hạn chưa (với buffer 30 giây)
- `getTokenExpirationTime(token)` - Lấy thời gian còn lại đến khi token hết hạn
- `formatTimeRemaining(ms)` - Format thời gian còn lại thành dạng dễ đọc

### 2. Auth Context (`context/AuthContext.jsx`)
Quản lý authentication state và tự động refresh token:

#### Auto-refresh Strategy
- **Scheduled Refresh**: Token tự động được refresh trước khi hết hạn
  - Nếu token còn > 2 phút: refresh 1 phút trước khi hết hạn
  - Nếu token còn < 2 phút: refresh ở giữa thời gian còn lại
  
- **On Load Check**: Khi app khởi động, kiểm tra token có hết hạn không
  - Nếu hết hạn: tự động refresh ngay
  - Nếu còn hạn: schedule refresh cho lần tiếp theo

- **On 401 Response**: Khi API trả về 401 Unauthorized
  - Tự động refresh token và retry request
  - Xử lý trong API Interceptor

#### Key Functions
- `scheduleTokenRefresh(token)` - Lên lịch refresh token tự động
- `ensureValidToken()` - Đảm bảo token còn hiệu lực trước khi request
- `refresh()` - Refresh access token bằng refresh token

### 3. API Interceptor (`services/apiInterceptor.js`)
Tự động xử lý 401 errors và retry requests:

#### Features
- **Automatic Retry**: Tự động retry request sau khi refresh token thành công
- **Request Queuing**: Queue các request khi đang refresh token
- **Token Injection**: Tự động thêm Authorization header vào request

#### Usage
```javascript
import apiInterceptor from './services/apiInterceptor';

// Fetch with auto-retry on 401
const response = await apiInterceptor.fetch(url, options);

// Fetch JSON response
const data = await apiInterceptor.fetchJSON(url, options);
```

### 4. Token Status Component (`components/TokenStatus.jsx`)
Debug component hiển thị trạng thái token real-time:
- Thời gian còn lại đến khi token hết hạn
- Username từ token
- Cảnh báo khi token sắp hết hạn hoặc đã hết hạn

**Note**: Nên remove component này trong production

## Flow Diagram

### Login Flow
```
User Login
    ↓
Backend generates tokens
    ↓
Store tokens in localStorage
    ↓
Schedule auto-refresh
    ↓
User authenticated
```

### Auto-Refresh Flow
```
Token approaching expiration
    ↓
Scheduled refresh triggered
    ↓
Call refresh endpoint
    ↓
Receive new access token
    ↓
Update localStorage
    ↓
Schedule next refresh
```

### 401 Error Flow
```
API request → 401 Unauthorized
    ↓
Interceptor catches error
    ↓
Check if already refreshing
    ↓
Yes: Queue request
No: Start refresh
    ↓
Refresh token
    ↓
Retry original request
    ↓
Process queued requests
```

## Security Considerations

### Best Practices
1. **Token Storage**: Tokens lưu trong localStorage (cân nhắc httpOnly cookies cho production)
2. **Refresh Buffer**: Token refresh 30 giây trước khi hết hạn
3. **Queue Management**: Tránh multiple refresh requests đồng thời
4. **Logout on Failure**: Tự động logout khi refresh token thất bại
5. **HTTPS Only**: Chỉ sử dụng HTTPS trong production

### Improvements for Production
1. Sử dụng httpOnly cookies thay vì localStorage cho refresh token
2. Implement token rotation (refresh token mới mỗi lần refresh)
3. Thêm CSRF protection
4. Rate limiting cho refresh endpoint
5. Blacklist/Whitelist tokens
6. Add fingerprinting để detect token theft

## Testing

### Test Cases
1. **Token Expiration**:
   - Đăng nhập và đợi 15 phút
   - Verify token tự động refresh
   
2. **401 Retry**:
   - Mock 401 response
   - Verify automatic retry with new token

3. **Multiple Requests**:
   - Gửi nhiều requests khi token hết hạn
   - Verify chỉ 1 refresh request được gửi
   - Verify tất cả requests được retry sau refresh

4. **Logout**:
   - Verify tokens bị xóa khỏi localStorage
   - Verify scheduled refresh bị cancel

## Monitoring

### Console Logs
- `"Scheduling token refresh in X seconds"` - Token refresh đã được schedule
- `"Access token expired, refreshing..."` - Token hết hạn, bắt đầu refresh
- `"Received 401, attempting token refresh..."` - API trả về 401, bắt đầu retry flow
- `"Token refresh already in progress, skipping..."` - Tránh duplicate refresh

### Token Status Component
Hiển thị real-time:
- Thời gian còn lại
- Token status (active/expiring/expired)
- Username

## Troubleshooting

### Common Issues

1. **Token không tự động refresh**
   - Check console logs cho "Scheduling token refresh"
   - Verify token có expiration time hợp lệ
   - Check refreshToken có trong localStorage không

2. **401 errors liên tục**
   - Verify refresh token còn hạn
   - Check backend refresh endpoint
   - Verify token format và signature

3. **Multiple refresh requests**
   - Check `isRefreshingRef` flag
   - Verify queue mechanism hoạt động

4. **Logout không chủ động**
   - Check refresh token expiration
   - Verify backend validation

## Future Enhancements

1. **Silent Refresh with iframe**
   - Refresh token silently without interrupting user

2. **Web Workers**
   - Move token refresh logic to Web Worker

3. **Token Renewal Prompt**
   - Prompt user before token expires

4. **Multi-tab Sync**
   - Sync token refresh across multiple tabs using BroadcastChannel

5. **Offline Support**
   - Handle refresh when offline
   - Queue requests until online

## References

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Token Refresh](https://tools.ietf.org/html/rfc6749#section-6)
- [OWASP Token Storage](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage)
