package com.example.alert.service;

import com.example.alert.domain.Stock;

import java.util.List;

public interface DetectCandlePattern {
    List<Stock> getHammerCandles(String stockId);
}
