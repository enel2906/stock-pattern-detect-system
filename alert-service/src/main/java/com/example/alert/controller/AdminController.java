package com.example.alert.controller;

import com.example.alert.domain.User;
import com.example.alert.dto.UserDto;
import com.example.alert.response.Response;
import com.example.alert.security.UserPrincipal;
import com.example.alert.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    
    private final AdminService adminService;
    
    /**
     * Get all users
     */
    @GetMapping("/users")
    public ResponseEntity<Response> getAllUsers() {
        try {
            List<UserDto> users = adminService.getAllUsers();
            return ResponseEntity.ok(Response.success(users));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Response.error(400, e.getMessage()));
        }
    }
    
    /**
     * Get user by ID
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<Response> getUserById(@PathVariable String userId) {
        try {
            UserDto user = adminService.getUserById(userId);
            return ResponseEntity.ok(Response.success(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Response.error(404, e.getMessage()));
        }
    }
    
    /**
     * Delete user by ID
     */
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Response> deleteUser(
            @PathVariable String userId,
            @AuthenticationPrincipal UserPrincipal adminPrincipal) {
        try {
            // Prevent admin from deleting themselves
            if (adminPrincipal.getUser().getId().equals(userId)) {
                return ResponseEntity.badRequest()
                        .body(Response.error(400, "Cannot delete your own account"));
            }
            
            adminService.deleteUser(userId);
            return ResponseEntity.ok(Response.success("User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Response.error(400, e.getMessage()));
        }
    }
    
    /**
     * Update user role
     */
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<Response> updateUserRole(
            @PathVariable String userId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserPrincipal adminPrincipal) {
        try {
            // Prevent admin from changing their own role
            if (adminPrincipal.getUser().getId().equals(userId)) {
                return ResponseEntity.badRequest()
                        .body(Response.error(400, "Cannot change your own role"));
            }
            
            String roleStr = request.get("role");
            User.Role newRole = User.Role.valueOf(roleStr.toUpperCase());
            
            UserDto updatedUser = adminService.updateUserRole(userId, newRole);
            return ResponseEntity.ok(Response.success(updatedUser));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Response.error(400, "Invalid role specified"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Response.error(400, e.getMessage()));
        }
    }
    
    /**
     * Get admin dashboard statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Response> getStats() {
        try {
            long totalUsers = adminService.getUserCount();
            long adminCount = adminService.getUsersByRole(User.Role.ADMIN).size();
            long userCount = adminService.getUsersByRole(User.Role.USER).size();
            
            Map<String, Object> stats = Map.of(
                    "totalUsers", totalUsers,
                    "adminCount", adminCount,
                    "userCount", userCount
            );
            
            return ResponseEntity.ok(Response.success(stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Response.error(400, e.getMessage()));
        }
    }
}
