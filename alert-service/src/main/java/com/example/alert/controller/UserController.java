package com.example.alert.controller;

import com.example.alert.dto.UserDto;
import com.example.alert.response.Response;
import com.example.alert.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    
    @GetMapping("/me")
    public ResponseEntity<Response> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserDto userDto = UserDto.fromUser(userPrincipal.getUser());
        return ResponseEntity.ok(Response.success(userDto));
    }
}
