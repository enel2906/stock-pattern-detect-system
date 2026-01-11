package com.example.alert.service;

import com.example.alert.domain.AlertSetting;
import com.example.alert.domain.ComboSignal;
import com.example.alert.dto.AlertSettingDTO;
import com.example.alert.dto.ComboSignalDTO;
import com.example.alert.repository.AlertSettingRepository;
import com.example.alert.repository.ComboSignalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service xử lý logic cho AlertSetting
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlertSettingService {
    
    private final AlertSettingRepository alertSettingRepository;
    private final ComboSignalRepository comboSignalRepository;
    
    /**
     * Lấy tất cả alert settings của user
     */
    public List<AlertSettingDTO> getAlertSettingsByUserId(String userId) {
        List<AlertSetting> settings = alertSettingRepository.findByUserId(userId);
        return settings.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy danh sách comboSignalId mà user đã bật
     */
    public List<String> getActiveComboSignalIds(String userId) {
        List<AlertSetting> settings = alertSettingRepository.findByUserId(userId);
        return settings.stream()
                .map(AlertSetting::getComboSignalId)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy alert settings kèm thông tin combo signal
     */
    public List<AlertSettingDTO> getAlertSettingsWithComboSignal(String userId) {
        List<AlertSetting> settings = alertSettingRepository.findByUserId(userId);
        return settings.stream()
                .map(setting -> {
                    AlertSettingDTO dto = toDTO(setting);
                    // Lấy thông tin combo signal
                    comboSignalRepository.findByComboId(setting.getComboSignalId())
                            .ifPresent(combo -> dto.setComboSignal(ComboSignalDTO.fromEntity(combo)));
                    return dto;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Bật alert cho một combo signal
     */
    @Transactional
    public AlertSettingDTO enableComboSignal(String userId, String comboSignalId) {
        // Kiểm tra combo signal có tồn tại không
        Optional<ComboSignal> comboOpt = comboSignalRepository.findByComboId(comboSignalId);
        if (comboOpt.isEmpty()) {
            throw new IllegalArgumentException("Combo signal not found: " + comboSignalId);
        }
        
        ComboSignal combo = comboOpt.get();
        if (!combo.getEnabled()) {
            throw new IllegalArgumentException("Combo signal is disabled: " + comboSignalId);
        }
        
        // Kiểm tra đã bật chưa
        if (alertSettingRepository.existsByUserIdAndComboSignalId(userId, comboSignalId)) {
            log.info("User {} already enabled combo signal {}", userId, comboSignalId);
            // Trả về setting hiện tại
            return alertSettingRepository.findByUserIdAndComboSignalId(userId, comboSignalId)
                    .map(this::toDTO)
                    .orElse(null);
        }
        
        // Tạo mới alert setting
        AlertSetting setting = AlertSetting.builder()
                .userId(userId)
                .comboSignalId(comboSignalId)
                .createdAt(LocalDateTime.now())
                .build();
        
        AlertSetting saved = alertSettingRepository.save(setting);
        log.info("User {} enabled combo signal {}", userId, comboSignalId);
        
        return toDTO(saved);
    }
    
    /**
     * Tắt alert cho một combo signal
     */
    @Transactional
    public void disableComboSignal(String userId, String comboSignalId) {
        alertSettingRepository.deleteByUserIdAndComboSignalId(userId, comboSignalId);
        log.info("User {} disabled combo signal {}", userId, comboSignalId);
    }
    
    /**
     * Toggle (bật/tắt) alert cho một combo signal
     */
    @Transactional
    public ToggleResponse toggleComboSignal(String userId, String comboSignalId) {
        boolean isCurrentlyEnabled = alertSettingRepository.existsByUserIdAndComboSignalId(userId, comboSignalId);
        
        if (isCurrentlyEnabled) {
            disableComboSignal(userId, comboSignalId);
            return new ToggleResponse(comboSignalId, false, "Đã tắt combo signal");
        } else {
            enableComboSignal(userId, comboSignalId);
            return new ToggleResponse(comboSignalId, true, "Đã bật combo signal");
        }
    }
    
    /**
     * Kiểm tra user có bật combo signal này không
     */
    public boolean isComboSignalEnabled(String userId, String comboSignalId) {
        return alertSettingRepository.existsByUserIdAndComboSignalId(userId, comboSignalId);
    }
    
    /**
     * Xóa tất cả alert settings của user
     */
    @Transactional
    public void clearAllAlertSettings(String userId) {
        alertSettingRepository.deleteByUserId(userId);
        log.info("Cleared all alert settings for user {}", userId);
    }
    
    private AlertSettingDTO toDTO(AlertSetting setting) {
        return AlertSettingDTO.builder()
                .id(setting.getId())
                .userId(setting.getUserId())
                .comboSignalId(setting.getComboSignalId())
                .createdAt(setting.getCreatedAt())
                .build();
    }
    
    /**
     * Response class cho toggle operation
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ToggleResponse {
        private String comboSignalId;
        private boolean enabled;
        private String message;
    }
}
