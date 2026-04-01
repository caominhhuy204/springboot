package com.nhom04.english.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PronunciationReviewRequest {

    @NotNull
    @Min(0)
    @Max(100)
    private Integer teacherScore;

    private String teacherFeedback;
}
