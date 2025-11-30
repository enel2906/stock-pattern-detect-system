package com.example.alert.service;

import com.example.alert.config.RabbitMQConfig;
import com.example.alert.dto.StockUpdateDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockDataListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConnectionFactory connectionFactory;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        try {
            // Kiểm tra kết nối RabbitMQ khi khởi động
            connectionFactory.createConnection().close();
            log.info("✅ RabbitMQ connection established successfully");
        } catch (Exception e) {
            log.warn("⚠️ RabbitMQ is not available at startup. Will auto-reconnect when RabbitMQ starts: {}", e.getMessage());
        }
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void receiveStockUpdate(StockUpdateDTO stockUpdate) {
        try {
            log.info("Received stock update for symbol: {}", stockUpdate.getSymbol());
            
            String destination = String.format("/topic/stock-updates/%s", stockUpdate.getSymbol());
            messagingTemplate.convertAndSend(destination, stockUpdate);
            
            log.info("Sent stock update to WebSocket topic: {}", destination);
        } catch (Exception e) {
            log.error("Error processing stock update for {}: {}", stockUpdate.getSymbol(), e.getMessage(), e);
        }
    }
}
