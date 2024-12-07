package com.example.alert.service.impl;

import com.example.alert.domain.StockMarket;
import com.example.alert.repository.StockMarketRepository;
import com.example.alert.service.StockMarketService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class StockMarketServiceImpl implements StockMarketService {

    private final StockMarketRepository stockMarketRepository;
    @Override
    public StockMarket getStockBySymbol(String stockSymbol) {
        return stockMarketRepository.getStockBySymbol(stockSymbol);
    }
}
