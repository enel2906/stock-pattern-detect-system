package com.example.alert.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

/**
 * AlertSetting - Lưu trạng thái bật/tắt combo signal của user
 * Khi user bật combo -> tạo bản ghi mới
 * Khi user tắt combo -> xóa bản ghi
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "alert_settings")
@CompoundIndexes({
    @CompoundIndex(name = "user_combo_idx", def = "{'user_id': 1, 'combo_signal_id': 1}", unique = true)
})
public class AlertSetting {
    
    @Id
    private String id;
    
    @Indexed
    @Field("user_id")
    private String userId;
    
    /**
     * Reference đến ComboSignal.comboId
     */
    @Field("combo_signal_id")
    private String comboSignalId;
    
    @Field("created_at")
    private LocalDateTime createdAt;
}
