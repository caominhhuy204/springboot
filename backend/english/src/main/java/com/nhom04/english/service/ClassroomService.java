package com.nhom04.english.service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhom04.english.dto.ClassroomRequest;
import com.nhom04.english.dto.ClassroomResponse;
import com.nhom04.english.dto.ClassroomStudentResponse;
import com.nhom04.english.dto.ClassroomTeacherResponse;
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

    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;

    public ClassroomResponse create(ClassroomRequest request) {
        validateRequest(request);

        classroomRepository.findByCodeIgnoreCase(request.getCode().trim())
                .ifPresent(classroom -> {
                    throw new RuntimeException("Classroom code already exists");
                });

        Classroom classroom = new Classroom();
        classroom.setCode(request.getCode().trim());
        classroom.setName(request.getName().trim());
        classroom.setDescription(request.getDescription());

        if (request.getTeacherId() != null) {
            User teacher = validateAndGetTeacher(request.getTeacherId());
            classroom.setTeacher(teacher);
        }

        if (request.getStudentIds() != null && !request.getStudentIds().isEmpty()) {
            Set<User> students = validateAndGetStudents(request.getStudentIds());
            classroom.setStudents(students);
        }

        return toResponse(classroomRepository.save(classroom), false);
    }

    public ClassroomResponse update(Long classroomId, ClassroomRequest request) {
        validateRequest(request);

        Classroom classroom = getClassroomEntity(classroomId);

        classroomRepository.findByCodeIgnoreCase(request.getCode().trim())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(classroomId)) {
                        throw new RuntimeException("Classroom code already exists");
                    }
                });

        classroom.setCode(request.getCode().trim());
        classroom.setName(request.getName().trim());
        classroom.setDescription(request.getDescription());

        if (request.getTeacherId() != null) {
            User teacher = validateAndGetTeacher(request.getTeacherId());
            classroom.setTeacher(teacher);
        }

        if (request.getStudentIds() != null) {
            Set<User> students = validateAndGetStudents(request.getStudentIds());
            classroom.setStudents(students);
        }

        return toResponse(classroomRepository.save(classroom), false);
    }

    public ClassroomResponse assignTeacher(Long classroomId, Long teacherId) {
        Classroom classroom = getClassroomEntity(classroomId);
        User teacher = getUserById(teacherId);

        if (teacher.getRole().getName() != RoleName.TEACHER) {
            throw new RuntimeException("Assigned user is not a TEACHER");
        }

        classroom.setTeacher(teacher);
        return toResponse(classroomRepository.save(classroom), false);
    }

    public ClassroomResponse addStudent(Long classroomId, Long studentId) {
        Classroom classroom = getClassroomEntity(classroomId);
        User student = getUserById(studentId);

        if (student.getRole().getName() != RoleName.STUDENT) {
            throw new RuntimeException("Selected user is not a STUDENT");
        }

        classroom.getStudents().add(student);
        return toResponse(classroomRepository.save(classroom), true);
    }

    public ClassroomResponse removeStudent(Long classroomId, Long studentId) {
        Classroom classroom = getClassroomEntity(classroomId);
        User student = getUserById(studentId);

        classroom.getStudents().remove(student);
        return toResponse(classroomRepository.save(classroom), true);
    }

    @Transactional(readOnly = true)
    public List<ClassroomResponse> getAllClassrooms() {
        return classroomRepository.findAll().stream()
                .sorted(Comparator.comparing(Classroom::getId))
                .map(classroom -> toResponse(classroom, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public ClassroomResponse getClassroom(Long classroomId) {
        return toResponse(getClassroomEntity(classroomId), true);
    }

    @Transactional(readOnly = true)
    public List<ClassroomStudentResponse> getStudentsByClassroom(Long classroomId) {
        Classroom classroom = getClassroomEntity(classroomId);

        return classroom.getStudents().stream()
                .sorted(Comparator.comparing(User::getId))
                .map(this::toStudentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClassroomTeacherResponse> getAllTeachers() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole().getName() == RoleName.TEACHER)
                .sorted(Comparator.comparing(User::getId))
                .map(this::toTeacherResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClassroomStudentResponse> getAllStudents() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole().getName() == RoleName.STUDENT)
                .sorted(Comparator.comparing(User::getId))
                .map(this::toStudentResponse)
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

    private User validateAndGetTeacher(Long teacherId) {
        User teacher = getUserById(teacherId);
        if (teacher.getRole().getName() != RoleName.TEACHER) {
            throw new RuntimeException("Assigned user is not a TEACHER");
        }
        return teacher;
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
        if (request.getCode() == null || request.getCode().isBlank()) {
            throw new RuntimeException("Classroom code is required");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new RuntimeException("Classroom name is required");
        }
    }

    private ClassroomResponse toResponse(Classroom classroom, boolean includeStudents) {
        List<ClassroomStudentResponse> students = includeStudents
                ? classroom.getStudents().stream()
                        .sorted(Comparator.comparing(User::getId))
                        .map(this::toStudentResponse)
                        .toList()
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

    private ClassroomStudentResponse toStudentResponse(User student) {
        return ClassroomStudentResponse.builder()
                .id(student.getId())
                .username(student.getUsername())
                .fullname(student.getFullname())
                .email(student.getEmail())
                .studentCode(student.getStudentCode())
                .build();
    }

    private ClassroomTeacherResponse toTeacherResponse(User teacher) {
        return ClassroomTeacherResponse.builder()
                .id(teacher.getId())
                .username(teacher.getUsername())
                .fullname(teacher.getFullname())
                .email(teacher.getEmail())
                .teacherCode(teacher.getTeacherCode())
                .build();
    }
}
