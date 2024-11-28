package com.example.alert.repository.impl;

import com.example.alert.domain.CandleStick;
import com.example.alert.repository.customize.CandleStickRepositoryCustom;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CandleStickRepositoryCustomImpl implements CandleStickRepositoryCustom {

    private MongoTemplate mongoTemplate;

    public List<CandleStick> getHammerCandles(String stockId) {
        Query query = new Query();

        // Điều kiện: Lọc theo stockId
        query.addCriteria(Criteria.where(CandleStick.STOCK_ID).is(stockId));

        // Điều kiện cho Hammer:
        query.addCriteria(
                new Criteria().andOperator(
                        Criteria.where(CandleStick.CLOSE)
                                .subtract(Criteria.where(CandleStick.OPEN))
                                .abs().lte(0.2),
                        // Bóng dưới lớn (gấp đôi thân nến)
                        Criteria.where(CandleStick.OPEN)
                                .min(Criteria.where(CandleStick.CLOSE))
                                .subtract(Criteria.where(CandleStick.LOW))
                                .gte(Criteria.where(CandleStick.CLOSE)
                                        .subtract(Criteria.where(CandleStick.OPEN))
                                        .abs().multiply(2)),
                        Criteria.where(CandleStick.HIGH)
                                .subtract(Criteria.where(CandleStick.OPEN).max(Criteria.where(CandleStick.CLOSE)))
                                .lte(0.2)
                )
        );

        return mongoTemplate.find(query, CandleStick.class);
    }
}
