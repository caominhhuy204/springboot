package com.nhom04.english.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubmissionResultResponse {
    private Long submissionId;
    private Long examId;
    private double totalScore;
    private String submitTime;
    private int correctAnswersCount;
    private int totalQuestionsCount;
}
