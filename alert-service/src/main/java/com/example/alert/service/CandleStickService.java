package com.example.alert.service;

import com.example.alert.domain.CandleStick;
import com.example.alert.repository.CandleStickRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

public interface CandleStickService {
    List<CandleStick> getCandlesByStockId(String stockId);
}
