package com.projetee.sallesmangement.dto.ml;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

/**
 * DTO pour la réponse du chat
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private String response;
    private String conversationId;
    private String intent;
    private Double confidence;
    private List<Map<String, Object>> suggestedActions;
    private Boolean llmUsed;
    private String error;
}
