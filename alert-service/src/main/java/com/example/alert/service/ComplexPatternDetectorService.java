package com.example.alert.service;

import com.example.alert.model.CupWithHandle;

import java.util.List;

public interface ComplexPatternDetectorService {
    CupWithHandle getNearestCupWithHandle(List<Double> smaValues);
}
