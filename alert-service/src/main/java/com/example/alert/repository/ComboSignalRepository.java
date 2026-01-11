package com.example.alert.repository;

import com.example.alert.domain.ComboSignal;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComboSignalRepository extends MongoRepository<ComboSignal, String> {
    
    /**
     * Tìm combo signal theo comboId
     */
    Optional<ComboSignal> findByComboId(String comboId);
    
    /**
     * Lấy tất cả combo signals đang enabled
     */
    List<ComboSignal> findByEnabledTrue();
    
    /**
     * Lấy combo signals theo sentiment (bullish/bearish/neutral)
     */
    List<ComboSignal> findBySentimentAndEnabledTrue(String sentiment);
    
    /**
     * Lấy combo signals theo reliability
     */
    List<ComboSignal> findByReliabilityAndEnabledTrue(String reliability);
    
    /**
     * Kiểm tra comboId đã tồn tại chưa
     */
    boolean existsByComboId(String comboId);
}
