package com.nhom04.english.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class PronunciationExerciseRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String referenceText;

    private String description;

    private String focusSkill;

    @Min(1)
    @Max(5)
    private Integer difficultyLevel;

    @Min(1)
    @Max(10)
    private Integer maxAttempts;

    private List<Long> classroomIds;
}
