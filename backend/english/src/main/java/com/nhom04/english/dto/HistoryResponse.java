package com.nhom04.english.dto;

import lombok.Data;

@Data
public class HistoryResponse {
    private Long submissionId;
    private Long examId;
    private String examTitle;
    private Integer totalScore;
    private String submitTime;
    private String teacherFeedback;
}
