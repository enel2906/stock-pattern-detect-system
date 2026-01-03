package com.example.alert.service;

import com.example.alert.domain.StockMarket;

import java.util.List;

public interface StockMarketService {
    StockMarket getStockBySymbol(String stockSymbol);

    List<StockMarket> getALlStocks();
}
