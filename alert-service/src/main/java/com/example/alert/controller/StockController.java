package com.example.alert.controller;

import com.example.alert.constant.ResponseCode;
import com.example.alert.domain.CandleStick;
import com.example.alert.domain.StockMarket;
import com.example.alert.response.Response;
import com.example.alert.service.CandleStickService;
import com.example.alert.service.StockMarketService;
import lombok.AllArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import yahoofinance.Stock;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/stock")
@AllArgsConstructor
@CrossOrigin(origins = "*")
public class StockController {
    private final CandleStickService candleStickService;
    private final StockMarketService stockMarketService;

    @GetMapping()
    public Response getCandleStickChartByStockSymbol(@RequestParam String stockSymbol) {
        StockMarket stock = stockMarketService.getStockBySymbol(stockSymbol);
        if (Objects.isNull(stock) || StringUtils.isEmpty(stock.getId())) {
            return new Response(ResponseCode.WRONG_DATA_FORMAT);
        }

        List<CandleStick> data = candleStickService.getCandlesByStockId(stock.getId());
        return new Response(ResponseCode.SUCCESS, data);
    }
}
