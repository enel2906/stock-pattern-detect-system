package com.example.alert.controller;

import com.example.alert.dto.ComboSignalDTO;
import com.example.alert.response.Response;
import com.example.alert.service.ComboSignalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cho ComboSignal APIs
 * Cung cấp endpoints để lấy thông tin các combo signal
 */
@RestController
@RequestMapping("/api/combo-signals")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ComboSignalController {
    
    private final ComboSignalService comboSignalService;
    
    /**
     * Lấy tất cả combo signals đang enabled
     * GET /api/combo-signals
     */
    @GetMapping
    public ResponseEntity<Response> getAllComboSignals() {
        log.info("GET /api/combo-signals - Fetching all enabled combo signals");
        List<ComboSignalDTO> signals = comboSignalService.getAllEnabledComboSignals();
        return ResponseEntity.ok(Response.success(signals));
    }
    
    /**
     * Lấy combo signals đã nhóm theo sentiment
     * GET /api/combo-signals/grouped
     */
    @GetMapping("/grouped")
    public ResponseEntity<Response> getComboSignalsGrouped() {
        log.info("GET /api/combo-signals/grouped - Fetching combo signals grouped by sentiment");
        ComboSignalService.ComboSignalGroupedResponse grouped = comboSignalService.getComboSignalsGrouped();
        return ResponseEntity.ok(Response.success(grouped));
    }
    
    /**
     * Lấy combo signal theo comboId
     * GET /api/combo-signals/{comboId}
     */
    @GetMapping("/{comboId}")
    public ResponseEntity<Response> getComboSignalById(@PathVariable String comboId) {
        log.info("GET /api/combo-signals/{} - Fetching combo signal by id", comboId);
        return comboSignalService.getComboSignalById(comboId)
                .map(signal -> ResponseEntity.ok(Response.success(signal)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Lấy combo signals theo sentiment
     * GET /api/combo-signals/sentiment/{sentiment}
     */
    @GetMapping("/sentiment/{sentiment}")
    public ResponseEntity<Response> getComboSignalsBySentiment(
            @PathVariable String sentiment) {
        log.info("GET /api/combo-signals/sentiment/{} - Fetching combo signals by sentiment", sentiment);
        List<ComboSignalDTO> signals = comboSignalService.getComboSignalsBySentiment(sentiment);
        return ResponseEntity.ok(Response.success(signals));
    }
    
    /**
     * Lấy combo signals theo reliability
     * GET /api/combo-signals/reliability/{reliability}
     */
    @GetMapping("/reliability/{reliability}")
    public ResponseEntity<Response> getComboSignalsByReliability(
            @PathVariable String reliability) {
        log.info("GET /api/combo-signals/reliability/{} - Fetching combo signals by reliability", reliability);
        List<ComboSignalDTO> signals = comboSignalService.getComboSignalsByReliability(reliability);
        return ResponseEntity.ok(Response.success(signals));
    }
}
