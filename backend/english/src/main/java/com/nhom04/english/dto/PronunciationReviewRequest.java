package com.nhom04.english.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PronunciationReviewRequest {
    
    @NotNull(message = "Teacher score is required")
    @Min(value = 0, message = "Teacher score must be at least 0")
    @Max(value = 100, message = "Teacher score cannot exceed 100")
    private Integer teacherScore;
    
    private String teacherFeedback;
}
