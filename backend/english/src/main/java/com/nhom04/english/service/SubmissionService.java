package com.nhom04.english.service;

import com.nhom04.english.dto.QuestionAnswerRequest;
import com.nhom04.english.dto.SubmissionHistoryResponse;
import com.nhom04.english.dto.SubmissionResultResponse;
import com.nhom04.english.dto.SubmitExamRequest;
import com.nhom04.english.entity.*;
import com.nhom04.english.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;

    @Transactional
    public SubmissionResultResponse submitExam(Long userId, Long examId, SubmitExamRequest request) {
        User student = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        Submission submission = new Submission();
        submission.setStudent(student);
        submission.setExam(exam);
        submission.setSubmitTime(LocalDateTime.now());
        
        List<SubmissionAnswer> submissionAnswers = new ArrayList<>();
        double totalScore = 0.0;
        int correctCount = 0;
        int totalQuestions = request.getAnswers().size();

        for (QuestionAnswerRequest qa : request.getAnswers()) {
            Question question = questionRepository.findById(qa.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found"));

            if (!question.getExam().getId().equals(examId)) {
                throw new RuntimeException("Question does not belong to this exam");
            }

            SubmissionAnswer answer = new SubmissionAnswer();
            answer.setSubmission(submission);
            answer.setQuestion(question);
            answer.setStudentAnswer(qa.getStudentAnswer());

            boolean isCorrect = gradeAnswer(question, qa.getStudentAnswer());
            answer.setCorrect(isCorrect);

            if (isCorrect) {
                answer.setScoreAchieved(question.getPoints());
                totalScore += question.getPoints();
                correctCount++;
            } else {
                answer.setScoreAchieved(0.0);
            }

            submissionAnswers.add(answer);
        }

        submission.setTotalScore(totalScore);
        submission.setAnswers(submissionAnswers);
        
        // Save cascade
        Submission savedSubmission = submissionRepository.save(submission);

        return SubmissionResultResponse.builder()
                .submissionId(savedSubmission.getId())
                .examId(examId)
                .totalScore(totalScore)
                .submitTime(savedSubmission.getSubmitTime().toString())
                .correctAnswersCount(correctCount)
                .totalQuestionsCount(totalQuestions)
                .build();
    }

    private boolean gradeAnswer(Question question, String studentAnswer) {
        if (studentAnswer == null || studentAnswer.trim().isEmpty()) {
            return false;
        }
        
        String correct = question.getCorrectAnswer();
        
        // Chấm điểm điền từ hoặc trắc nghiệm: Normalize string (bỏ khoảng trắng đầu đuôi, ignore case)
        String normStudent = studentAnswer.trim().toLowerCase();
        String normCorrect = correct.trim().toLowerCase();
        
        return normStudent.equals(normCorrect);
    }

    public List<SubmissionHistoryResponse> getSubmissionHistory(Long userId) {
        List<Submission> submissions = submissionRepository.findByStudentId(userId);
        return submissions.stream().map(sub -> SubmissionHistoryResponse.builder()
                .submissionId(sub.getId())
                .examId(sub.getExam().getId())
                .examTitle(sub.getExam().getTitle())
                .totalScore(sub.getTotalScore())
                .submitTime(sub.getSubmitTime().toString())
                .build()
        ).collect(Collectors.toList());
    }
}
