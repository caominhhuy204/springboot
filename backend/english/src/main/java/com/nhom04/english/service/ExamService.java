package com.nhom04.english.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nhom04.english.dto.*;
import com.nhom04.english.entity.*;
import com.nhom04.english.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final PronunciationSubmissionRepository pronunciationSubmissionRepository;
    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public AssignmentDto getExamDetail(Long assignmentId, String currentUserEmail) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ensureCanAccessAssignment(assignment, currentUser);

        AssignmentDto response = new AssignmentDto();
        response.setId(assignment.getId());
        response.setTitle(assignment.getTitle());
        response.setDescription(assignment.getDescription());
        response.setClassrooms(assignment.getClassrooms().stream()
                .map(classroom -> new ClassroomDto(classroom.getId(), classroom.getName()))
                .collect(Collectors.toList()));
        response.setQuestions(assignment.getQuestions().stream().map(question -> {
            QuestionDto dto = new QuestionDto();
            dto.setId(question.getId());
            dto.setContent(question.getContent());
            dto.setType(question.getType());
            dto.setOptions(question.getOptions());
            dto.setCorrectAnswer(question.getCorrectAnswer());
            dto.setPoints(question.getPoints());
            return dto;
        }).collect(Collectors.toList()));
        return response;
    }

    @Transactional
    public SubmitResponse submitExam(Long assignmentId, String studentEmail, List<AnswerPayload> answers) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        ensureCanAccessAssignment(assignment, student);

        int totalCorrect = 0;
        int totalScore = 0;
        int totalQuestions = assignment.getQuestions().size();

        Map<Long, Question> questionMap = assignment.getQuestions().stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        for (AnswerPayload answer : answers) {
            Question q = questionMap.get(answer.getQuestionId());
            if (q != null) {
                if (isCorrect(q, answer.getStudentAnswer())) {
                    totalCorrect++;
                    totalScore += q.getPoints();
                }
            }
        }

        Submission submission = new Submission();
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setTotalScore(totalScore);
        submission.setCorrectAnswersCount(totalCorrect);
        submission.setTotalQuestionsCount(totalQuestions);
        try {
            submission.setStudentAnswersJson(objectMapper.writeValueAsString(answers));
        } catch (Exception e) {
            submission.setStudentAnswersJson("[]");
        }
        
        Submission saved = submissionRepository.save(submission);

        SubmitResponse response = new SubmitResponse();
        response.setSubmissionId(saved.getId());
        response.setExamId(assignmentId);
        response.setTotalScore(totalScore);
        response.setSubmitTime(saved.getSubmittedAt().toString());
        response.setCorrectAnswersCount(totalCorrect);
        response.setTotalQuestionsCount(totalQuestions);

        return response;
    }

    private boolean isCorrect(Question q, String studentAnswer) {
        if (q.getCorrectAnswer() == null || studentAnswer == null) return false;
        return q.getCorrectAnswer().trim().equalsIgnoreCase(studentAnswer.trim());
    }

    public List<HistoryResponse> getHistory(String requesterEmail, String targetStudentEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String resolvedEmail = requesterEmail;
        if (targetStudentEmail != null && !targetStudentEmail.isBlank()) {
            if (requester.getRole().getName() != Role.RoleName.ADMIN
                    && requester.getRole().getName() != Role.RoleName.TEACHER) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to view this history");
            }
            resolvedEmail = targetStudentEmail;
        }

        User student = userRepository.findByEmail(resolvedEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return submissionRepository.findByStudentOrderBySubmittedAtDesc(student).stream()
                .map(s -> {
                    HistoryResponse res = new HistoryResponse();
                    res.setSubmissionId(s.getId());
                    res.setExamId(s.getAssignment().getId());
                    res.setExamTitle(s.getAssignment().getTitle());
                    res.setTotalScore(s.getTotalScore());
                    res.setSubmitTime(s.getSubmittedAt().toString());
                    res.setTeacherFeedback(s.getTeacherFeedback());
                    return res;
                }).collect(Collectors.toList());
    }

    public Map<String, Object> getStudentProgress(String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        List<Submission> submissions = submissionRepository.findByStudentOrderBySubmittedAtDesc(student);
        List<PronunciationSubmission> proSubmissions = pronunciationSubmissionRepository.findByStudentAndReviewStatusOrderBySubmittedAtDesc(student, PronunciationReviewStatus.REVIEWED);

        double avgScore = 0;
        int totalSubmissions = submissions.size() + proSubmissions.size();
        
        if (totalSubmissions > 0) {
            int sumScores = submissions.stream().mapToInt(Submission::getTotalScore).sum()
                         + proSubmissions.stream().mapToInt(PronunciationSubmission::getAutoOverallScore).sum();
            avgScore = (double) sumScores / totalSubmissions;
        }

        return Map.of(
            "totalRegularSubmissions", submissions.size(),
            "totalPronunciationSubmissions", proSubmissions.size(),
            "averageScore", Math.round(avgScore * 100.0) / 100.0,
            "recentFeedback", getRecentFeedback(submissions, proSubmissions)
        );
    }

    private List<String> getRecentFeedback(List<Submission> submissions, List<PronunciationSubmission> proSubmissions) {
        List<String> feedbacks = new ArrayList<>();
        submissions.stream()
            .filter(s -> s.getTeacherFeedback() != null)
            .limit(3)
            .forEach(s -> feedbacks.add("Assignment: " + s.getAssignment().getTitle() + " - " + s.getTeacherFeedback()));
        proSubmissions.stream()
            .filter(s -> s.getTeacherFeedback() != null)
            .limit(3)
            .forEach(s -> feedbacks.add("Pronunciation: " + s.getExercise().getTitle() + " - " + s.getTeacherFeedback()));
        return feedbacks;
    }

    @Transactional
    public void addFeedback(Long submissionId, String feedback) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
        submission.setTeacherFeedback(feedback);
        submissionRepository.save(submission);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getClassroomProgress(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));
        return classroom.getStudents().stream().map(student -> {
            Map<String, Object> stats = new java.util.HashMap<>(getStudentProgress(student.getEmail()));
            stats.put("studentId", student.getId());
            stats.put("studentName", student.getFullname());
            stats.put("studentEmail", student.getEmail());
            return stats;
        }).collect(Collectors.toList());
    }

    private void ensureCanAccessAssignment(Assignment assignment, User user) {
        Role.RoleName roleName = user.getRole().getName();
        if (roleName == Role.RoleName.ADMIN || roleName == Role.RoleName.TEACHER) {
            return;
        }

        boolean assignedToStudent = assignment.getClassrooms().stream()
                .anyMatch(classroom -> classroom.getStudents().stream()
                        .anyMatch(student -> Objects.equals(student.getId(), user.getId())));

        if (!assignedToStudent) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to access this assignment");
        }
    }
}
