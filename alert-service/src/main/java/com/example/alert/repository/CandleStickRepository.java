package com.example.alert.repository;

import com.example.alert.domain.CandleStick;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandleStickRepository extends MongoRepository<CandleStick, String> {
    List<CandleStick> getByStockId(String stockId);
}
