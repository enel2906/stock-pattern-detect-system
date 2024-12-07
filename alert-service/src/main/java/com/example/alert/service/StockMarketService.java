package com.example.alert.service;

import com.example.alert.domain.StockMarket;

public interface StockMarketService {
    StockMarket getStockBySymbol(String stockSymbol);
}
