package com.nhom04.english.controller;

import com.nhom04.english.dto.DashboardStatsResponse;
import com.nhom04.english.dto.AdminUpdateUserRequest;
import com.nhom04.english.dto.MonthlySubmissionStats;
import com.nhom04.english.dto.MonthlyUserStats;
import com.nhom04.english.dto.UserResponse;
import com.nhom04.english.entity.Assignment;
import com.nhom04.english.entity.Role;
import com.nhom04.english.entity.Submission;
import com.nhom04.english.entity.User;
import com.nhom04.english.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final RoleRepository roleRepository;

    // ── Users ───────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return ResponseEntity.ok(toUserResponse(user));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody AdminUpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        userRepository.findByEmail(request.getEmail())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new RuntimeException("Email đã tồn tại");
                });

        userRepository.findByUsername(request.getUsername())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new RuntimeException("Username đã tồn tại");
                });

        Role targetRole = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy role"));

        user.setUsername(request.getUsername().trim());
        user.setFullname(request.getFullname().trim());
        user.setEmail(request.getEmail().trim());
        user.setRole(targetRole);
        user.setPhone(normalizeOptionalValue(request.getPhone()));
        user.setAddress(normalizeOptionalValue(request.getAddress()));
        user.setAvatarUrl(normalizeOptionalValue(request.getAvatarUrl()));
        user.setBio(normalizeOptionalValue(request.getBio()));
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(normalizeOptionalValue(request.getGender()));
        user.setDepartment(normalizeOptionalValue(request.getDepartment()));
        user.setSpecialization(normalizeOptionalValue(request.getSpecialization()));
        user.setStudentCode(request.getRole() == Role.RoleName.STUDENT ? normalizeOptionalValue(request.getStudentCode()) : null);
        user.setTeacherCode(request.getRole() == Role.RoleName.TEACHER ? normalizeOptionalValue(request.getTeacherCode()) : null);
        user.setActiveSessionId(null);

        return ResponseEntity.ok(toUserResponse(userRepository.save(user)));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Xóa tài khoản thành công!"));
    }

    // ── Dashboard Stats ────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalTeachers = userRepository.countByRole_Name(Role.RoleName.TEACHER);
        long totalStudents = userRepository.countByRole_Name(Role.RoleName.STUDENT);
        long totalAdmins = userRepository.countByRole_Name(Role.RoleName.ADMIN);
        long totalClassrooms = classroomRepository.count();
        long totalAssignments = assignmentRepository.countByDeletedAtIsNull();
        long totalSubmissions = submissionRepository.count();
        long gradedSubmissions = submissionRepository.findAll().stream()
                .filter(s -> s.getTeacherFeedback() != null && !s.getTeacherFeedback().isBlank())
                .count();

        DashboardStatsResponse stats = new DashboardStatsResponse();
        stats.setTotalUsers(totalUsers);
        stats.setTotalTeachers(totalTeachers);
        stats.setTotalStudents(totalStudents);
        stats.setTotalAdmins(totalAdmins);
        stats.setTotalClassrooms(totalClassrooms);
        stats.setTotalAssignments(totalAssignments);
        stats.setTotalSubmissions(totalSubmissions);
        stats.setGradedSubmissions(gradedSubmissions);
        stats.setPendingAccounts(0);

        return ResponseEntity.ok(stats);
    }

    // ── Monthly User Stats (last 12 months) ──────────
    @GetMapping("/stats/monthly-users")
    public ResponseEntity<List<MonthlyUserStats>> getMonthlyUserStats() {
        List<MonthlyUserStats> stats = buildMonthlyUserStats();
        return ResponseEntity.ok(stats);
    }

    // ── Monthly Submission Stats (last 12 months) ──────
    @GetMapping("/stats/monthly-submissions")
    public ResponseEntity<List<MonthlySubmissionStats>> getMonthlySubmissionStats() {
        List<MonthlySubmissionStats> stats = buildMonthlySubmissionStats();
        return ResponseEntity.ok(stats);
    }

    // ── Helpers ─────────────────────────────────────
    private List<MonthlyUserStats> buildMonthlyUserStats() {
        LocalDate today = LocalDate.now();
        String[] monthLabels = {"T1", "T2", "T3", "T4", "T5", "T6",
                                "T7", "T8", "T9", "T10", "T11", "T12"};

        return java.util.stream.IntStream.rangeClosed(0, 11)
                .mapToObj(i -> {
                    LocalDate monthStart = today.minusMonths(11 - i).withDayOfMonth(1);
                    LocalDate monthEnd = monthStart.plusMonths(1);
                    LocalDateTime start = monthStart.atStartOfDay();
                    LocalDateTime end = monthEnd.atStartOfDay();

                    long students = userRepository.findAll().stream()
                            .filter(u -> u.getRole().getName() == Role.RoleName.STUDENT)
                            .filter(u -> u.getCreatedAt() != null &&
                                    !u.getCreatedAt().isBefore(start) && u.getCreatedAt().isBefore(end))
                            .count();

                    long teachers = userRepository.findAll().stream()
                            .filter(u -> u.getRole().getName() == Role.RoleName.TEACHER)
                            .filter(u -> u.getCreatedAt() != null &&
                                    !u.getCreatedAt().isBefore(start) && u.getCreatedAt().isBefore(end))
                            .count();

                    return new MonthlyUserStats(monthLabels[monthStart.getMonthValue() - 1], students, teachers);
                })
                .collect(Collectors.toList());
    }

    private List<MonthlySubmissionStats> buildMonthlySubmissionStats() {
        LocalDate today = LocalDate.now();
        String[] monthLabels = {"T1", "T2", "T3", "T4", "T5", "T6",
                                "T7", "T8", "T9", "T10", "T11", "T12"};

        return java.util.stream.IntStream.rangeClosed(0, 11)
                .mapToObj(i -> {
                    LocalDate monthStart = today.minusMonths(11 - i).withDayOfMonth(1);
                    LocalDate monthEnd = monthStart.plusMonths(1);
                    LocalDateTime start = monthStart.atStartOfDay();
                    LocalDateTime end = monthEnd.atStartOfDay();

                    long assignments = assignmentRepository.findAllByDeletedAtIsNull().stream()
                            .filter(a -> a.getCreatedAt() != null &&
                                    !a.getCreatedAt().isBefore(start) && a.getCreatedAt().isBefore(end))
                            .count();

                    long submissions = submissionRepository.findAll().stream()
                            .filter(s -> s.getCreatedAt() != null &&
                                    !s.getCreatedAt().isBefore(start) && s.getCreatedAt().isBefore(end))
                            .count();

                    return new MonthlySubmissionStats(monthLabels[monthStart.getMonthValue() - 1], assignments, submissions);
                })
                .collect(Collectors.toList());
    }

    private UserResponse toUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setFullname(user.getFullname());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().getName().name());
        response.setPhone(user.getPhone());
        response.setAddress(user.getAddress());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setBio(user.getBio());
        response.setDateOfBirth(user.getDateOfBirth());
        response.setGender(user.getGender());
        response.setDepartment(user.getDepartment());
        response.setSpecialization(user.getSpecialization());
        response.setStudentCode(user.getStudentCode());
        response.setTeacherCode(user.getTeacherCode());
        return response;
    }

    private String normalizeOptionalValue(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
