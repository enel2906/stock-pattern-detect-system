package com.example.alert.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Document(collection = "candlesticks")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CandleStick {
    public static final String ID = "_id";
    public static final String STOCK_ID = "stock_id";
    public static final String OPEN = "open";
    public static final String CLOSE = "close";
    public static final String HIGH = "high";
    public static final String LOW = "low";
    public static final String VOLUME = "volume";
    public static final String DATE = "date";
    public static final String DATE_STR = "date_str";

    @Id
    @Field(targetType = FieldType.STRING)
    private String id;
    @Field(STOCK_ID)
    private String stockId;
    @Field(OPEN)
    private double open;
    @Field(CLOSE)
    private double close;
    @Field(HIGH)
    private double high;
    @Field(LOW)
    private double low;
    @Field(VOLUME)
    private double volume;
    @Field(DATE)
    private long date;
    @Field(DATE_STR)
    private String dateStr;

}
