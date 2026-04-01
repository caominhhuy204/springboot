package com.nhom04.english.dto;

import lombok.Data;

@Data
public class SubmitResponse {
    private Long submissionId;
    private Long examId;
    private Integer totalScore;
    private String submitTime;
    private Integer correctAnswersCount;
    private Integer totalQuestionsCount;
}
