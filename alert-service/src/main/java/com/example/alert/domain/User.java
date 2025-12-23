package com.example.alert.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String username;
    
    @Indexed(unique = true)
    private String email;
    
    private String password;
    
    private String fullName;
    
    private Integer age;
    
    private AuthProvider authProvider;
    
    private String googleId;
    
    @Builder.Default
    private Role role = Role.USER;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    public enum AuthProvider {
        LOCAL,
        GOOGLE
    }
    
    public enum Role {
        USER,
        ADMIN
    }
}
