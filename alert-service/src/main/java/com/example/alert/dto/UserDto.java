package com.example.alert.dto;

import com.example.alert.domain.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    
    private String id;
    private String username;
    private String email;
    private String fullName;
    private Integer age;
    private String authProvider;
    private String role;
    
    public static UserDto fromUser(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .age(user.getAge())
                .authProvider(user.getAuthProvider().name())
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .build();
    }
}
