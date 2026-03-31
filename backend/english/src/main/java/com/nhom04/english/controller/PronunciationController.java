package com.nhom04.english.controller;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.nhom04.english.dto.PronunciationExerciseRequest;
import com.nhom04.english.dto.PronunciationReviewRequest;
import com.nhom04.english.service.PronunciationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/pronunciation")
@RequiredArgsConstructor
public class PronunciationController {

    private final PronunciationService pronunciationService;

    @GetMapping("/classrooms/{classroomId}/exercises")
    public ResponseEntity<?> getExercisesByClassroom(@PathVariable Long classroomId, Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.getExercisesByClassroom(classroomId, authentication.getName()));
    }

    @PostMapping("/classrooms/{classroomId}/exercises")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> createExercise(
            @PathVariable Long classroomId,
            @RequestBody PronunciationExerciseRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.createExercise(classroomId, request, authentication.getName()));
    }

    @PutMapping("/exercises/{exerciseId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> updateExercise(
            @PathVariable Long exerciseId,
            @RequestBody PronunciationExerciseRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.updateExercise(exerciseId, request, authentication.getName()));
    }

    @DeleteMapping("/exercises/{exerciseId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> deleteExercise(@PathVariable Long exerciseId, Authentication authentication) {
        pronunciationService.deleteExercise(exerciseId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/exercises/{exerciseId}")
    public ResponseEntity<?> getExerciseDetail(@PathVariable Long exerciseId, Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.getExerciseDetail(exerciseId, authentication.getName()));
    }

    @GetMapping("/exercises/{exerciseId}/submissions")
    public ResponseEntity<?> getExerciseSubmissions(@PathVariable Long exerciseId, Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.getExerciseSubmissions(exerciseId, authentication.getName()));
    }

    @PostMapping(value = "/exercises/{exerciseId}/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitAudio(
            @PathVariable Long exerciseId,
            @RequestPart("audio") MultipartFile audio,
            @RequestParam("durationSeconds") Double durationSeconds,
            Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.submitAudio(exerciseId, audio, durationSeconds, authentication.getName()));
    }

    @PutMapping("/submissions/{submissionId}/review")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public ResponseEntity<?> reviewSubmission(
            @PathVariable Long submissionId,
            @RequestBody PronunciationReviewRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.reviewSubmission(submissionId, request, authentication.getName()));
    }

    @GetMapping("/submissions/{submissionId}/audio")
    public ResponseEntity<Resource> downloadAudio(@PathVariable Long submissionId, Authentication authentication) {
        Resource resource = pronunciationService.getSubmissionAudio(submissionId, authentication.getName());
        String filename = pronunciationService.buildAudioDownloadFilename(submissionId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }
}
