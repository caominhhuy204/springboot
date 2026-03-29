package com.nhom04.english.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nhom04.english.dto.ClassroomRequest;
import com.nhom04.english.service.ClassroomService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> createClassroom(@RequestBody ClassroomRequest request) {
        return ResponseEntity.ok(classroomService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> updateClassroom(@PathVariable Long id, @RequestBody ClassroomRequest request) {
        return ResponseEntity.ok(classroomService.update(id, request));
    }

    @PutMapping("/{id}/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> assignTeacher(
            @PathVariable Long id,
            @PathVariable Long teacherId) {
        return ResponseEntity.ok(classroomService.assignTeacher(id, teacherId));
    }

    @PostMapping("/{id}/students/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> addStudent(
            @PathVariable Long id,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(classroomService.addStudent(id, studentId));
    }

    @DeleteMapping("/{id}/students/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> removeStudent(
            @PathVariable Long id,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(classroomService.removeStudent(id, studentId));
    }

    @GetMapping
    public ResponseEntity<?> getClassrooms() {
        return ResponseEntity.ok(classroomService.getAllClassrooms());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getClassroomDetail(@PathVariable Long id) {
        return ResponseEntity.ok(classroomService.getClassroom(id));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<?> getStudentsByClassroom(@PathVariable Long id) {
        return ResponseEntity.ok(classroomService.getStudentsByClassroom(id));
    }

    @GetMapping("/teachers")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> getTeacherCandidates() {
        return ResponseEntity.ok(classroomService.getAllTeachers());
    }

    @GetMapping("/students")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> getStudentCandidates() {
        return ResponseEntity.ok(classroomService.getAllStudents());
    }
}
