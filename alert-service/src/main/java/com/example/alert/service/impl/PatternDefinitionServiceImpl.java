package com.example.alert.service.impl;

import com.example.alert.domain.PatternDefinition;
import com.example.alert.repository.PatternDefinitionRepository;
import com.example.alert.service.PatternDefinitionService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class PatternDefinitionServiceImpl implements PatternDefinitionService {
    private final PatternDefinitionRepository patternDefinitionRepository;

    @Override
    public Map<String, String> getMapPatternDefinition() {
        Map<String, String> result = new HashMap<>();

        List<PatternDefinition> patternDefinitions = patternDefinitionRepository.findAll();
        if (patternDefinitions.isEmpty()) {
            return result;
        }
        result = patternDefinitions.stream()
                .collect(Collectors.toMap(PatternDefinition::getPatternType, PatternDefinition::getPatternDefinition));
        return result;
    }


}
