package com.example.alert.controller;

import com.example.alert.dto.AuthResponse;
import com.example.alert.service.CustomOAuth2UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/auth/google")
@RequiredArgsConstructor
public class OAuth2Controller {
    
    private final CustomOAuth2UserService customOAuth2UserService;
    
    @Value("${cors.allowed-origins}")
    private String allowedOrigins;
    
    @GetMapping("/callback")
    public void handleGoogleCallback(
            @AuthenticationPrincipal OAuth2User oauth2User,
            HttpServletResponse response
    ) throws IOException {
        try {
            AuthResponse authResponse = customOAuth2UserService.handleOAuth2Success(oauth2User);
            
            // Redirect to frontend with tokens
            String frontendUrl = allowedOrigins.split(",")[0];
            String redirectUrl = String.format(
                    "%s/auth/callback?accessToken=%s&refreshToken=%s",
                    frontendUrl,
                    authResponse.getAccessToken(),
                    authResponse.getRefreshToken()
            );
            
            response.sendRedirect(redirectUrl);
        } catch (Exception e) {
            String frontendUrl = allowedOrigins.split(",")[0];
            response.sendRedirect(frontendUrl + "/login?error=" + e.getMessage());
        }
    }
}
