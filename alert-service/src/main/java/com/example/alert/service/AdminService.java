package com.example.alert.service;

import com.example.alert.domain.User;
import com.example.alert.dto.UserDto;
import com.example.alert.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {
    
    private final UserRepository userRepository;
    
    /**
     * Get all users in the system
     */
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::fromUser)
                .collect(Collectors.toList());
    }
    
    /**
     * Get user by ID
     */
    public UserDto getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return UserDto.fromUser(user);
    }
    
    /**
     * Delete user by ID
     */
    public void deleteUser(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
    }
    
    /**
     * Update user role
     */
    public UserDto updateUserRole(String userId, User.Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        user.setRole(newRole);
        user = userRepository.save(user);
        
        return UserDto.fromUser(user);
    }
    
    /**
     * Get total user count
     */
    public long getUserCount() {
        return userRepository.count();
    }
    
    /**
     * Get users by role
     */
    public List<UserDto> getUsersByRole(User.Role role) {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == role)
                .map(UserDto::fromUser)
                .collect(Collectors.toList());
    }
}
