package com.example.alert.service;

import com.example.alert.domain.ComboSignal;
import com.example.alert.dto.ComboSignalDTO;
import com.example.alert.repository.ComboSignalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service xử lý logic cho ComboSignal
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComboSignalService {
    
    private final ComboSignalRepository comboSignalRepository;
    
    /**
     * Lấy tất cả combo signals đang enabled
     */
    public List<ComboSignalDTO> getAllEnabledComboSignals() {
        List<ComboSignal> signals = comboSignalRepository.findByEnabledTrue();
        log.info("Found {} enabled combo signals", signals.size());
        return signals.stream()
                .map(ComboSignalDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy tất cả combo signals (bao gồm cả disabled - cho admin)
     */
    public List<ComboSignalDTO> getAllComboSignals() {
        List<ComboSignal> signals = comboSignalRepository.findAll();
        return signals.stream()
                .map(ComboSignalDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy combo signal theo comboId
     */
    public Optional<ComboSignalDTO> getComboSignalById(String comboId) {
        return comboSignalRepository.findByComboId(comboId)
                .map(ComboSignalDTO::fromEntity);
    }
    
    /**
     * Lấy combo signals theo sentiment
     */
    public List<ComboSignalDTO> getComboSignalsBySentiment(String sentiment) {
        List<ComboSignal> signals = comboSignalRepository.findBySentimentAndEnabledTrue(sentiment);
        return signals.stream()
                .map(ComboSignalDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy combo signals theo reliability
     */
    public List<ComboSignalDTO> getComboSignalsByReliability(String reliability) {
        List<ComboSignal> signals = comboSignalRepository.findByReliabilityAndEnabledTrue(reliability);
        return signals.stream()
                .map(ComboSignalDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Kiểm tra comboId có tồn tại không
     */
    public boolean existsByComboId(String comboId) {
        return comboSignalRepository.existsByComboId(comboId);
    }
    
    /**
     * Lấy combo signals được nhóm theo sentiment
     */
    public ComboSignalGroupedResponse getComboSignalsGrouped() {
        List<ComboSignal> allSignals = comboSignalRepository.findByEnabledTrue();
        
        List<ComboSignalDTO> bullish = allSignals.stream()
                .filter(s -> "bullish".equals(s.getSentiment()))
                .map(ComboSignalDTO::fromEntity)
                .collect(Collectors.toList());
        
        List<ComboSignalDTO> bearish = allSignals.stream()
                .filter(s -> "bearish".equals(s.getSentiment()))
                .map(ComboSignalDTO::fromEntity)
                .collect(Collectors.toList());
        
        List<ComboSignalDTO> neutral = allSignals.stream()
                .filter(s -> "neutral".equals(s.getSentiment()))
                .map(ComboSignalDTO::fromEntity)
                .collect(Collectors.toList());
        
        return ComboSignalGroupedResponse.builder()
                .bullish(bullish)
                .bearish(bearish)
                .neutral(neutral)
                .total(allSignals.size())
                .build();
    }
    
    /**
     * Response class cho grouped combo signals
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ComboSignalGroupedResponse {
        private List<ComboSignalDTO> bullish;
        private List<ComboSignalDTO> bearish;
        private List<ComboSignalDTO> neutral;
        private int total;
    }
}
