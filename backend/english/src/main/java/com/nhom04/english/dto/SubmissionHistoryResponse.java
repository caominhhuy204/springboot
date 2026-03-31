package com.nhom04.english.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubmissionHistoryResponse {
    private Long submissionId;
    private Long examId;
    private String examTitle;
    private double totalScore;
    private String submitTime;
}
