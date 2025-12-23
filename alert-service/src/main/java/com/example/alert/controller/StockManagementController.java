package com.example.alert.controller;

import com.example.alert.response.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/stocks")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class StockManagementController {

    @Value("${python.service.url:http://localhost:8000}")
    private String pythonServiceUrl;

    private final RestTemplate restTemplate;

    /**
     * Get all managed stocks from database
     */
    @GetMapping
    public ResponseEntity<Response> getAllStocks() {
        try {
            String url = pythonServiceUrl + "/api/admin/stocks";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return ResponseEntity.ok(Response.success(response.getBody()));
        } catch (Exception e) {
            log.error("Error getting stocks: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Response.error(500, "Failed to get stocks: " + e.getMessage()));
        }
    }

    /**
     * Get available stocks from vnstock (not yet in database)
     */
    @GetMapping("/available")
    public ResponseEntity<Response> getAvailableStocks(
            @RequestParam(required = false) String exchange,
            @RequestParam(required = false) String search) {
        try {
            StringBuilder url = new StringBuilder(pythonServiceUrl + "/api/admin/stocks/available");
            
            boolean hasParam = false;
            if (exchange != null && !exchange.isEmpty()) {
                url.append("?exchange=").append(exchange);
                hasParam = true;
            }
            if (search != null && !search.isEmpty()) {
                url.append(hasParam ? "&" : "?").append("search=").append(search);
            }
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url.toString(), Map.class);
            return ResponseEntity.ok(Response.success(response.getBody()));
        } catch (Exception e) {
            log.error("Error getting available stocks: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Response.error(500, "Failed to get available stocks: " + e.getMessage()));
        }
    }

    /**
     * Add new stock to database
     */
    @PostMapping
    public ResponseEntity<Response> addStock(@RequestBody Map<String, String> request) {
        try {
            String url = pythonServiceUrl + "/api/admin/stocks";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            
            return ResponseEntity.ok(Response.success(response.getBody()));
        } catch (Exception e) {
            log.error("Error adding stock: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Response.error(500, "Failed to add stock: " + e.getMessage()));
        }
    }

    /**
     * Delete stock from database
     */
    @DeleteMapping("/{stockId}")
    public ResponseEntity<Response> deleteStock(@PathVariable String stockId) {
        try {
            String url = pythonServiceUrl + "/api/admin/stocks/" + stockId;
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    null,
                    Map.class
            );
            return ResponseEntity.ok(Response.success(response.getBody()));
        } catch (Exception e) {
            log.error("Error deleting stock: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Response.error(500, "Failed to delete stock: " + e.getMessage()));
        }
    }

    /**
     * Get stocks statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Response> getStocksStats() {
        try {
            String url = pythonServiceUrl + "/api/admin/stocks/stats";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return ResponseEntity.ok(Response.success(response.getBody()));
        } catch (Exception e) {
            log.error("Error getting stocks stats: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Response.error(500, "Failed to get stocks stats: " + e.getMessage()));
        }
    }
}
