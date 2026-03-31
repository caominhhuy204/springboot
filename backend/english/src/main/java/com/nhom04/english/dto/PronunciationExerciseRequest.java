package com.nhom04.english.dto;

import lombok.Data;

@Data
public class PronunciationExerciseRequest {
    private String title;
    private String referenceText;
    private String description;
    private String focusSkill;
    private Integer difficultyLevel;
    private Integer maxAttempts;
}
