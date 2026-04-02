package com.nhom04.english.controller;

import com.nhom04.english.dto.AssignClassroomsRequest;
import com.nhom04.english.dto.AssignmentDto;
import com.nhom04.english.dto.QuestionDto;
import com.nhom04.english.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping
    public ResponseEntity<List<AssignmentDto>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssignmentDto> getAssignment(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getAssignment(id));
    }

    @PostMapping
    public ResponseEntity<AssignmentDto> createAssignment(@RequestBody AssignmentDto dto) {
        return ResponseEntity.ok(assignmentService.createAssignment(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssignmentDto> updateAssignment(@PathVariable Long id, @RequestBody AssignmentDto dto) {
        return ResponseEntity.ok(assignmentService.updateAssignment(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/classrooms")
    public ResponseEntity<Void> assignToClassrooms(@PathVariable Long id, @RequestBody AssignClassroomsRequest request) {
        assignmentService.assignToClassrooms(id, request.getClassroomIds());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<List<QuestionDto>> getQuestions(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getQuestionsByAssignmentId(id));
    }

    @PostMapping("/{id}/questions")
    public ResponseEntity<QuestionDto> addQuestion(@PathVariable Long id, @RequestBody QuestionDto dto) {
        return ResponseEntity.ok(assignmentService.addQuestion(id, dto));
    }

    @PutMapping("/{id}/questions/{questionId}")
    public ResponseEntity<QuestionDto> updateQuestion(@PathVariable Long id, @PathVariable Long questionId, @RequestBody QuestionDto dto) {
        return ResponseEntity.ok(assignmentService.updateQuestion(questionId, dto));
    }

    @DeleteMapping("/{id}/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id, @PathVariable Long questionId) {
        assignmentService.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }
}
