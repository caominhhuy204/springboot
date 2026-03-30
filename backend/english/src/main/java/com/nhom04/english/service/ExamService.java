package com.nhom04.english.service;

import com.nhom04.english.dto.ExamDetailResponse;
import com.nhom04.english.dto.QuestionResponse;
import com.nhom04.english.entity.Exam;
import com.nhom04.english.repository.ExamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;

    public ExamDetailResponse getExamDetail(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        return ExamDetailResponse.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .timeLimitMinutes(exam.getTimeLimitMinutes())
                .questions(exam.getQuestions().stream().map(q -> QuestionResponse.builder()
                        .id(q.getId())
                        .content(q.getContent())
                        .type(q.getType())
                        .options(q.getOptions())
                        .points(q.getPoints())
                        // CHÚ Ý: KHÔNG copy correctAnswer vào DTO để tránh lộ đáp án
                        .build()).collect(Collectors.toList()))
                .build();
    }
}
