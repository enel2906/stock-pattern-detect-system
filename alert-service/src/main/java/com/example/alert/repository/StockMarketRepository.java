package com.example.alert.repository;

import com.example.alert.domain.StockMarket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockMarketRepository extends MongoRepository<StockMarket, String> {
    StockMarket getStockBySymbol(String stockSymbol);
}
