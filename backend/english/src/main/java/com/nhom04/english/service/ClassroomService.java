package com.nhom04.english.service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Random;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.nhom04.english.dto.ClassroomRequest;
import com.nhom04.english.dto.ClassroomInvitationResponse;
import com.nhom04.english.dto.ClassroomResponse;
import com.nhom04.english.dto.ClassroomStudentResponse;
import com.nhom04.english.dto.ClassroomTeacherResponse;
import com.nhom04.english.dto.JoinClassroomRequest;
import com.nhom04.english.entity.Classroom;
import com.nhom04.english.entity.Role.RoleName;
import com.nhom04.english.entity.User;
import com.nhom04.english.repository.ClassroomRepository;
import com.nhom04.english.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ClassroomService {

    private static final String CLASSROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CLASSROOM_CODE_LENGTH = 8;
    private static final int MAX_CODE_GENERATION_ATTEMPTS = 20;

    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final Random random = new Random();

    public ClassroomResponse create(ClassroomRequest request, String currentUserEmail) {
        validateRequest(request);

        User currentUser = getUserByEmail(currentUserEmail);
        if (currentUser.getRole().getName() != RoleName.ADMIN && currentUser.getRole().getName() != RoleName.TEACHER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ADMIN or TEACHER can create classroom");
        }

        String generatedCode = generateUniqueCode();

        Classroom classroom = new Classroom();
        classroom.setCode(generatedCode);
        classroom.setName(request.getName().trim());
        classroom.setDescription(normalizeDescription(request.getDescription()));

        if (currentUser.getRole().getName() == RoleName.TEACHER) {
            classroom.setTeacher(currentUser);
        }

        if (request.getStudentIds() != null && !request.getStudentIds().isEmpty()) {
            Set<User> students = validateAndGetStudents(request.getStudentIds());
            classroom.setStudents(students);
        }

        return toResponse(classroomRepository.save(classroom), false);
    }

    public ClassroomResponse update(Long classroomId, ClassroomRequest request, String currentUserEmail) {
        validateRequest(request);

        User currentUser = getUserByEmail(currentUserEmail);
        Classroom classroom = getClassroomEntity(classroomId);
        ensureTeacherOrAdminCanManage(classroom, currentUser);

        classroom.setName(request.getName().trim());
        classroom.setDescription(normalizeDescription(request.getDescription()));

        if (request.getStudentIds() != null && currentUser.getRole().getName() == RoleName.ADMIN) {
            Set<User> students = validateAndGetStudents(request.getStudentIds());
            classroom.setStudents(students);
        }

        return toResponse(classroomRepository.save(classroom), false);
    }

    public ClassroomResponse joinByCode(JoinClassroomRequest request, String currentUserEmail) {
        if (request == null || request.getCode() == null || request.getCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Classroom code is required");
        }

        User currentUser = getUserByEmail(currentUserEmail);
        if (currentUser.getRole().getName() != RoleName.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only STUDENT can join by code");
        }

        String normalizedCode = request.getCode().trim().toUpperCase(Locale.ROOT);
        Classroom classroom = classroomRepository.findByCodeIgnoreCase(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classroom code is invalid"));

        if (!classroom.getStudents().add(currentUser)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already joined this classroom");
        }

        classroom.getInvitedStudents().remove(currentUser);

        return toResponse(classroomRepository.save(classroom), true);
    }

    public ClassroomResponse assignTeacher(Long classroomId, Long teacherId) {
        Classroom classroom = getClassroomEntity(classroomId);
        User teacher = getUserById(teacherId);

        if (teacher.getRole().getName() != RoleName.TEACHER) {
            throw new RuntimeException("Assigned user is not a TEACHER");
        }

        classroom.setTeacher(teacher);
        classroom.getTeachers().removeIf(existing -> Objects.equals(existing.getId(), teacher.getId()));
        classroom.getInvitedTeachers().remove(teacher);
        return toResponse(classroomRepository.save(classroom), false);
    }

    public ClassroomResponse addStudent(Long classroomId, Long studentId) {
        Classroom classroom = getClassroomEntity(classroomId);
        User student = getUserById(studentId);

        if (student.getRole().getName() != RoleName.STUDENT) {
            throw new RuntimeException("Selected user is not a STUDENT");
        }

        classroom.getStudents().add(student);
        classroom.getInvitedStudents().remove(student);
        return toResponse(classroomRepository.save(classroom), true);
    }

    public ClassroomResponse inviteStudent(Long classroomId, Long studentId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Classroom classroom = getClassroomEntity(classroomId);
        ensureTeacherOrAdminCanManage(classroom, currentUser);

        User student = getUserById(studentId);
        if (student.getRole().getName() != RoleName.STUDENT) {
            throw new RuntimeException("Selected user is not a STUDENT");
        }

        if (classroom.getStudents().stream().anyMatch(existing -> Objects.equals(existing.getId(), student.getId()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Student already joined classroom");
        }

        classroom.getInvitedStudents().add(student);
        return toResponse(classroomRepository.save(classroom), true);
    }

    public ClassroomResponse inviteTeacher(Long classroomId, Long teacherId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Classroom classroom = getClassroomEntity(classroomId);
        ensureTeacherOrAdminCanManage(classroom, currentUser);

        User teacher = getUserById(teacherId);
        if (teacher.getRole().getName() != RoleName.TEACHER) {
            throw new RuntimeException("Selected user is not a TEACHER");
        }

        if (classroom.getTeacher() != null && Objects.equals(classroom.getTeacher().getId(), teacher.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Teacher already assigned to classroom");
        }
        if (classroom.getTeachers().stream().anyMatch(existing -> Objects.equals(existing.getId(), teacher.getId()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Teacher already joined classroom");
        }

        classroom.getInvitedTeachers().add(teacher);
        return toResponse(classroomRepository.save(classroom), false);
    }

    public ClassroomResponse acceptInvitation(Long classroomId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Classroom classroom = getClassroomEntity(classroomId);

        RoleName roleName = currentUser.getRole().getName();
        if (roleName == RoleName.STUDENT) {
            if (classroom.getInvitedStudents().stream().noneMatch(user -> Objects.equals(user.getId(), currentUser.getId()))) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student invitation not found");
            }

            classroom.getInvitedStudents().removeIf(user -> Objects.equals(user.getId(), currentUser.getId()));
            classroom.getStudents().add(currentUser);
            return toResponse(classroomRepository.save(classroom), true);
        }

        if (roleName == RoleName.TEACHER) {
            if (classroom.getInvitedTeachers().stream().noneMatch(user -> Objects.equals(user.getId(), currentUser.getId()))) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher invitation not found");
            }

            classroom.getInvitedTeachers().removeIf(user -> Objects.equals(user.getId(), currentUser.getId()));
            if (classroom.getTeacher() == null) {
                classroom.setTeacher(currentUser);
            } else if (!Objects.equals(classroom.getTeacher().getId(), currentUser.getId())) {
                classroom.getTeachers().add(currentUser);
            }
            return toResponse(classroomRepository.save(classroom), false);
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only STUDENT or TEACHER can accept classroom invitation");
    }

    @Transactional(readOnly = true)
    public List<ClassroomInvitationResponse> getMyInvitations(String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);

        return classroomRepository.findAll().stream()
                .filter(classroom -> isInvitedToClassroom(classroom, currentUser))
                .sorted(Comparator.comparing(Classroom::getId))
                .map(classroom -> toInvitationResponse(classroom, currentUser))
                .toList();
    }

    public ClassroomResponse removeStudent(Long classroomId, Long studentId) {
        Classroom classroom = getClassroomEntity(classroomId);
        User student = getUserById(studentId);

        classroom.getStudents().remove(student);
        return toResponse(classroomRepository.save(classroom), true);
    }

    @Transactional(readOnly = true)
    public List<ClassroomResponse> getAllClassrooms(String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);

        Set<Classroom> classrooms = switch (currentUser.getRole().getName()) {
            case ADMIN -> new HashSet<>(classroomRepository.findAll());
            case TEACHER -> {
                Set<Classroom> managed = new HashSet<>();
                if (currentUser.getTeachingClassrooms() != null) {
                    managed.addAll(currentUser.getTeachingClassrooms());
                }
                if (currentUser.getManagedClassrooms() != null) {
                    managed.addAll(currentUser.getManagedClassrooms());
                }
                yield managed;
            }
            case STUDENT -> currentUser.getJoinedClassrooms() != null ? currentUser.getJoinedClassrooms() : Set.of();
        };

        return classrooms.stream()
                .sorted(Comparator.comparing(Classroom::getId))
                .map(classroom -> toResponse(classroom, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public ClassroomResponse getClassroom(Long classroomId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Classroom classroom = getClassroomEntity(classroomId);
        ensureCanViewClassroom(classroom, currentUser);
        return toResponse(classroom, true);
    }

    @Transactional(readOnly = true)
    public List<ClassroomStudentResponse> getStudentsByClassroom(Long classroomId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Classroom classroom = getClassroomEntity(classroomId);
        ensureCanViewClassroom(classroom, currentUser);

        return mapStudentsWithInvite(classroom);
    }

    @Transactional(readOnly = true)
    public List<ClassroomTeacherResponse> getTeachersByClassroom(Long classroomId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Classroom classroom = getClassroomEntity(classroomId);
        ensureCanViewClassroom(classroom, currentUser);

        return mapTeachersWithInvite(classroom);
    }

    @Transactional(readOnly = true)
    public List<ClassroomTeacherResponse> getAllTeachers() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole().getName() == RoleName.TEACHER)
                .sorted(Comparator.comparing(User::getId))
                .map(teacher -> toTeacherResponse(teacher, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClassroomStudentResponse> getAllStudents() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole().getName() == RoleName.STUDENT)
                .sorted(Comparator.comparing(User::getId))
                .map(student -> toStudentResponse(student, false))
                .toList();
    }

    private Classroom getClassroomEntity(Long classroomId) {
        return classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));
    }

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Set<User> validateAndGetStudents(List<Long> studentIds) {
        Set<User> students = new HashSet<>();
        for (Long studentId : studentIds) {
            User student = getUserById(studentId);
            if (student.getRole().getName() != RoleName.STUDENT) {
                throw new RuntimeException("Selected user is not a STUDENT");
            }
            students.add(student);
        }
        return students;
    }

    private void validateRequest(ClassroomRequest request) {
        if (request == null) {
            throw new RuntimeException("Request body is required");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new RuntimeException("Classroom name is required");
        }
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String normalized = description.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
            String code = randomCode();
            if (classroomRepository.findByCodeIgnoreCase(code).isEmpty()) {
                return code;
            }
        }

        throw new ResponseStatusException(HttpStatus.CONFLICT, "Unable to generate unique classroom code");
    }

    private String randomCode() {
        StringBuilder builder = new StringBuilder(CLASSROOM_CODE_LENGTH);
        for (int index = 0; index < CLASSROOM_CODE_LENGTH; index++) {
            int randomIndex = random.nextInt(CLASSROOM_CODE_ALPHABET.length());
            builder.append(CLASSROOM_CODE_ALPHABET.charAt(randomIndex));
        }
        return builder.toString();
    }

    private void ensureTeacherOrAdminCanManage(Classroom classroom, User currentUser) {
        RoleName roleName = currentUser.getRole().getName();
        if (roleName == RoleName.ADMIN) {
            return;
        }

        if (roleName == RoleName.TEACHER && isTeacherManager(classroom, currentUser)) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to manage this classroom");
    }

    private void ensureCanViewClassroom(Classroom classroom, User currentUser) {
        RoleName roleName = currentUser.getRole().getName();
        if (roleName == RoleName.ADMIN) {
            return;
        }

        if (roleName == RoleName.TEACHER && isTeacherManager(classroom, currentUser)) {
            return;
        }

        if (roleName == RoleName.STUDENT && classroom.getStudents().stream()
                .anyMatch(student -> Objects.equals(student.getId(), currentUser.getId()))) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to view this classroom");
    }

    private ClassroomResponse toResponse(Classroom classroom, boolean includeStudents) {
        List<ClassroomStudentResponse> students = includeStudents
                ? mapStudentsWithInvite(classroom)
                : null;

        User teacher = classroom.getTeacher();

        return ClassroomResponse.builder()
                .id(classroom.getId())
                .code(classroom.getCode())
                .name(classroom.getName())
                .description(classroom.getDescription())
                .teacherId(teacher != null ? teacher.getId() : null)
                .teacherName(teacher != null ? teacher.getFullname() : null)
                .teacherEmail(teacher != null ? teacher.getEmail() : null)
                .studentCount(classroom.getStudents().size())
                .students(students)
                .build();
    }

    private boolean isTeacherManager(Classroom classroom, User currentUser) {
        if (classroom.getTeacher() != null && Objects.equals(classroom.getTeacher().getId(), currentUser.getId())) {
            return true;
        }

        return classroom.getTeachers().stream()
                .anyMatch(teacher -> Objects.equals(teacher.getId(), currentUser.getId()));
    }

    private boolean isInvitedToClassroom(Classroom classroom, User currentUser) {
        return switch (currentUser.getRole().getName()) {
            case STUDENT -> classroom.getInvitedStudents().stream()
                    .anyMatch(student -> Objects.equals(student.getId(), currentUser.getId()));
            case TEACHER -> classroom.getInvitedTeachers().stream()
                    .anyMatch(teacher -> Objects.equals(teacher.getId(), currentUser.getId()));
            default -> false;
        };
    }

    private ClassroomInvitationResponse toInvitationResponse(Classroom classroom, User currentUser) {
        User invitedBy = classroom.getTeacher();
        return ClassroomInvitationResponse.builder()
                .classroomId(classroom.getId())
                .classroomCode(classroom.getCode())
                .classroomName(classroom.getName())
                .classroomDescription(classroom.getDescription())
                .inviteType(currentUser.getRole().getName().name())
                .invitedById(invitedBy != null ? invitedBy.getId() : null)
                .invitedByName(invitedBy != null ? invitedBy.getFullname() : null)
                .invitedByEmail(invitedBy != null ? invitedBy.getEmail() : null)
                .build();
    }

            private List<ClassroomStudentResponse> mapStudentsWithInvite(Classroom classroom) {
            List<ClassroomStudentResponse> activeStudents = classroom.getStudents().stream()
                .sorted(Comparator.comparing(User::getId))
                .map(student -> toStudentResponse(student, false))
                .toList();

            List<ClassroomStudentResponse> invitedStudents = classroom.getInvitedStudents().stream()
                .filter(invited -> classroom.getStudents().stream()
                    .noneMatch(active -> Objects.equals(active.getId(), invited.getId())))
                .sorted(Comparator.comparing(User::getId))
                .map(student -> toStudentResponse(student, true))
                .toList();

            return java.util.stream.Stream.concat(activeStudents.stream(), invitedStudents.stream()).toList();
            }

            private List<ClassroomTeacherResponse> mapTeachersWithInvite(Classroom classroom) {
            List<ClassroomTeacherResponse> activeTeachers = java.util.stream.Stream.concat(
                    classroom.getTeacher() == null
                            ? java.util.stream.Stream.empty()
                            : java.util.stream.Stream.of(classroom.getTeacher()),
                    classroom.getTeachers().stream()
                        .filter(teacher -> classroom.getTeacher() == null
                            || !Objects.equals(teacher.getId(), classroom.getTeacher().getId())))
                .sorted(Comparator.comparing(User::getId))
                .map(teacher -> toTeacherResponse(teacher, false))
                .toList();

            List<ClassroomTeacherResponse> invitedTeachers = classroom.getInvitedTeachers().stream()
                .filter(invited -> classroom.getTeacher() == null
                    || !Objects.equals(invited.getId(), classroom.getTeacher().getId()))
                .filter(invited -> classroom.getTeachers().stream()
                    .noneMatch(active -> Objects.equals(active.getId(), invited.getId())))
                .sorted(Comparator.comparing(User::getId))
                .map(teacher -> toTeacherResponse(teacher, true))
                .toList();

            return java.util.stream.Stream.concat(activeTeachers.stream(), invitedTeachers.stream()).toList();
            }

    private ClassroomStudentResponse toStudentResponse(User student, boolean invited) {
        return ClassroomStudentResponse.builder()
                .id(student.getId())
                .username(student.getUsername())
                .fullname(student.getFullname())
                .email(student.getEmail())
                .studentCode(student.getStudentCode())
                .invited(invited)
                .build();
    }

    private ClassroomTeacherResponse toTeacherResponse(User teacher, boolean invited) {
        return ClassroomTeacherResponse.builder()
                .id(teacher.getId())
                .username(teacher.getUsername())
                .fullname(teacher.getFullname())
                .email(teacher.getEmail())
                .teacherCode(teacher.getTeacherCode())
                .invited(invited)
                .build();
    }
}
