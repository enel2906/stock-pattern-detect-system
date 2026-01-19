package com.example.alert.controller;

import com.example.alert.dto.*;
import com.example.alert.response.Response;
import com.example.alert.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/register")
    public ResponseEntity<Response> register(@Valid @RequestBody RegisterRequest request, BindingResult bindingResult) {
        // Return validation errors if any
        if (bindingResult.hasErrors()) {
            String errors = bindingResult.getFieldErrors().stream()
                    .map(error -> error.getField() + ": " + error.getDefaultMessage())
                    .collect(Collectors.joining("; "));
            return ResponseEntity.badRequest()
                    .body(Response.error(400, errors));
        }
        
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(Response.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Response.error(400, e.getMessage()));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<Response> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(Response.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Response.error(401, "Invalid username or password"));
        }
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<Response> refreshToken(@RequestParam String refreshToken) {
        try {
            AuthResponse response = authService.refreshToken(refreshToken);
            return ResponseEntity.ok(Response.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Response.error(401, "Invalid refresh token"));
        }
    }
}
