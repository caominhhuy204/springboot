package com.nhom04.english.dto;

import lombok.Data;

@Data
public class QuestionAnswerRequest {
    private Long questionId;
    private String studentAnswer;
}
