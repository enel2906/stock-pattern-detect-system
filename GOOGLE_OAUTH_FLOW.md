# 🔐 Hướng Dẫn Google OAuth2 Login Flow

## 📊 Sơ Đồ Luồng Hoàn Chỉnh

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │ 1. Click "Đăng nhập với Google"
       │    authApi.googleLogin()
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  window.location.href =                                  │
│  "http://localhost:60/oauth2/authorization/google"      │
└──────┬──────────────────────────────────────────────────┘
       │
       │ 2. Spring Security OAuth2 xử lý
       ▼
┌──────────────────────┐
│  Spring Security     │
│  OAuth2LoginFilter   │
└──────┬───────────────┘
       │ 3. Redirect đến Google
       ▼
┌──────────────────────┐
│   Google OAuth2      │
│   Login Page         │
└──────┬───────────────┘
       │ 4. User đăng nhập & đồng ý quyền
       │
       ▼
┌────────────────────────────────────────────────────────┐
│  Google callback:                                       │
│  http://localhost:60/login/oauth2/code/google?code=... │
└──────┬─────────────────────────────────────────────────┘
       │
       │ 5. Spring Security exchange code → access token
       ▼
┌────────────────────────────────┐
│  CustomOAuth2UserService       │
│  - loadUser(OAuth2UserRequest) │
│  - processOAuth2User()         │
│    • Lấy email, name, googleId │
│    • Tìm hoặc tạo User trong DB│
└──────┬─────────────────────────┘
       │
       │ 6. Authentication thành công
       ▼
┌────────────────────────────────┐
│  OAuth2SuccessHandler          │
│  - handleOAuth2Success()       │
│    • Generate JWT tokens       │
│    • Build AuthResponse        │
└──────┬─────────────────────────┘
       │
       │ 7. Redirect với tokens
       ▼
┌──────────────────────────────────────────────────────┐
│  http://localhost:5173/auth/callback                  │
│    ?accessToken=xxx&refreshToken=yyy                 │
└──────┬───────────────────────────────────────────────┘
       │
       │ 8. AuthCallbackPage xử lý
       ▼
┌────────────────────────────────┐
│  React AuthCallbackPage        │
│  - Lưu tokens vào localStorage │
│  - Fetch user data để verify   │
│  - Reload page để apply state  │
└──────┬─────────────────────────┘
       │
       │ 9. AuthContext load user
       ▼
┌────────────────────────────────┐
│  AuthProvider                  │
│  - Load tokens from storage    │
│  - Call getCurrentUser()       │
│  - Set user state              │
│  - Schedule token refresh      │
└──────┬─────────────────────────┘
       │
       │ 10. Navigate to home
       ▼
┌─────────────┐
│  Dashboard  │
│  (/)        │
└─────────────┘
```

---

## 🔧 CẤU HÌNH BACKEND

### 1. **application.properties**

```properties
# Google OAuth2 Configuration
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
spring.security.oauth2.client.registration.google.scope=profile,email
spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/login/oauth2/code/google

# CORS - Allow frontend origin
cors.allowed-origins=http://localhost:5173,http://localhost:3000
```

**Lưu ý:** 
- Redirect URI PHẢI là `/login/oauth2/code/google` (default Spring OAuth2)
- Cập nhật `client-id` và `client-secret` từ Google Cloud Console

### 2. **SecurityConfig.java**

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthFilter) throws Exception {
        http
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)  // Custom service xử lý user
                )
                .successHandler(oAuth2SuccessHandler())  // Xử lý thành công
                .failureHandler((request, response, exception) -> {
                    // Xử lý lỗi
                    String frontendUrl = allowedOrigins.split(",")[0];
                    response.sendRedirect(frontendUrl + "/login?error=" + exception.getMessage());
                })
            );
        
        return http.build();
    }
    
    @Bean
    public AuthenticationSuccessHandler oAuth2SuccessHandler() {
        return (request, response, authentication) -> {
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
            AuthResponse authResponse = customOAuth2UserService.handleOAuth2Success(oauth2User);
            
            String frontendUrl = allowedOrigins.split(",")[0];
            String redirectUrl = String.format(
                "%s/auth/callback?accessToken=%s&refreshToken=%s",
                frontendUrl,
                authResponse.getAccessToken(),
                authResponse.getRefreshToken()
            );
            
            response.sendRedirect(redirectUrl);
        };
    }
}
```

### 3. **CustomOAuth2UserService.java**

```java
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        return processOAuth2User(oauth2User);
    }
    
    private OAuth2User processOAuth2User(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String googleId = oauth2User.getAttribute("sub");
        
        // Tìm hoặc tạo user
        User user = userRepository.findByEmail(email)
            .orElseGet(() -> {
                User newUser = User.builder()
                    .username(email.split("@")[0])
                    .email(email)
                    .fullName(name)
                    .googleId(googleId)
                    .authProvider(User.AuthProvider.GOOGLE)
                    .build();
                return userRepository.save(newUser);
            });
        
        return oauth2User;
    }
    
    public AuthResponse handleOAuth2Success(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        String accessToken = jwtService.generateToken(user.getUsername());
        String refreshToken = jwtService.generateRefreshToken(user.getUsername());
        
        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .user(UserDto.fromUser(user))
            .build();
    }
}
```

---

## 🎨 CẤU HÌNH FRONTEND

### 1. **authApi.js**

