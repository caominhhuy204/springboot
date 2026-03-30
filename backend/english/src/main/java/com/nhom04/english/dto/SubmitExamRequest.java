package com.nhom04.english.dto;

import lombok.Data;
import java.util.List;

@Data
public class SubmitExamRequest {
    private List<QuestionAnswerRequest> answers;
}
