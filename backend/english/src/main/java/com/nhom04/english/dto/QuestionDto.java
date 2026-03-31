package com.nhom04.english.dto;

import com.nhom04.english.entity.QuestionType;
import lombok.Data;

@Data
public class QuestionDto {
    private Long id;
    private String content;
    private QuestionType type;
    private String options;
    private String correctAnswer;
    private double points;
}
