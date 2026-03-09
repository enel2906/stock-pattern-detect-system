package com.example.alert.controller;

import com.example.alert.constant.ResponseCode;
import com.example.alert.domain.CandleStick;
import com.example.alert.domain.StockMarket;
import com.example.alert.response.Response;
import com.example.alert.service.CandleStickService;
import com.example.alert.service.StockMarketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/stock")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class StockChartController {
    private final CandleStickService candleStickService;
    private final StockMarketService stockMarketService;
    private final RestTemplate restTemplate;

    @Value("${python.service.url:http://localhost:8000}")
    private String pythonServiceUrl;

    @GetMapping()
    public Response getListCandleByStockSymbol(@RequestParam String symbol) {
        StockMarket stock = stockMarketService.getStockBySymbol(symbol);
        if (Objects.isNull(stock) || !StringUtils.hasText(stock.getId())) {
            return new Response(ResponseCode.WRONG_DATA_FORMAT);
        }

        List<CandleStick> data = candleStickService.getCandlesByStockId(stock.getId());

        // Nếu chưa có candlestick data, gọi data-service để lấy
        if (data == null || data.isEmpty()) {
            log.info("No candlestick data for {}. Calling data-service to fetch...", symbol);
            try {
                String url = pythonServiceUrl + "/api/stocks/" + symbol + "/ensure-data";
                restTemplate.postForEntity(url, null, Map.class);

                // Lấy lại data sau khi data-service đã fetch
                data = candleStickService.getCandlesByStockId(stock.getId());
            } catch (Exception e) {
                log.error("Error calling data-service ensure-data for {}: {}", symbol, e.getMessage());
            }
        }

        return new Response(data);
    }

    @GetMapping("/all")
    public Response getAllStock() {
        List<StockMarket> stockMarketList = stockMarketService.getALlStocks();
        System.out.println("================= Number Stock Code is: " + stockMarketList.size());
        return new Response(stockMarketList);
    }
}
