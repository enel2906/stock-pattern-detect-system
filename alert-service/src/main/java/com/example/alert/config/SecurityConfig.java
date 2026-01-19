package com.example.alert.config;

import com.example.alert.repository.UserRepository;
import com.example.alert.security.JwtAuthenticationFilter;
import com.example.alert.security.UserPrincipal;
import com.example.alert.service.CustomOAuth2UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final UserRepository userRepository;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final ClientRegistrationRepository clientRegistrationRepository;
    
    @Value("${cors.allowed-origins}")
    private String allowedOrigins;
    
    // Cookie name for storing frontend URL
    private static final String FRONTEND_URL_COOKIE = "oauth2_frontend_url";
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthFilter) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/combo-signals/**",
                                "/error",
                                "/ws/**",
                                "/oauth2/**",
                                "/login/oauth2/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/stock").permitAll()
                        .requestMatchers(HttpMethod.GET, "/stock/all").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(auth -> auth
                                .authorizationRequestResolver(
                                    new CustomOAuth2AuthorizationRequestResolver(clientRegistrationRepository)
                                )
                        )
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )
                        .successHandler(oAuth2SuccessHandler())
                        .failureHandler((request, response, exception) -> {
                            String frontendUrl = getFrontendUrlFromCookie(request);
                            clearFrontendUrlCookie(response);
                            response.sendRedirect(frontendUrl + "/login?error=" + exception.getMessage());
                        })
                )
                // Return 401 instead of redirecting for REST API calls
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(401);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"code\":401,\"data\":\"Unauthorized - " + authException.getMessage() + "\"}");
                        })
                )
                .authenticationProvider(authenticationProvider())
                // Add filter to capture frontend URL BEFORE OAuth redirect
                .addFilterBefore(oAuth2FrontendUrlFilter(), OAuth2AuthorizationRequestRedirectFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    /**
     * Filter to capture frontend URL before OAuth2 redirect
     * Saves frontend URL to cookie instead of session
     */
    @Bean
    public OncePerRequestFilter oAuth2FrontendUrlFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                    FilterChain filterChain) throws ServletException, IOException {
                
                // Only capture for OAuth2 authorization endpoint
                String requestUri = request.getRequestURI();
                if (requestUri.startsWith("/oauth2/authorization/")) {
                    String frontendUrl = extractFrontendUrl(request);
                    // Save to cookie (will survive OAuth redirect)
                    Cookie cookie = new Cookie(FRONTEND_URL_COOKIE, 
                        URLEncoder.encode(frontendUrl, StandardCharsets.UTF_8));
                    cookie.setPath("/");
                    cookie.setMaxAge(300); // 5 minutes
                    cookie.setHttpOnly(true);
                    response.addCookie(cookie);
                }
                
                filterChain.doFilter(request, response);
            }
        };
    }
    
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            var user = userRepository.findByUsername(username)
                    .or(() -> userRepository.findByEmail(username))
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
            return new UserPrincipal(user);
        };
    }
    
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Support wildcard patterns for LAN access
        if ("*".equals(allowedOrigins)) {
            configuration.addAllowedOriginPattern("*");
        } else {
            configuration.setAllowedOriginPatterns(Arrays.asList(allowedOrigins.split(",")));
        }
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    
    /**
     * Extract frontend URL from request headers (Origin/Referer)
     */
    private String extractFrontendUrl(HttpServletRequest request) {
        // Try Origin header first
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isEmpty()) {
            return origin;
        }
        
        // Try Referer header
        String referer = request.getHeader("Referer");
        if (referer != null && !referer.isEmpty()) {
            try {
                java.net.URL url = new java.net.URL(referer);
                String port = url.getPort() != -1 && url.getPort() != url.getDefaultPort() 
                    ? ":" + url.getPort() : "";
                return url.getProtocol() + "://" + url.getHost() + port;
            } catch (Exception e) {
                // Fall through to default
            }
        }
        
        // Fallback: check if ngrok
        String serverName = request.getServerName();
        if (serverName.contains("ngrok")) {
            return request.getScheme() + "://" + serverName;
        }
        
        // Default to localhost:5173 for local development
        return "http://localhost:5173";
    }
    
    /**
     * Get frontend URL from cookie
     */
    private String getFrontendUrlFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (FRONTEND_URL_COOKIE.equals(cookie.getName())) {
                    try {
                        return URLDecoder.decode(cookie.getValue(), StandardCharsets.UTF_8);
                    } catch (Exception e) {
                        // Fall through to default
                    }
                }
            }
        }
        return "http://localhost:5173";
    }
    
    /**
     * Clear the frontend URL cookie after use
     */
    private void clearFrontendUrlCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(FRONTEND_URL_COOKIE, "");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
    
    @Bean
    public AuthenticationSuccessHandler oAuth2SuccessHandler() {
        return (request, response, authentication) -> {
            try {
                org.springframework.security.oauth2.core.user.OAuth2User oauth2User = 
                    (org.springframework.security.oauth2.core.user.OAuth2User) authentication.getPrincipal();
                
                com.example.alert.dto.AuthResponse authResponse = customOAuth2UserService.handleOAuth2Success(oauth2User);
                
                // Get frontend URL from cookie
                String frontendUrl = getFrontendUrlFromCookie(request);
                clearFrontendUrlCookie(response);
                
                String redirectUrl = String.format(
                    "%s/auth/callback?accessToken=%s&refreshToken=%s",
                    frontendUrl,
                    authResponse.getAccessToken(),
                    authResponse.getRefreshToken()
                );
                
                response.sendRedirect(redirectUrl);
            } catch (Exception e) {
                String frontendUrl = getFrontendUrlFromCookie(request);
                clearFrontendUrlCookie(response);
                response.sendRedirect(frontendUrl + "/login?error=" + e.getMessage());
            }
        };
    }
}
