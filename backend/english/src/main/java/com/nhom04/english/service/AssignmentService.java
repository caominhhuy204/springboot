package com.nhom04.english.service;

import com.nhom04.english.dto.AssignmentDto;
import com.nhom04.english.dto.ClassroomDto;
import com.nhom04.english.dto.QuestionDto;
import com.nhom04.english.entity.Assignment;
import com.nhom04.english.entity.Classroom;
import com.nhom04.english.entity.Question;
import com.nhom04.english.entity.Role;
import com.nhom04.english.entity.User;
import com.nhom04.english.repository.AssignmentRepository;
import com.nhom04.english.repository.ClassroomRepository;
import com.nhom04.english.repository.QuestionRepository;
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
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final QuestionRepository questionRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;

    @Transactional(readOnly = true)
    public List<AssignmentDto> getAllAssignments(String currentUserEmail) {
        User currentUser = getRequiredUser(currentUserEmail);
        return assignmentRepository.findAllByDeletedAtIsNull().stream()
                .filter(assignment -> canViewAssignmentInList(currentUser, assignment))
                .map(assignment -> mapToDto(assignment, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssignmentDto getAssignment(Long id, String currentUserEmail) {
        User currentUser = getRequiredUser(currentUserEmail);
        Assignment assignment = findActiveAssignment(id);
        ensureCanViewAssignment(currentUser, assignment);
        return mapToDto(assignment, currentUser);
    }

    @Transactional
    public AssignmentDto createAssignment(AssignmentDto dto, String currentUserEmail) {
        User currentUser = getRequiredUser(currentUserEmail);
        ensureCanCreateAssignment(currentUser);
        validateAssignment(dto);

        Assignment assignment = new Assignment();
        assignment.setTitle(dto.getTitle());
        assignment.setDescription(dto.getDescription());
        assignment.setMaxAttempts(dto.getMaxAttempts() == null || dto.getMaxAttempts() < 1 ? 1 : dto.getMaxAttempts());
        assignment.setTimeLimitMinutes(dto.getTimeLimitMinutes());
        assignment.setDueAt(dto.getDueAt());
        assignment.setCreatedBy(currentUser);
        Assignment saved = assignmentRepository.save(assignment);
        return mapToDto(saved, currentUser);
    }

    @Transactional
    public AssignmentDto updateAssignment(Long id, AssignmentDto dto, String currentUserEmail) {
        User currentUser = getRequiredUser(currentUserEmail);
        Assignment assignment = findActiveAssignment(id);
        ensureCanManageAssignment(currentUser, assignment);
        validateAssignment(dto);

        assignment.setTitle(dto.getTitle());
        assignment.setDescription(dto.getDescription());
        assignment.setMaxAttempts(dto.getMaxAttempts() == null || dto.getMaxAttempts() < 1 ? 1 : dto.getMaxAttempts());
        assignment.setTimeLimitMinutes(dto.getTimeLimitMinutes());
        assignment.setDueAt(dto.getDueAt());
        Assignment saved = assignmentRepository.save(assignment);
        return mapToDto(saved, currentUser);
    }

    @Transactional
    public void deleteAssignment(Long id, String currentUserEmail) {
        User currentUser = getRequiredUser(currentUserEmail);
        Assignment assignment = findActiveAssignment(id);
        ensureCanManageAssignment(currentUser, assignment);

        assignment.setDeletedAt(LocalDateTime.now());
        assignment.setClassrooms(new ArrayList<>());
        assignmentRepository.save(assignment);
    }

    @Transactional
    public void assignToClassrooms(Long id, List<Long> classroomIds, String currentUserEmail) {
        User currentUser = getRequiredUser(currentUserEmail);
        if (classroomIds == null || classroomIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phải chọn ít nhất một lớp học");
        }

        Assignment assignment = findActiveAssignment(id);
        ensureCanManageAssignment(currentUser, assignment);

        List<Classroom> classrooms = classroomRepository.findAllById(classroomIds);
        if (classrooms.size() != classroomIds.stream().distinct().count()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Có lớp học không tồn tại trong danh sách được chọn");
        }

        if (currentUser.getRole().getName() == Role.RoleName.TEACHER) {
            boolean hasForbiddenClassroom = classrooms.stream()
                    .anyMatch(classroom -> !isTeacherManager(classroom, currentUser));
            if (hasForbiddenClassroom) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn chỉ được giao bài cho lớp mình quản lý");
            }
        }

        assignment.setClassrooms(classrooms);
        assignmentRepository.save(assignment);
    }

    @Transactional(readOnly = true)
    public List<QuestionDto> getQuestionsByAssignmentId(Long assignmentId, String currentUserEmail) {
        User currentUser = getRequiredUser(currentUserEmail);
        Assignment assignment = findActiveAssignment(assignmentId);
        ensureCanViewAssignment(currentUser, assignment);
        return questionRepository.findByAssignmentId(assignmentId).stream()
                .map(this::mapQuestionToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public QuestionDto addQuestion(Long assignmentId, QuestionDto dto, String currentUserEmail) {
        User currentUser = getRequiredUser(currentUserEmail);
        Assignment assignment = findActiveAssignment(assignmentId);
        ensureCanManageAssignment(currentUser, assignment);

        Question question = new Question();
        question.setAssignment(assignment);
        question.setContent(dto.getContent());
        question.setType(dto.getType());
        question.setOptions(dto.getOptions());
        question.setCorrectAnswer(dto.getCorrectAnswer());
        question.setPoints(dto.getPoints() <= 0 ? 1.0 : dto.getPoints());
        return mapQuestionToDto(questionRepository.save(question));
    }

    @Transactional
    public QuestionDto updateQuestion(Long assignmentId, Long questionId, QuestionDto dto, String currentUserEmail) {
        User currentUser = getRequiredUser(currentUserEmail);
        Assignment assignment = findActiveAssignment(assignmentId);
        ensureCanManageAssignment(currentUser, assignment);

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        if (!Objects.equals(question.getAssignment().getId(), assignment.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question does not belong to this assignment");
        }

        question.setContent(dto.getContent());
        question.setType(dto.getType());
        question.setOptions(dto.getOptions());
        question.setCorrectAnswer(dto.getCorrectAnswer());
        question.setPoints(dto.getPoints() <= 0 ? 1.0 : dto.getPoints());
        return mapQuestionToDto(questionRepository.save(question));
    }

    @Transactional
    public void deleteQuestion(Long assignmentId, Long questionId, String currentUserEmail) {
        User currentUser = getRequiredUser(currentUserEmail);
        Assignment assignment = findActiveAssignment(assignmentId);
        ensureCanManageAssignment(currentUser, assignment);

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        if (!Objects.equals(question.getAssignment().getId(), assignment.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question does not belong to this assignment");
        }

        questionRepository.delete(question);
    }

    private AssignmentDto mapToDto(Assignment assignment, User currentUser) {
        AssignmentDto dto = new AssignmentDto();
        dto.setId(assignment.getId());
        dto.setTitle(assignment.getTitle());
        dto.setDescription(assignment.getDescription());
        dto.setMaxAttempts(assignment.getMaxAttempts());
        dto.setTimeLimitMinutes(assignment.getTimeLimitMinutes());
        dto.setDueAt(assignment.getDueAt());
        dto.setCanManage(canManageAssignment(currentUser, assignment));

        if (currentUser.getRole().getName() == Role.RoleName.STUDENT) {
            long attemptsUsed = submissionRepository.countByAssignmentIdAndStudentId(assignment.getId(), currentUser.getId());
            int maxAttempts = assignment.getMaxAttempts() == null || assignment.getMaxAttempts() < 1 ? 1 : assignment.getMaxAttempts();
            dto.setRemainingAttempts(Math.max(maxAttempts - (int) attemptsUsed, 0));
        }

        if (assignment.getClassrooms() != null) {
            dto.setClassrooms(assignment.getClassrooms().stream()
                    .map(classroom -> new ClassroomDto(classroom.getId(), classroom.getName()))
                    .collect(Collectors.toList()));
        }
        if (assignment.getQuestions() != null) {
            dto.setQuestions(assignment.getQuestions().stream()
                    .map(this::mapQuestionToDto)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    private User getRequiredUser(String currentUserEmail) {
        return userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Assignment findActiveAssignment(Long id) {
        return assignmentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
    }

    private void ensureCanCreateAssignment(User currentUser) {
        Role.RoleName roleName = currentUser.getRole().getName();
        if (roleName == Role.RoleName.ADMIN || roleName == Role.RoleName.TEACHER) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to create assignment");
    }

    private void ensureCanViewAssignment(User currentUser, Assignment assignment) {
        if (canViewAssignmentInList(currentUser, assignment)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to access this assignment");
    }

    private boolean canViewAssignmentInList(User currentUser, Assignment assignment) {
        Role.RoleName roleName = currentUser.getRole().getName();
        if (roleName == Role.RoleName.ADMIN) {
            return true;
        }
        if (roleName == Role.RoleName.TEACHER) {
            return canManageAssignment(currentUser, assignment);
        }
        return assignment.getClassrooms().stream()
                .anyMatch(classroom -> classroom.getStudents().stream()
                        .anyMatch(student -> Objects.equals(student.getId(), currentUser.getId())));
    }

    private void ensureCanManageAssignment(User currentUser, Assignment assignment) {
        if (canManageAssignment(currentUser, assignment)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to manage this assignment");
    }

    private boolean canManageAssignment(User currentUser, Assignment assignment) {
        Role.RoleName roleName = currentUser.getRole().getName();
        if (roleName == Role.RoleName.ADMIN) {
            return true;
        }
        if (roleName != Role.RoleName.TEACHER) {
            return false;
        }
        if (assignment.getCreatedBy() == null) {
            return true;
        }
        return Objects.equals(assignment.getCreatedBy().getId(), currentUser.getId());
    }

    private boolean isTeacherManager(Classroom classroom, User currentUser) {
        if (classroom.getTeacher() != null && Objects.equals(classroom.getTeacher().getId(), currentUser.getId())) {
            return true;
        }
        return classroom.getTeachers().stream()
                .anyMatch(teacher -> Objects.equals(teacher.getId(), currentUser.getId()));
    }

    private void validateAssignment(AssignmentDto dto) {
        String title = dto.getTitle() == null ? "" : dto.getTitle().trim();
        if (title.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tiêu đề bài tập không được để trống");
        }
        if (dto.getDueAt() != null && !dto.getDueAt().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hạn làm bài phải lớn hơn thời điểm hiện tại");
        }
        dto.setTitle(title);
        if (dto.getDescription() != null) {
            dto.setDescription(dto.getDescription().trim());
        }
    }

    private QuestionDto mapQuestionToDto(Question question) {
        QuestionDto dto = new QuestionDto();
        dto.setId(question.getId());
        dto.setContent(question.getContent());
        dto.setType(question.getType());
        dto.setOptions(question.getOptions());
        dto.setCorrectAnswer(question.getCorrectAnswer());
        dto.setPoints(question.getPoints());
        return dto;
    }
}
