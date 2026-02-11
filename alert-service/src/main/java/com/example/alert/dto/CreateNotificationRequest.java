package com.example.alert.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO để tạo notification mới
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {
    
    @NotBlank(message = "Stock symbol is required")
    private String stockSymbol;
    
    @NotBlank(message = "Pattern name is required")
    private String patternName;
    
    @NotBlank(message = "Pattern display name is required")
    private String patternDisplayName;
    
    private String sentiment;
    
    @NotBlank(message = "Pattern date is required")
    private String patternDate;
    
    private Double closePrice;
}
