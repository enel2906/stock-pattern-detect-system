package com.example.alert.service;

import com.example.alert.config.RabbitMQConfig;
import com.example.alert.dto.PriceBoardDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceBoardListener {

    private final SimpMessagingTemplate messagingTemplate;

    private static final String PRICE_BOARD_TOPIC = "/topic/price-board";

    @RabbitListener(queues = RabbitMQConfig.PRICE_BOARD_QUEUE_NAME)
    public void receivePriceBoardUpdate(PriceBoardDTO priceBoardDTO) {
        try {
            log.debug("Received price board update: {} stocks", priceBoardDTO.getTotal());
            
            // Push to WebSocket topic for all subscribers
            messagingTemplate.convertAndSend(PRICE_BOARD_TOPIC, priceBoardDTO);
            
            log.debug("Sent price board update to WebSocket topic: {}", PRICE_BOARD_TOPIC);
        } catch (Exception e) {
            log.error("Error processing price board update: {}", e.getMessage(), e);
        }
    }
}
