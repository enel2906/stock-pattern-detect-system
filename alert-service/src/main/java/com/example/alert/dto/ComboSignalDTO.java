package com.example.alert.dto;

import com.example.alert.domain.ComboSignal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO cho ComboSignal - trả về cho client
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboSignalDTO {
    
    private String comboId;
    private String name;
    private String description;
    private String pattern;
    private List<ComboSignal.IndicatorCondition> indicators;
    private ComboSignal.Prediction prediction;
    private String sentiment;
    private String reliability;
    private String icon;
    private String color;
    private Boolean enabled;
    
    /**
     * Convert từ domain object sang DTO
     */
    public static ComboSignalDTO fromEntity(ComboSignal entity) {
        if (entity == null) return null;
        
        return ComboSignalDTO.builder()
                .comboId(entity.getComboId())
                .name(entity.getName())
                .description(entity.getDescription())
                .pattern(entity.getPattern())
                .indicators(entity.getIndicators())
                .prediction(entity.getPrediction())
                .sentiment(entity.getSentiment())
                .reliability(entity.getReliability())
                .icon(entity.getIcon())
                .color(entity.getColor())
                .enabled(entity.getEnabled())
                .build();
    }
}
