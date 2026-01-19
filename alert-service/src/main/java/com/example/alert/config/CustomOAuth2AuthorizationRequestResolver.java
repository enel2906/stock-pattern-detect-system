package com.example.alert.config;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

/**
 * Custom OAuth2 Authorization Request Resolver that dynamically sets the redirect URI
 * based on the frontend URL (for ngrok/proxy support).
 * 
 * When accessing from ngrok, the redirect URI should be the ngrok URL, not localhost.
 */
public class CustomOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private static final String FRONTEND_URL_COOKIE = "oauth2_frontend_url";
    private final DefaultOAuth2AuthorizationRequestResolver defaultResolver;

    public CustomOAuth2AuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(
            clientRegistrationRepository, "/oauth2/authorization"
        );
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest authorizationRequest = defaultResolver.resolve(request);
        return customizeAuthorizationRequest(authorizationRequest, request);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest authorizationRequest = defaultResolver.resolve(request, clientRegistrationId);
        return customizeAuthorizationRequest(authorizationRequest, request);
    }

    private OAuth2AuthorizationRequest customizeAuthorizationRequest(
            OAuth2AuthorizationRequest authorizationRequest, 
            HttpServletRequest request) {
        
        if (authorizationRequest == null) {
            return null;
        }

        // Get frontend URL from cookie (set by oAuth2FrontendUrlFilter)
        String frontendUrl = getFrontendUrlFromCookie(request);
        
        // If no cookie, try to extract from request
        if (frontendUrl == null || frontendUrl.equals("http://localhost:5173")) {
            frontendUrl = extractFrontendUrl(request);
        }
        
        // Build custom redirect URI using frontend URL as base
        // This makes Google redirect back to the frontend (ngrok) URL
        String customRedirectUri = frontendUrl + "/login/oauth2/code/google";
        
        return OAuth2AuthorizationRequest.from(authorizationRequest)
                .redirectUri(customRedirectUri)
                .build();
    }

    private String getFrontendUrlFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (FRONTEND_URL_COOKIE.equals(cookie.getName())) {
                    try {
                        return URLDecoder.decode(cookie.getValue(), StandardCharsets.UTF_8);
                    } catch (Exception e) {
                        // Fall through
                    }
                }
            }
        }
        return null;
    }

    private String extractFrontendUrl(HttpServletRequest request) {
        // Try Origin header
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
                // Fall through
            }
        }

        // Check X-Forwarded headers (for proxy)
        String forwardedHost = request.getHeader("X-Forwarded-Host");
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        if (forwardedHost != null) {
            String proto = forwardedProto != null ? forwardedProto : "https";
            return proto + "://" + forwardedHost;
        }

        // Check if ngrok
        String serverName = request.getServerName();
        if (serverName.contains("ngrok")) {
            return request.getScheme() + "://" + serverName;
        }

        // Default to localhost:5173
        return "http://localhost:5173";
    }
}
