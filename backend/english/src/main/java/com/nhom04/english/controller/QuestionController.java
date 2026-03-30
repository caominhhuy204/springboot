package com.nhom04.english.controller;

import com.nhom04.english.dto.QuestionDto;
import com.nhom04.english.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @PostMapping("/assignments/{assignmentId}/questions")
    public ResponseEntity<QuestionDto> addQuestionToAssignment(@PathVariable Long assignmentId, @RequestBody QuestionDto dto) {
        return ResponseEntity.ok(questionService.addQuestionToAssignment(assignmentId, dto));
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<QuestionDto> updateQuestion(@PathVariable Long id, @RequestBody QuestionDto dto) {
        return ResponseEntity.ok(questionService.updateQuestion(id, dto));
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }
}
