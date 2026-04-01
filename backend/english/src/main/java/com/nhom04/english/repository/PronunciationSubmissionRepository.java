package com.nhom04.english.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nhom04.english.entity.PronunciationSubmission;

public interface PronunciationSubmissionRepository extends JpaRepository<PronunciationSubmission, Long> {
    List<PronunciationSubmission> findByExerciseIdOrderBySubmittedAtDescIdDesc(Long exerciseId);

    List<PronunciationSubmission> findByExerciseIdAndStudentIdOrderBySubmittedAtDescIdDesc(Long exerciseId, Long studentId);

    long countByExerciseIdAndStudentId(Long exerciseId, Long studentId);
}
