package com.example.alert.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO cho AlertSetting - trả về cho client
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertSettingDTO {
    
    private String id;
    private String userId;
    private String comboSignalId;
    private LocalDateTime createdAt;
    
    // Thông tin combo signal (optional, có thể include khi cần)
    private ComboSignalDTO comboSignal;
}
