package com.example.alert.repository.customize;

import com.example.alert.domain.CandleStick;
import com.example.alert.domain.Stock;

import java.util.List;

public interface CandleStickRepositoryCustom {
    List<CandleStick> getHammerCandles(String stockId);
}
