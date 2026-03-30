package com.nhom04.english.dto;

import com.nhom04.english.entity.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDto {
    private Long id;
    private String content;
    private QuestionType type;
    private List<String> options;
    private String correctAnswer;
}
