package com.example.alert.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import lombok.Data;
import lombok.ToString;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableAutoConfiguration
@ConfigurationProperties("mongo")
@Data
@ToString
public class MongoConfig {
    private String uri;

    @Bean("primaryMongoClient")
    public MongoClient mongoClient() {
        return MongoClients.create(uri);
    }


}
