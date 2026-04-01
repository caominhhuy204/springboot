package com.nhom04.english.dto;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PronunciationExerciseResponse {
    private Long id;
    private Long classroomId;
    private String classroomName;
    private List<Long> classroomIds;
    private List<String> classroomNames;
    private String title;
    private String referenceText;
    private String description;
    private String focusSkill;
    private Integer difficultyLevel;
    private Integer maxAttempts;
    private Integer submissionCount;
    private String createdAt;
    private String createdByName;
    private List<PronunciationSubmissionResponse> submissions;
}
