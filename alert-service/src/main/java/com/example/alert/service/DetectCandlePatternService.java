package com.example.alert.service;

import com.example.alert.domain.CandleStick;
import com.example.alert.domain.Stock;

import java.util.List;

public interface DetectCandlePatternService {
    List<CandleStick> getHammerCandles(String stockId);
}
