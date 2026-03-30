package com.nhom04.english.dto;

import com.nhom04.english.entity.QuestionType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuestionResponse {
    private Long id;
    private String content;
    private QuestionType type;
    private String options;
    private double points;
}
