package com.example.alert.repository;

import com.example.alert.domain.CandleStick;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CandleStickRepository extends MongoRepository<String, CandleStick> {
}
