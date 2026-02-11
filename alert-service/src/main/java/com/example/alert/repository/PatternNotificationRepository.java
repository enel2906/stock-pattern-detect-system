package com.example.alert.repository;

import com.example.alert.domain.PatternNotification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PatternNotificationRepository extends MongoRepository<PatternNotification, String> {
    
    /**
     * Lấy tất cả notification của user, sắp xếp theo thời gian mới nhất
     */
    List<PatternNotification> findByUserIdOrderByCreatedAtDesc(String userId);
    
    /**
     * Lấy notification của user với phân trang
     */
    List<PatternNotification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    
    /**
     * Lấy notification chưa đọc của user
     */
    List<PatternNotification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(String userId);
    
    /**
     * Đếm số notification chưa đọc của user
     */
    long countByUserIdAndIsReadFalse(String userId);
    
    /**
     * Kiểm tra notification đã tồn tại chưa (tránh duplicate)
     * Cùng user, cùng mã, cùng pattern, cùng ngày
     */
    @Query("{'user_id': ?0, 'stock_symbol': ?1, 'pattern_name': ?2, 'pattern_date': ?3}")
    PatternNotification findExistingNotification(String userId, String stockSymbol, String patternName, String patternDate);
    
    /**
     * Xóa notification cũ hơn số ngày nhất định
     */
    void deleteByCreatedAtBefore(LocalDateTime before);
    
    /**
     * Lấy notification của user theo stock symbol
     */
    List<PatternNotification> findByUserIdAndStockSymbolOrderByCreatedAtDesc(String userId, String stockSymbol);
    
    /**
     * Xóa tất cả notification của user
     */
    void deleteByUserId(String userId);
}
