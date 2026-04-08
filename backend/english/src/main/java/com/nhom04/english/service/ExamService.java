package com.nhom04.english.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nhom04.english.dto.AnswerPayload;
import com.nhom04.english.dto.AssignmentDto;
import com.nhom04.english.dto.ClassroomDto;
import com.nhom04.english.dto.HistoryResponse;
import com.nhom04.english.dto.QuestionDto;
import com.nhom04.english.dto.SubmitResponse;
import com.nhom04.english.entity.Assignment;
import com.nhom04.english.entity.Classroom;
import com.nhom04.english.entity.PronunciationReviewStatus;
import com.nhom04.english.entity.PronunciationSubmission;
import com.nhom04.english.entity.Question;
import com.nhom04.english.entity.Role;
import com.nhom04.english.entity.Submission;
import com.nhom04.english.entity.User;
import com.nhom04.english.repository.AssignmentRepository;
import com.nhom04.english.repository.ClassroomRepository;
import com.nhom04.english.repository.PronunciationSubmissionRepository;
import com.nhom04.english.repository.SubmissionRepository;
import com.nhom04.english.repository.UserRepository;
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
        Assignment assignment = assignmentRepository.findByIdAndDeletedAtIsNull(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ensureCanAccessAssignment(assignment, currentUser);

        int maxAttempts = assignment.getMaxAttempts() == null || assignment.getMaxAttempts() < 1 ? 1 : assignment.getMaxAttempts();
        if (currentUser.getRole().getName() == Role.RoleName.STUDENT) {
            long currentAttempts = submissionRepository.countByAssignmentIdAndStudentId(assignmentId, currentUser.getId());
            if (assignment.getDueAt() != null && LocalDateTime.now().isAfter(assignment.getDueAt())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bài tập này đã quá hạn làm bài");
            }
            if (currentAttempts >= maxAttempts) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn đã dùng hết số lần làm bài này");
            }
        }

        AssignmentDto response = new AssignmentDto();
        response.setId(assignment.getId());
        response.setTitle(assignment.getTitle());
        response.setDescription(assignment.getDescription());
        response.setMaxAttempts(maxAttempts);
        response.setTimeLimitMinutes(assignment.getTimeLimitMinutes());
        response.setDueAt(assignment.getDueAt());
        response.setCanManage(currentUser.getRole().getName() == Role.RoleName.ADMIN || currentUser.getRole().getName() == Role.RoleName.TEACHER);
        if (currentUser.getRole().getName() == Role.RoleName.STUDENT) {
            long currentAttempts = submissionRepository.countByAssignmentIdAndStudentId(assignmentId, currentUser.getId());
            response.setRemainingAttempts(Math.max(maxAttempts - (int) currentAttempts, 0));
        }
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
        Assignment assignment = assignmentRepository.findByIdAndDeletedAtIsNull(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        ensureCanAccessAssignment(assignment, student);

        if (assignment.getDueAt() != null && LocalDateTime.now().isAfter(assignment.getDueAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bài tập này đã quá hạn làm bài");
        }

        long currentAttempts = submissionRepository.countByAssignmentIdAndStudentId(assignmentId, student.getId());
        int maxAttempts = assignment.getMaxAttempts() == null || assignment.getMaxAttempts() < 1 ? 1 : assignment.getMaxAttempts();
        if (currentAttempts >= maxAttempts) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn đã dùng hết số lần làm bài này");
        }

        int totalCorrect = 0;
        int totalQuestions = assignment.getQuestions().size();

        Map<Long, Question> questionMap = assignment.getQuestions().stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        for (AnswerPayload answer : answers) {
            Question question = questionMap.get(answer.getQuestionId());
            if (question != null && isCorrect(question, answer.getStudentAnswer())) {
                totalCorrect++;
            }
        }

        double totalScore = totalQuestions == 0
                ? 0D
                : Math.round(((double) totalCorrect / totalQuestions) * 10D * 100D) / 100D;

        Submission submission = new Submission();
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setTotalScore(totalScore);
        submission.setCorrectAnswersCount(totalCorrect);
        submission.setTotalQuestionsCount(totalQuestions);
        try {
            submission.setStudentAnswersJson(objectMapper.writeValueAsString(answers));
        } catch (Exception exception) {
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
        response.setRemainingAttempts(Math.max(maxAttempts - (int) currentAttempts - 1, 0));
        return response;
    }

    private boolean isCorrect(Question question, String studentAnswer) {
        if (question.getCorrectAnswer() == null || studentAnswer == null) {
            return false;
        }
        return question.getCorrectAnswer().trim().equalsIgnoreCase(studentAnswer.trim());
    }

    @Transactional(readOnly = true)
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
        return submissionRepository.findByStudentOrderByCreatedAtDesc(student).stream()
                .map(submission -> {
                    HistoryResponse response = new HistoryResponse();
                    response.setSubmissionId(submission.getId());
                    response.setExamId(submission.getAssignment().getId());
                    response.setExamTitle(submission.getAssignment().getTitle());
                    response.setTotalScore(submission.getTotalScore());
                    response.setSubmitTime(submission.getSubmittedAt().toString());
                    response.setTeacherFeedback(submission.getTeacherFeedback());
                    return response;
                }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStudentProgress(String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Submission> submissions = submissionRepository.findByStudentOrderByCreatedAtDesc(student);
        List<PronunciationSubmission> pronunciationSubmissions =
                pronunciationSubmissionRepository.findByStudentOrderBySubmittedAtDescIdDesc(student);
        List<PronunciationSubmission> reviewedPronunciationSubmissions =
                pronunciationSubmissionRepository.findByStudentAndReviewStatusOrderBySubmittedAtDesc(student, PronunciationReviewStatus.REVIEWED);

        double avgScore = 0;
        int totalSubmissions = submissions.size() + pronunciationSubmissions.size();

        if (totalSubmissions > 0) {
            double sumScores = submissions.stream()
                    .map(Submission::getTotalScore)
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .sum()
                    + pronunciationSubmissions.stream()
                    .mapToDouble(submission -> {
                        Integer teacherScore = submission.getTeacherScore();
                        Integer autoScore = submission.getAutoOverallScore();
                        if (teacherScore != null) {
                            return teacherScore / 10.0;
                        }
                        return autoScore == null ? 0.0 : autoScore / 10.0;
                    })
                    .sum();
            avgScore = sumScores / totalSubmissions;
        }

        return Map.of(
                "totalRegularSubmissions", submissions.size(),
                "totalPronunciationSubmissions", pronunciationSubmissions.size(),
                "averageScore", Math.round(avgScore * 100.0) / 100.0,
                "recentFeedback", getRecentFeedback(submissions, reviewedPronunciationSubmissions)
        );
    }

    private List<String> getRecentFeedback(List<Submission> submissions, List<PronunciationSubmission> pronunciationSubmissions) {
        List<String> feedbacks = new ArrayList<>();
        submissions.stream()
                .filter(submission -> submission.getTeacherFeedback() != null && !submission.getTeacherFeedback().isBlank())
                .limit(3)
                .forEach(submission -> feedbacks.add("Assignment: " + submission.getAssignment().getTitle() + " - " + submission.getTeacherFeedback()));
        pronunciationSubmissions.stream()
                .filter(submission -> submission.getTeacherFeedback() != null && !submission.getTeacherFeedback().isBlank())
                .limit(3)
                .forEach(submission -> feedbacks.add("Pronunciation: " + submission.getExercise().getTitle() + " - " + submission.getTeacherFeedback()));
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
    public List<Map<String, Object>> getClassroomProgress(Long classroomId, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));
        ensureCanViewClassroomProgress(classroom, currentUser);
        return classroom.getStudents().stream().map(student -> {
            Map<String, Object> stats = new java.util.HashMap<>(getStudentProgress(student.getEmail()));
            stats.put("studentId", student.getId());
            stats.put("studentName", student.getFullname());
            stats.put("studentEmail", student.getEmail());
            return stats;
        }).collect(Collectors.toList());
    }

    private void ensureCanViewClassroomProgress(Classroom classroom, User currentUser) {
        Role.RoleName roleName = currentUser.getRole().getName();
        if (roleName == Role.RoleName.ADMIN) {
            return;
        }

        if (roleName == Role.RoleName.TEACHER && isTeacherManager(classroom, currentUser)) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to view classroom progress");
    }

    private boolean isTeacherManager(Classroom classroom, User currentUser) {
        if (classroom.getTeacher() != null && Objects.equals(classroom.getTeacher().getId(), currentUser.getId())) {
            return true;
        }

        return classroom.getTeachers().stream()
                .anyMatch(teacher -> Objects.equals(teacher.getId(), currentUser.getId()));
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
