package com.nhom04.english.controller;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nhom04.english.dto.PronunciationExerciseRequest;
import com.nhom04.english.dto.PronunciationReviewRequest;
import com.nhom04.english.service.PronunciationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/pronunciation")
@RequiredArgsConstructor
@Validated
public class PronunciationController {

    private final PronunciationService pronunciationService;

    @GetMapping("/classrooms/{classroomId}/exercises")
    public ResponseEntity<?> getExercises(@PathVariable Long classroomId, Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.getExercisesByClassroom(classroomId, authentication.getName()));
    }

    @PostMapping("/classrooms/{classroomId}/exercises")
    public ResponseEntity<?> createExercise(
            @PathVariable Long classroomId,
            @Valid @RequestBody PronunciationExerciseRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.createExercise(classroomId, request, authentication.getName()));
    }

    @GetMapping("/exercises/{exerciseId}")
    public ResponseEntity<?> getExercise(@PathVariable Long exerciseId, Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.getExercise(exerciseId, authentication.getName()));
    }

    @PutMapping("/exercises/{exerciseId}")
    public ResponseEntity<?> updateExercise(
            @PathVariable Long exerciseId,
            @Valid @RequestBody PronunciationExerciseRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.updateExercise(exerciseId, request, authentication.getName()));
    }

    @DeleteMapping("/exercises/{exerciseId}")
    public ResponseEntity<Void> deleteExercise(@PathVariable Long exerciseId, Authentication authentication) {
        pronunciationService.deleteExercise(exerciseId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/exercises/{exerciseId}/submissions")
    public ResponseEntity<?> getSubmissions(@PathVariable Long exerciseId, Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.getSubmissions(exerciseId, authentication.getName()));
    }

    @PostMapping("/exercises/{exerciseId}/submissions")
    public ResponseEntity<?> submit(
            @PathVariable Long exerciseId,
            @RequestParam("audio") MultipartFile audio,
            @RequestParam("durationSeconds") Double durationSeconds,
            Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.submit(exerciseId, audio, durationSeconds, authentication.getName()));
    }

    @PutMapping("/submissions/{submissionId}/review")
    public ResponseEntity<?> reviewSubmission(
            @PathVariable Long submissionId,
            @Valid @RequestBody PronunciationReviewRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(pronunciationService.reviewSubmission(submissionId, request, authentication.getName()));
    }

    @GetMapping("/submissions/{submissionId}/audio")
    public ResponseEntity<Resource> serveAudio(@PathVariable Long submissionId, Authentication authentication) {
        return pronunciationService.serveAudio(submissionId, authentication.getName());
    }
}
