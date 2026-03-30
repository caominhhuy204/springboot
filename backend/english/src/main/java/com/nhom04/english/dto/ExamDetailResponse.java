package com.nhom04.english.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class ExamDetailResponse {
    private Long id;
    private String title;
    private String description;
    private int timeLimitMinutes;
    private List<QuestionResponse> questions;
}
