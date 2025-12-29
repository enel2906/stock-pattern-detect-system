package com.example.alert.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PriceBoardDTO {
    private List<PriceBoardItem> data;
    private Integer total;
    private String timestamp;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceBoardItem {
        private String symbol;
        private Double refPrice;
        private Double ceilingPrice;
        private Double floorPrice;
        private Double matchPrice;
        private Long matchVolume;
        private Double matchValue;
        private Double highest;
        private Double lowest;
        private Double openPrice;
        private Double avgPrice;
        private Double bid1Price;
        private Long bid1Volume;
        private Double bid2Price;
        private Long bid2Volume;
        private Double bid3Price;
        private Long bid3Volume;
        private Double ask1Price;
        private Long ask1Volume;
        private Double ask2Price;
        private Long ask2Volume;
        private Double ask3Price;
        private Long ask3Volume;
        private Double change;
        private Double changePercent;
    }
}
