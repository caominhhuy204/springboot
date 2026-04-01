package com.nhom04.english.controller;

import com.nhom04.english.dto.*;
import com.nhom04.english.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    @PostMapping("/{id}/submit")
    public ResponseEntity<SubmitResponse> submitExam(@PathVariable Long id, @RequestBody SubmitRequest request, Authentication authentication) {
        return ResponseEntity.ok(examService.submitExam(id, authentication.getName(), request.getAnswers()));
    }

    @GetMapping("/history")
    public ResponseEntity<List<HistoryResponse>> getHistory(Authentication authentication) {
        return ResponseEntity.ok(examService.getHistory(authentication.getName()));
    }

    @GetMapping("/progress")
    public ResponseEntity<Map<String, Object>> getProgress(Authentication authentication) {
        return ResponseEntity.ok(examService.getStudentProgress(authentication.getName()));
    }

    @GetMapping("/classrooms/{id}/progress")
    public ResponseEntity<List<Map<String, Object>>> getClassroomProgress(@PathVariable Long id) {
        return ResponseEntity.ok(examService.getClassroomProgress(id));
    }

    @PostMapping("/submissions/{id}/feedback")
    public ResponseEntity<Void> addFeedback(@PathVariable Long id, @RequestBody Map<String, String> body) {
        examService.addFeedback(id, body.get("feedback"));
        return ResponseEntity.ok().build();
    }
}
