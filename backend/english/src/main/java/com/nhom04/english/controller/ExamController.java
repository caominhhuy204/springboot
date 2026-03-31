package com.nhom04.english.controller;

import com.nhom04.english.dto.SubmitExamRequest;
import com.nhom04.english.entity.User;
import com.nhom04.english.repository.UserRepository;
import com.nhom04.english.service.ExamService;
import com.nhom04.english.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final SubmissionService submissionService;
    private final ExamService examService;
    private final UserRepository userRepository;

    @GetMapping("/{examId}")
    public ResponseEntity<?> getExam(@PathVariable Long examId, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(examService.getExamDetail(examId));
    }

    @PostMapping("/{examId}/submit")
    public ResponseEntity<?> submitExam(
            @PathVariable Long examId,
            @RequestBody SubmitExamRequest request,
            Authentication authentication) {
            
        if (authentication == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(submissionService.submitExam(user.getId(), examId, request));
    }

    @GetMapping("/history")
    public ResponseEntity<?> getSubmissionHistory(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(submissionService.getSubmissionHistory(user.getId()));
    }
}
