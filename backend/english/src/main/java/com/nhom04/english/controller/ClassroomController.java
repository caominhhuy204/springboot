package com.nhom04.english.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nhom04.english.dto.ClassroomRequest;
import com.nhom04.english.dto.JoinClassroomRequest;
import com.nhom04.english.service.ClassroomService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> createClassroom(@RequestBody ClassroomRequest request, Authentication authentication) {
        return ResponseEntity.ok(classroomService.create(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> updateClassroom(
            @PathVariable Long id,
            @RequestBody ClassroomRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(classroomService.update(id, request, authentication.getName()));
    }

    @PostMapping("/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> joinClassroom(@RequestBody JoinClassroomRequest request, Authentication authentication) {
        return ResponseEntity.ok(classroomService.joinByCode(request, authentication.getName()));
    }

    @PutMapping("/{id}/teacher/{teacherId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignTeacher(
            @PathVariable Long id,
            @PathVariable Long teacherId) {
        return ResponseEntity.ok(classroomService.assignTeacher(id, teacherId));
    }

    @PostMapping("/{id}/students/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addStudent(
            @PathVariable Long id,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(classroomService.addStudent(id, studentId));
    }

    @DeleteMapping("/{id}/students/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> removeStudent(
            @PathVariable Long id,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(classroomService.removeStudent(id, studentId));
    }

    @GetMapping
    public ResponseEntity<?> getClassrooms(Authentication authentication) {
        return ResponseEntity.ok(classroomService.getAllClassrooms(authentication.getName()));
    }

    @GetMapping("/invitations")
    @PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
    public ResponseEntity<?> getMyInvitations(Authentication authentication) {
        return ResponseEntity.ok(classroomService.getMyInvitations(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getClassroomDetail(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(classroomService.getClassroom(id, authentication.getName()));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<?> getStudentsByClassroom(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(classroomService.getStudentsByClassroom(id, authentication.getName()));
    }

    @GetMapping("/{id}/teachers")
    public ResponseEntity<?> getTeachersByClassroom(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(classroomService.getTeachersByClassroom(id, authentication.getName()));
    }

    @PostMapping("/{id}/invite/students/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> inviteStudent(
            @PathVariable Long id,
            @PathVariable Long studentId,
            Authentication authentication) {
        return ResponseEntity.ok(classroomService.inviteStudent(id, studentId, authentication.getName()));
    }

    @PostMapping("/{id}/invite/teachers/{teacherId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> inviteTeacher(
            @PathVariable Long id,
            @PathVariable Long teacherId,
            Authentication authentication) {
        return ResponseEntity.ok(classroomService.inviteTeacher(id, teacherId, authentication.getName()));
    }

    @PostMapping("/{id}/accept-invitation")
    @PreAuthorize("hasAnyRole('STUDENT','TEACHER')")
    public ResponseEntity<?> acceptInvitation(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(classroomService.acceptInvitation(id, authentication.getName()));
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
