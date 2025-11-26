package com.example.alert.repository;

import com.example.alert.domain.AlertRule;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRuleRepository extends MongoRepository<AlertRule, String> {
    
    List<AlertRule> findByUserId(String userId);
    
    List<AlertRule> findByUserIdAndStatus(String userId, AlertRule.RuleStatus status);
    
    List<AlertRule> findByUserIdAndSymbol(String userId, String symbol);
    
    List<AlertRule> findByUserIdAndSymbolAndStatus(String userId, String symbol, AlertRule.RuleStatus status);
    
    List<AlertRule> findBySymbolAndStatus(String symbol, AlertRule.RuleStatus status);
    
    long countByUserId(String userId);
    
    boolean existsByUserIdAndRuleName(String userId, String ruleName);
}
