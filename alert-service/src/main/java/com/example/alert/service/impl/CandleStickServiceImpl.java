package com.example.alert.service.impl;

import com.example.alert.domain.CandleStick;
import com.example.alert.repository.CandleStickRepository;
import com.example.alert.service.CandleStickService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class CandleStickServiceImpl implements CandleStickService {
    private final CandleStickRepository candleStickRepository;

    @Override
    public List<CandleStick> getCandlesByStockId(String stockId) {
        return candleStickRepository.getByStockId(stockId);
    }
}
