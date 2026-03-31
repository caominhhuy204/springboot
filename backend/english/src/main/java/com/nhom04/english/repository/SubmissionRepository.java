package com.nhom04.english.repository;

import com.nhom04.english.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByStudentId(Long studentId);
    List<Submission> findByExamId(Long examId);
    List<Submission> findByStudentIdAndExamId(Long studentId, Long examId);
}
