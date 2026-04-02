package com.nhom04.english.service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.nhom04.english.dto.PronunciationExerciseRequest;
import com.nhom04.english.dto.PronunciationExerciseResponse;
import com.nhom04.english.dto.PronunciationReviewRequest;
import com.nhom04.english.dto.PronunciationSubmissionResponse;
import com.nhom04.english.entity.Classroom;
import com.nhom04.english.entity.PronunciationExercise;
import com.nhom04.english.entity.PronunciationReviewStatus;
import com.nhom04.english.entity.PronunciationSubmission;
import com.nhom04.english.entity.Role.RoleName;
import com.nhom04.english.entity.User;
import com.nhom04.english.repository.ClassroomRepository;
import com.nhom04.english.repository.PronunciationExerciseRepository;
import com.nhom04.english.repository.PronunciationSubmissionRepository;
import com.nhom04.english.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PronunciationService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final PronunciationExerciseRepository exerciseRepository;
    private final PronunciationSubmissionRepository submissionRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;

    @Value("${pronunciation.storage-dir:uploads/pronunciation}")
    private String storageDirectory;

    @Transactional(readOnly = true)
    public List<PronunciationExerciseResponse> getExercisesByClassroom(Long classroomId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Classroom classroom = getClassroom(classroomId);
        ensureCanViewClassroom(classroom, currentUser);

        return exerciseRepository.findDistinctByClassroomsIdOrderByCreatedAtDescIdDesc(classroomId).stream()
                .map(exercise -> toExerciseResponse(exercise, classroomId))
                .toList();
    }

    @Transactional(readOnly = true)
    public PronunciationExerciseResponse getExercise(Long exerciseId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        PronunciationExercise exercise = getExerciseEntity(exerciseId);
        ensureCanViewExercise(exercise, currentUser);
        return toExerciseResponse(exercise, null);
    }

    public PronunciationExerciseResponse createExercise(Long classroomId, PronunciationExerciseRequest request, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Classroom classroom = getClassroom(classroomId);
        ensureCanManageClassroom(classroom, currentUser);

        PronunciationExercise exercise = new PronunciationExercise();
        exercise.setCreatedBy(currentUser);
        applyExerciseRequest(exercise, request, classroomId, currentUser);

        return toExerciseResponse(exerciseRepository.save(exercise), classroomId);
    }

    public PronunciationExerciseResponse updateExercise(Long exerciseId, PronunciationExerciseRequest request, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        PronunciationExercise exercise = getExerciseEntity(exerciseId);
        ensureCanManageExercise(exercise, currentUser);
        applyExerciseRequest(exercise, request, null, currentUser);

        return toExerciseResponse(exerciseRepository.save(exercise), null);
    }

    public void deleteExercise(Long exerciseId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        PronunciationExercise exercise = getExerciseEntity(exerciseId);
        ensureCanManageExercise(exercise, currentUser);

        List<PronunciationSubmission> submissions = submissionRepository.findByExerciseIdOrderBySubmittedAtDescIdDesc(exerciseId);
        submissions.forEach(this::deleteAudioIfExists);
        exerciseRepository.delete(exercise);
    }

    @Transactional(readOnly = true)
    public List<PronunciationSubmissionResponse> getSubmissions(Long exerciseId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        PronunciationExercise exercise = getExerciseEntity(exerciseId);
        ensureCanViewExercise(exercise, currentUser);

        List<PronunciationSubmission> submissions = currentUser.getRole().getName() == RoleName.STUDENT
                ? submissionRepository.findByExerciseIdAndStudentIdOrderBySubmittedAtDescIdDesc(exerciseId, currentUser.getId())
                : submissionRepository.findByExerciseIdOrderBySubmittedAtDescIdDesc(exerciseId);

        return submissions.stream().map(this::toSubmissionResponse).toList();
    }

    public PronunciationSubmissionResponse submit(Long exerciseId, MultipartFile audio, Double durationSeconds, String currentUserEmail) {
        if (audio == null || audio.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Audio file is required");
        }

        User currentUser = getUserByEmail(currentUserEmail);
        if (currentUser.getRole().getName() != RoleName.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only STUDENT can submit pronunciation audio");
        }

        PronunciationExercise exercise = getExerciseEntity(exerciseId);
        ensureCanViewExercise(exercise, currentUser);

        long existingAttempts = submissionRepository.countByExerciseIdAndStudentId(exerciseId, currentUser.getId());
        if (existingAttempts >= exercise.getMaxAttempts()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ban da dung het so lan nop cho bai phat am nay");
        }

        double normalizedDuration = durationSeconds == null ? 0D : durationSeconds;
        if (normalizedDuration <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duration seconds must be greater than 0");
        }

        StoredAudio storedAudio = storeAudio(exercise, currentUser, audio);
        AutoScore autoScore = calculateAutoScore(
                exercise.getReferenceText(),
                normalizedDuration,
                storedAudio.fileSizeBytes(),
                existingAttempts + 1);

        PronunciationSubmission submission = new PronunciationSubmission();
        submission.setExercise(exercise);
        submission.setStudent(currentUser);
        submission.setAudioPath(storedAudio.relativePath());
        submission.setOriginalFilename(storedAudio.originalFilename());
        submission.setContentType(storedAudio.contentType());
        submission.setFileSizeBytes(storedAudio.fileSizeBytes());
        submission.setDurationSeconds(normalizedDuration);
        submission.setAttemptNumber((int) existingAttempts + 1);
        submission.setAutoCompletenessScore(autoScore.completenessScore());
        submission.setAutoFluencyScore(autoScore.fluencyScore());
        submission.setAutoConsistencyScore(autoScore.consistencyScore());
        submission.setAutoOverallScore(autoScore.overallScore());
        submission.setAutoFeedback(autoScore.feedback());
        submission.setReviewStatus(PronunciationReviewStatus.PENDING);

        return toSubmissionResponse(submissionRepository.save(submission));
    }

    public PronunciationSubmissionResponse reviewSubmission(Long submissionId, PronunciationReviewRequest request, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        PronunciationSubmission submission = getSubmission(submissionId);
        ensureCanManageExercise(submission.getExercise(), currentUser);

        submission.setTeacherScore(request.getTeacherScore());
        submission.setTeacherFeedback(normalizeOptionalText(request.getTeacherFeedback()));
        submission.setReviewedBy(currentUser);
        submission.setReviewedAt(LocalDateTime.now());
        submission.setReviewStatus(PronunciationReviewStatus.REVIEWED);

        return toSubmissionResponse(submissionRepository.save(submission));
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> serveAudio(Long submissionId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        PronunciationSubmission submission = getSubmission(submissionId);
        ensureCanViewSubmission(submission, currentUser);

        Path filePath = resolveStoragePath(submission.getAudioPath());
        if (!Files.exists(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Audio file not found");
        }

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            if (submission.getContentType() != null && !submission.getContentType().isBlank()) {
                mediaType = MediaType.parseMediaType(submission.getContentType());
            }
        } catch (IllegalArgumentException ignored) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        Resource resource = new FileSystemResource(filePath);
        String encodedFilename = URLEncoder.encode(submission.getOriginalFilename(), StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header("Content-Disposition", "inline; filename*=UTF-8''" + encodedFilename)
                .body(resource);
    }

    private void applyExerciseRequest(PronunciationExercise exercise, PronunciationExerciseRequest request, Long fallbackClassroomId, User currentUser) {
        exercise.setTitle(request.getTitle().trim());
        exercise.setReferenceText(request.getReferenceText().trim());
        exercise.setDescription(normalizeOptionalText(request.getDescription()));
        exercise.setFocusSkill(normalizeOptionalText(request.getFocusSkill()));
        exercise.setDifficultyLevel(request.getDifficultyLevel() == null ? 1 : request.getDifficultyLevel());
        exercise.setMaxAttempts(request.getMaxAttempts() == null ? 3 : request.getMaxAttempts());

        LinkedHashSet<Long> targetIds = new LinkedHashSet<>();
        if (request.getClassroomIds() != null) {
            targetIds.addAll(request.getClassroomIds());
        }
        if (fallbackClassroomId != null) {
            targetIds.add(fallbackClassroomId);
        }
        if (targetIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phai chon it nhat mot lop hoc cho bai phat am");
        }

        List<Classroom> classrooms = classroomRepository.findAllById(targetIds);
        if (classrooms.size() != targetIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Co lop hoc khong ton tai trong danh sach duoc giao");
        }
        classrooms.forEach(classroom -> ensureCanManageClassroom(classroom, currentUser));
        exercise.setClassrooms(classrooms);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Classroom getClassroom(Long classroomId) {
        return classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classroom not found"));
    }

    private PronunciationExercise getExerciseEntity(Long exerciseId) {
        return exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pronunciation exercise not found"));
    }

    private PronunciationSubmission getSubmission(Long submissionId) {
        return submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pronunciation submission not found"));
    }

    private void ensureCanManageClassroom(Classroom classroom, User currentUser) {
        RoleName roleName = currentUser.getRole().getName();
        if (roleName == RoleName.ADMIN) {
            return;
        }

        if (roleName == RoleName.TEACHER && classroom.getTeacher() != null
                && Objects.equals(classroom.getTeacher().getId(), currentUser.getId())) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to manage pronunciation in this classroom");
    }

    private void ensureCanViewClassroom(Classroom classroom, User currentUser) {
        RoleName roleName = currentUser.getRole().getName();
        if (roleName == RoleName.ADMIN) {
            return;
        }

        if (roleName == RoleName.TEACHER && classroom.getTeacher() != null
                && Objects.equals(classroom.getTeacher().getId(), currentUser.getId())) {
            return;
        }

        Set<User> students = classroom.getStudents();
        if (roleName == RoleName.STUDENT && students != null && students.stream()
                .anyMatch(student -> Objects.equals(student.getId(), currentUser.getId()))) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to view pronunciation in this classroom");
    }

    private void ensureCanManageExercise(PronunciationExercise exercise, User currentUser) {
        if (exercise.getClassrooms() == null || exercise.getClassrooms().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pronunciation exercise has no assigned classroom");
        }
        exercise.getClassrooms().forEach(classroom -> ensureCanManageClassroom(classroom, currentUser));
    }

    private void ensureCanViewExercise(PronunciationExercise exercise, User currentUser) {
        if (currentUser.getRole().getName() == RoleName.ADMIN) {
            return;
        }

        boolean canView = exercise.getClassrooms() != null && exercise.getClassrooms().stream().anyMatch(classroom -> {
            try {
                ensureCanViewClassroom(classroom, currentUser);
                return true;
            } catch (ResponseStatusException exception) {
                return false;
            }
        });

        if (!canView) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to view this pronunciation exercise");
        }
    }

    private void ensureCanViewSubmission(PronunciationSubmission submission, User currentUser) {
        if (currentUser.getRole().getName() == RoleName.STUDENT
                && !Objects.equals(submission.getStudent().getId(), currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to view this submission");
        }

        ensureCanViewExercise(submission.getExercise(), currentUser);
    }

    private StoredAudio storeAudio(PronunciationExercise exercise, User student, MultipartFile audio) {
        String originalFilename = audio.getOriginalFilename() == null
                ? "audio"
                : Paths.get(audio.getOriginalFilename()).getFileName().toString();
        String extension = "";
        int extensionIndex = originalFilename.lastIndexOf('.');
        if (extensionIndex >= 0) {
            extension = originalFilename.substring(extensionIndex).replaceAll("[^a-zA-Z0-9.]", "");
        }

        String generatedName = String.format(
                Locale.ROOT,
                "exercise-%d-student-%d-%s%s",
                exercise.getId(),
                student.getId(),
                UUID.randomUUID(),
                extension);
        String relativePath = String.format(Locale.ROOT, "exercise-%d/%s", exercise.getId(), generatedName);

        try {
            Path targetPath = resolveStoragePath(relativePath);
            Files.createDirectories(targetPath.getParent());
            Files.copy(audio.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String contentType = audio.getContentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = "application/octet-stream";
            }

            return new StoredAudio(relativePath, originalFilename, contentType, audio.getSize());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong the luu file audio", exception);
        }
    }

    private void deleteAudioIfExists(PronunciationSubmission submission) {
        try {
            Files.deleteIfExists(resolveStoragePath(submission.getAudioPath()));
        } catch (IOException ignored) {
        }
    }

    private Path resolveStoragePath(String relativePath) {
        return Paths.get(storageDirectory).resolve(relativePath).normalize().toAbsolutePath();
    }

    private AutoScore calculateAutoScore(String referenceText, double durationSeconds, long fileSizeBytes, long attemptNumber) {
        long wordCount = Arrays.stream(referenceText.trim().split("\\s+"))
                .filter(word -> !word.isBlank())
                .count();
        double expectedDuration = Math.max(2D, wordCount * 0.75D);
        double durationRatio = durationSeconds / expectedDuration;
        double durationGap = Math.abs(1D - durationRatio);
        double kilobytesPerSecond = (fileSizeBytes / 1024D) / Math.max(durationSeconds, 1D);

        int completeness = clampScore(100 - (int) Math.round(durationGap * 55D) - (fileSizeBytes < 12_000 ? 12 : 0));
        int fluency = clampScore(96 - (int) Math.round(durationGap * 70D) - (int) ((attemptNumber - 1) * 4));
        int consistency = clampScore(68 + (int) Math.min(22D, Math.round(kilobytesPerSecond / 4D)) - (int) Math.round(durationGap * 30D));
        int overall = clampScore((int) Math.round(completeness * 0.4D + fluency * 0.35D + consistency * 0.25D));

        String pacingFeedback;
        if (durationRatio < 0.75D) {
            pacingFeedback = "Ban doc hoi nhanh so voi cau mau, thu giu nhip cham hon va ro am cuoi.";
        } else if (durationRatio > 1.35D) {
            pacingFeedback = "Ban doc hoi cham, hay luyen lien mach hon de cau tro nen tu nhien.";
        } else {
            pacingFeedback = "Nhip doc kha on va gan voi do dai cau mau.";
        }

        String overallFeedback = overall >= 85
                ? "Bai nop on dinh, co the tap trung them vao do ro cua tung cum tu."
                : overall >= 65
                        ? "Bai nop dat muc co ban, nen luyen them nhan am va su lien mach."
                        : "Can luyen them ve nhip doc va do day cua am thanh de bai nop tot hon.";

        return new AutoScore(completeness, fluency, consistency, overall, pacingFeedback + " " + overallFeedback);
    }

    private int clampScore(int value) {
        return Math.max(0, Math.min(100, value));
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private PronunciationExerciseResponse toExerciseResponse(PronunciationExercise exercise, Long preferredClassroomId) {
        int submissionCount = exercise.getSubmissions() == null ? 0 : exercise.getSubmissions().size();
        Classroom preferredClassroom = null;
        if (exercise.getClassrooms() != null && !exercise.getClassrooms().isEmpty()) {
            preferredClassroom = preferredClassroomId == null
                    ? exercise.getClassrooms().get(0)
                    : exercise.getClassrooms().stream()
                            .filter(classroom -> Objects.equals(classroom.getId(), preferredClassroomId))
                            .findFirst()
                            .orElse(exercise.getClassrooms().get(0));
        }

        return PronunciationExerciseResponse.builder()
                .id(exercise.getId())
                .classroomId(preferredClassroom != null ? preferredClassroom.getId() : null)
                .classroomName(preferredClassroom != null ? preferredClassroom.getName() : null)
                .classroomIds(exercise.getClassrooms() == null ? List.of() : exercise.getClassrooms().stream().map(Classroom::getId).toList())
                .classroomNames(exercise.getClassrooms() == null ? List.of() : exercise.getClassrooms().stream().map(Classroom::getName).toList())
                .title(exercise.getTitle())
                .referenceText(exercise.getReferenceText())
                .description(exercise.getDescription())
                .focusSkill(exercise.getFocusSkill())
                .difficultyLevel(exercise.getDifficultyLevel())
                .maxAttempts(exercise.getMaxAttempts())
                .submissionCount(submissionCount)
                .createdAt(formatDateTime(exercise.getCreatedAt()))
                .createdByName(exercise.getCreatedBy().getFullname())
                .submissions(null)
                .build();
    }

    private PronunciationSubmissionResponse toSubmissionResponse(PronunciationSubmission submission) {
        User reviewedBy = submission.getReviewedBy();
        String audioUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/pronunciation/submissions/")
                .path(String.valueOf(submission.getId()))
                .path("/audio")
                .toUriString();

        return PronunciationSubmissionResponse.builder()
                .id(submission.getId())
                .studentId(submission.getStudent().getId())
                .studentName(submission.getStudent().getFullname())
                .studentEmail(submission.getStudent().getEmail())
                .audioUrl(audioUrl)
                .originalFilename(submission.getOriginalFilename())
                .fileSizeBytes(submission.getFileSizeBytes())
                .durationSeconds(submission.getDurationSeconds())
                .attemptNumber(submission.getAttemptNumber())
                .autoCompletenessScore(submission.getAutoCompletenessScore())
                .autoFluencyScore(submission.getAutoFluencyScore())
                .autoConsistencyScore(submission.getAutoConsistencyScore())
                .autoOverallScore(submission.getAutoOverallScore())
                .autoFeedback(submission.getAutoFeedback())
                .teacherScore(submission.getTeacherScore())
                .teacherFeedback(submission.getTeacherFeedback())
                .reviewedByName(reviewedBy != null ? reviewedBy.getFullname() : null)
                .reviewStatus(submission.getReviewStatus())
                .reviewedAt(formatDateTime(submission.getReviewedAt()))
                .submittedAt(formatDateTime(submission.getSubmittedAt()))
                .build();
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? null : DATE_TIME_FORMATTER.format(value);
    }

    private record StoredAudio(String relativePath, String originalFilename, String contentType, long fileSizeBytes) {
    }

    private record AutoScore(int completenessScore, int fluencyScore, int consistencyScore, int overallScore, String feedback) {
    }
}
