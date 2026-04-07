package com.nhom04.english.controller;

import com.nhom04.english.dto.AssignClassroomsRequest;
import com.nhom04.english.dto.AssignmentDto;
import com.nhom04.english.dto.QuestionDto;
import com.nhom04.english.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping
    public ResponseEntity<List<AssignmentDto>> getAllAssignments(Authentication authentication) {
        return ResponseEntity.ok(assignmentService.getAllAssignments(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssignmentDto> getAssignment(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(assignmentService.getAssignment(id, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<AssignmentDto> createAssignment(@RequestBody AssignmentDto dto, Authentication authentication) {
        return ResponseEntity.ok(assignmentService.createAssignment(dto, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssignmentDto> updateAssignment(@PathVariable Long id, @RequestBody AssignmentDto dto, Authentication authentication) {
        return ResponseEntity.ok(assignmentService.updateAssignment(id, dto, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id, Authentication authentication) {
        assignmentService.deleteAssignment(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/classrooms")
    public ResponseEntity<Void> assignToClassrooms(@PathVariable Long id, @RequestBody AssignClassroomsRequest request, Authentication authentication) {
        assignmentService.assignToClassrooms(id, request.getClassroomIds(), authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<List<QuestionDto>> getQuestions(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(assignmentService.getQuestionsByAssignmentId(id, authentication.getName()));
    }

    @PostMapping("/{id}/questions")
    public ResponseEntity<QuestionDto> addQuestion(@PathVariable Long id, @RequestBody QuestionDto dto, Authentication authentication) {
        return ResponseEntity.ok(assignmentService.addQuestion(id, dto, authentication.getName()));
    }

    @PutMapping("/{id}/questions/{questionId}")
    public ResponseEntity<QuestionDto> updateQuestion(@PathVariable Long id, @PathVariable Long questionId, @RequestBody QuestionDto dto, Authentication authentication) {
        return ResponseEntity.ok(assignmentService.updateQuestion(id, questionId, dto, authentication.getName()));
    }

    @DeleteMapping("/{id}/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id, @PathVariable Long questionId, Authentication authentication) {
        assignmentService.deleteQuestion(id, questionId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
