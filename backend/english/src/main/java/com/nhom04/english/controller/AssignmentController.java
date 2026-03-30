package com.nhom04.english.controller;

import com.nhom04.english.dto.AssignmentDto;
import com.nhom04.english.dto.AssignmentRequestDto;
import com.nhom04.english.service.AssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    @Autowired
    private AssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<AssignmentDto> createAssignment(@RequestBody AssignmentRequestDto dto) {
        return ResponseEntity.ok(assignmentService.createAssignment(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssignmentDto> updateAssignment(@PathVariable Long id, @RequestBody AssignmentRequestDto dto) {
        return ResponseEntity.ok(assignmentService.updateAssignment(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<AssignmentDto>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @PostMapping("/{id}/assign/{classroomId}")
    public ResponseEntity<AssignmentDto> assignToClassroom(@PathVariable Long id, @PathVariable Long classroomId) {
        return ResponseEntity.ok(assignmentService.assignToClassroom(id, classroomId));
    }
}
