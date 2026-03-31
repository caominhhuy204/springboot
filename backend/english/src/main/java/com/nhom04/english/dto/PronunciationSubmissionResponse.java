package com.nhom04.english.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PronunciationSubmissionResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String audioUrl;
    private String originalFilename;
    private Long fileSizeBytes;
    private Double durationSeconds;
    private Integer attemptNumber;
    private Integer autoCompletenessScore;
    private Integer autoFluencyScore;
    private Integer autoConsistencyScore;
    private Integer autoOverallScore;
    private String autoFeedback;
    private Integer teacherScore;
    private String teacherFeedback;
    private String reviewedByName;
    private String reviewStatus;
    private java.time.LocalDateTime reviewedAt;
    private LocalDateTime submittedAt;
}