```javascript
export const authApi = {
  // Google OAuth login - redirect to backend
  googleLogin: () => {
    window.location.href = `http://localhost:60/oauth2/authorization/google`;
  },
  
  getCurrentUser: async (token) => {
    const res = await apiInterceptor.fetch(`${API_BASE_URL}/user/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const response = await res.json();
    return response.data;
  },
};
```

### 2. **AuthCallbackPage.jsx**

```jsx
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login');
        return;
      }

      if (accessToken && refreshToken) {
        // Lưu tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Verify tokens bằng cách fetch user
        const userData = await authApi.getCurrentUser(accessToken);
        
        if (userData) {
          // Reload để AuthContext load lại
          window.location.href = '/';
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return <div>Đang xử lý đăng nhập...</div>;
};
```

### 3. **App.jsx - Routing**

```jsx
<Routes>
  <Route path="/auth/callback" element={<AuthCallbackPage />} />
  <Route path="/login" element={<AuthPage />} />
  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
</Routes>
```

---

## 🔑 GOOGLE CLOUD CONSOLE SETUP

### Bước 1: Tạo OAuth2 Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo hoặc chọn project
3. Vào **APIs & Services** → **Credentials**
4. Click **CREATE CREDENTIALS** → **OAuth client ID**
5. Chọn **Application type**: Web application
6. Cấu hình:

```
Name: Stock Pattern Detection System
Authorized JavaScript origins:
  - http://localhost:5173
  - http://localhost:60

Authorized redirect URIs:
  - http://localhost:60/login/oauth2/code/google
```

7. Lưu **Client ID** và **Client Secret**

### Bước 2: Enable APIs

Vào **APIs & Services** → **Library**, enable:
- Google+ API
- People API (nếu cần thêm profile info)

### Bước 3: OAuth Consent Screen

1. Vào **OAuth consent screen**
2. Chọn **External** (cho testing)
3. Điền thông tin:
   - App name: Stock Pattern Detection
   - User support email: your-email@gmail.com
   - Developer contact: your-email@gmail.com
4. Scopes: Thêm `profile` và `email`
5. Test users: Thêm email test của bạn

---

## ✅ CHECKLIST TRIỂN KHAI

### Backend
- [x] Cấu hình `application.properties` với Google credentials
- [x] `CustomOAuth2UserService` xử lý user data từ Google
- [x] `SecurityConfig` với custom success handler
- [x] Generate JWT tokens sau khi OAuth thành công
- [x] Error handling cho OAuth failures
- [x] CORS configuration cho phép frontend origin

### Frontend
- [x] `authApi.googleLogin()` redirect đến backend
- [x] `AuthCallbackPage` xử lý tokens từ URL params
- [x] Lưu tokens vào localStorage
- [x] Verify tokens bằng getCurrentUser()
- [x] `AuthContext` load user từ tokens
- [x] Error handling & redirect về login page

### Google Cloud
- [ ] Tạo OAuth2 Client ID
- [ ] Cấu hình redirect URIs
- [ ] Enable Google+ API
- [ ] Setup OAuth consent screen
- [ ] Thêm test users
- [ ] Cập nhật Client ID/Secret vào `application.properties`

---

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### 1. **redirect_uri_mismatch**
```
Error: redirect_uri_mismatch
```
**Nguyên nhân:** Redirect URI trong Google Console không khớp với backend

**Giải pháp:**
- Kiểm tra `application.properties`: `{baseUrl}/login/oauth2/code/google`
- Đảm bảo Google Console có: `http://localhost:60/login/oauth2/code/google`

### 2. **Invalid client credentials**
```
Error: invalid_client
```
**Nguyên nhân:** Client ID hoặc Secret sai

**Giải pháp:**
- Kiểm tra lại credentials từ Google Console
- Đảm bảo không có khoảng trắng thừa khi copy/paste

### 3. **CORS Error**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Nguyên nhân:** Backend chưa cho phép frontend origin

**Giải pháp:**
```properties
cors.allowed-origins=http://localhost:5173
```

### 4. **Tokens không được lưu**
```
User = null sau khi redirect
```
**Nguyên nhân:** AuthCallbackPage không lưu tokens đúng cách

**Giải pháp:**
- Kiểm tra URL params có `accessToken` và `refreshToken`
- Verify localStorage.setItem() được gọi
- Check Console logs

---

## 🚀 TESTING

### Test Flow Hoàn Chỉnh

```bash
# 1. Start backend
cd alert-service
mvn spring-boot:run

# 2. Start frontend
cd client-service/react-client
npm run dev

# 3. Test login
- Mở http://localhost:5173
- Click "Đăng nhập với Google"
- Đăng nhập bằng Google account
- Kiểm tra redirect về home page
- Verify user info hiển thị trên Header
```

### Kiểm Tra Tokens

```javascript
// Browser Console
console.log('Access Token:', localStorage.getItem('accessToken'));
console.log('Refresh Token:', localStorage.getItem('refreshToken'));

// Decode JWT
const token = localStorage.getItem('accessToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token Payload:', payload);
```

---

## 📚 TÀI LIỆU THAM KHẢO

- [Spring Security OAuth2 Login](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html)
- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [RFC 6749 - OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)

---

## 🎯 KẾT LUẬN

Flow hiện tại đã được **hoàn thiện đầy đủ** với:

✅ Backend xử lý OAuth2 với Spring Security  
✅ Custom success handler generate JWT tokens  
✅ Frontend nhận và lưu tokens  
✅ AuthContext quản lý authentication state  
✅ Error handling cho tất cả edge cases  
✅ Token refresh mechanism  
✅ CORS configuration đúng  

**Bước tiếp theo:** Cập nhật Google Client ID/Secret thực tế vào `application.properties` để test với Google OAuth2 thật.
