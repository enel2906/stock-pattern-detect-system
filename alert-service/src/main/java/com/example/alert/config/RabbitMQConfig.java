package com.example.alert.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Stock market data (candlestick updates)
    public static final String EXCHANGE_NAME = "stock.market.data";
    public static final String QUEUE_NAME = "stock.live.updates";
    public static final String ROUTING_KEY_PATTERN = "stock.update.*";

    // Price board realtime updates
    public static final String PRICE_BOARD_EXCHANGE_NAME = "stock.price.board";
    public static final String PRICE_BOARD_QUEUE_NAME = "price.board.updates";
    public static final String PRICE_BOARD_ROUTING_KEY = "price.board.update";

    @Bean
    public TopicExchange stockExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    @Bean
    public Queue stockQueue() {
        return new Queue(QUEUE_NAME, true);
    }

    @Bean
    public Binding binding(Queue stockQueue, TopicExchange stockExchange) {
        return BindingBuilder
                .bind(stockQueue)
                .to(stockExchange)
                .with(ROUTING_KEY_PATTERN);
    }

    // Price Board Exchange, Queue and Binding
    @Bean
    public TopicExchange priceBoardExchange() {
        return new TopicExchange(PRICE_BOARD_EXCHANGE_NAME, true, false);
    }

    @Bean
    public Queue priceBoardQueue() {
        return new Queue(PRICE_BOARD_QUEUE_NAME, true);
    }

    @Bean
    public Binding priceBoardBinding(Queue priceBoardQueue, TopicExchange priceBoardExchange) {
        return BindingBuilder
                .bind(priceBoardQueue)
                .to(priceBoardExchange)
                .with(PRICE_BOARD_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
