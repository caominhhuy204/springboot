package com.nhom04.english.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PronunciationExerciseResponse {
    private Long id;
    private Long classroomId;
    private String classroomName;
    private String title;
    private String referenceText;
    private String description;
    private String focusSkill;
    private Integer difficultyLevel;
    private Integer maxAttempts;
    private Integer submissionCount;
    private LocalDateTime createdAt;
    private String createdByName;
    private List<PronunciationSubmissionResponse> submissions;
}
