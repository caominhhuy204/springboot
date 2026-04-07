package com.nhom04.english.dto;

import lombok.Data;

@Data
public class SubmitResponse {
    private Long submissionId;
    private Long examId;
    private Double totalScore;
    private String submitTime;
    private Integer correctAnswersCount;
    private Integer totalQuestionsCount;
    private Integer remainingAttempts;
}
