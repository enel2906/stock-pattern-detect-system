package com.example.alert.repository;

import com.example.alert.domain.AlertSetting;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlertSettingRepository extends MongoRepository<AlertSetting, String> {
    
    /**
     * Lấy tất cả alert settings của user
     */
    List<AlertSetting> findByUserId(String userId);
    
    /**
     * Tìm alert setting theo userId và comboSignalId
     */
    Optional<AlertSetting> findByUserIdAndComboSignalId(String userId, String comboSignalId);
    
    /**
     * Kiểm tra user đã bật combo này chưa
     */
    boolean existsByUserIdAndComboSignalId(String userId, String comboSignalId);
    
    /**
     * Xóa alert setting theo userId và comboSignalId
     */
    void deleteByUserIdAndComboSignalId(String userId, String comboSignalId);
    
    /**
     * Xóa tất cả alert settings của user
     */
    void deleteByUserId(String userId);
    
    /**
     * Đếm số users đang bật combo này
     */
    long countByComboSignalId(String comboSignalId);
}
