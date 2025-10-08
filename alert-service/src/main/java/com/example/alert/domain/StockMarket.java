package com.example.alert.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "stocks")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StockMarket {
    public static final String ID = "_id";
    public static final String NAME = "name";
    public static final String SYMBOL = "symbol";
    public static final String CREATED_AT = "created_at";
    public static final String MARKET = "market";
    public static final String COUNTRY = "country";

    @Id
    private String id;
    @Field(SYMBOL)
    private String symbol;
    @Field(NAME)
    private String name;
    @Field(MARKET)
    private String market;
    @Field(COUNTRY)
    private String country;
    @Field(CREATED_AT)
    private long createdAt;
}
