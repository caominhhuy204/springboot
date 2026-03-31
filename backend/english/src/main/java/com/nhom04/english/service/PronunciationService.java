package com.nhom04.english.service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.nhom04.english.dto.PronunciationExerciseRequest;
import com.nhom04.english.dto.PronunciationExerciseResponse;
import com.nhom04.english.dto.PronunciationReviewRequest;
import com.nhom04.english.dto.PronunciationSubmissionResponse;
import com.nhom04.english.entity.Classroom;
import com.nhom04.english.entity.PronunciationExercise;
import com.nhom04.english.entity.PronunciationSubmission;
import com.nhom04.english.entity.PronunciationSubmission.ReviewStatus;
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

    private final PronunciationExerciseRepository exerciseRepository;
    private final PronunciationSubmissionRepository submissionRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;

    @Value("${app.audio-upload-dir:uploads/audio}")
    private String audioUploadDir;

    public PronunciationExerciseResponse createExercise(
            Long classroomId,
            PronunciationExerciseRequest request,
            String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Classroom classroom = getClassroom(classroomId);

        ensureTeacherOrAdminCanManageClassroom(classroom, currentUser);
        validateExerciseRequest(request);

        PronunciationExercise exercise = PronunciationExercise.builder()
                .classroom(classroom)
                .createdBy(currentUser)
                .title(request.getTitle().trim())
                .referenceText(request.getReferenceText().trim())
                .description(normalizeOptional(request.getDescription()))
                .focusSkill(normalizeOptional(request.getFocusSkill()))
                .difficultyLevel(normalizeDifficulty(request.getDifficultyLevel()))
                .maxAttempts(normalizeMaxAttempts(request.getMaxAttempts()))
                .createdAt(LocalDateTime.now())
                .build();

        return toExerciseResponse(exerciseRepository.save(exercise), false, currentUser);
    }

    public PronunciationExerciseResponse updateExercise(
            Long exerciseId,
            PronunciationExerciseRequest request,
            String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        PronunciationExercise exercise = getExercise(exerciseId);

        ensureTeacherOrAdminCanManageClassroom(exercise.getClassroom(), currentUser);
        validateExerciseRequest(request);

        exercise.setTitle(request.getTitle().trim());
        exercise.setReferenceText(request.getReferenceText().trim());
        exercise.setDescription(normalizeOptional(request.getDescription()));
        exercise.setFocusSkill(normalizeOptional(request.getFocusSkill()));
        exercise.setDifficultyLevel(normalizeDifficulty(request.getDifficultyLevel()));
        exercise.setMaxAttempts(normalizeMaxAttempts(request.getMaxAttempts()));

        return toExerciseResponse(exerciseRepository.save(exercise), false, currentUser);
    }

    public void deleteExercise(Long exerciseId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        PronunciationExercise exercise = getExercise(exerciseId);
        ensureTeacherOrAdminCanManageClassroom(exercise.getClassroom(), currentUser);
        deleteSubmissionAudioFiles(exercise.getSubmissions());
        exerciseRepository.delete(exercise);
    }

    @Transactional(readOnly = true)
    public List<PronunciationExerciseResponse> getExercisesByClassroom(Long classroomId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        Classroom classroom = getClassroom(classroomId);
        ensureCanViewClassroom(classroom, currentUser);

        return exerciseRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId).stream()
                .map(exercise -> toExerciseResponse(exercise, false, currentUser))
                .toList();
    }

    @Transactional(readOnly = true)
    public PronunciationExerciseResponse getExerciseDetail(Long exerciseId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        PronunciationExercise exercise = getExercise(exerciseId);
        ensureCanViewClassroom(exercise.getClassroom(), currentUser);
        return toExerciseResponse(exercise, true, currentUser);
    }

    public PronunciationSubmissionResponse submitAudio(
            Long exerciseId,
            MultipartFile audioFile,
            Double durationSeconds,
            String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        if (currentUser.getRole().getName() != RoleName.STUDENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only STUDENT can submit pronunciation practice");
        }

        PronunciationExercise exercise = getExercise(exerciseId);
        ensureCanViewClassroom(exercise.getClassroom(), currentUser);

        validateAudioFile(audioFile, durationSeconds);

        int nextAttempt = submissionRepository
                .findTopByExerciseIdAndStudentIdOrderByAttemptNumberDesc(exerciseId, currentUser.getId())
                .map(previous -> previous.getAttemptNumber() + 1)
                .orElse(1);

        if (nextAttempt > exercise.getMaxAttempts()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Maximum attempts reached for this exercise");
        }

        String storedPath = storeAudioFile(exercise, currentUser, audioFile, nextAttempt);
        BasicScore score = scoreSubmission(exercise, durationSeconds, nextAttempt);

        PronunciationSubmission submission = PronunciationSubmission.builder()
                .exercise(exercise)
                .student(currentUser)
                .audioPath(storedPath)
                .originalFilename(StringUtils.cleanPath(Objects.requireNonNullElse(audioFile.getOriginalFilename(), "audio")))
                .fileSizeBytes(audioFile.getSize())
                .durationSeconds(durationSeconds)
                .attemptNumber(nextAttempt)
                .autoCompletenessScore(score.completenessScore())
                .autoFluencyScore(score.fluencyScore())
                .autoConsistencyScore(score.consistencyScore())
                .autoOverallScore(score.overallScore())
                .autoFeedback(score.feedback())
                .reviewStatus(ReviewStatus.PENDING)
                .submittedAt(LocalDateTime.now())
                .build();

        return toSubmissionResponse(submissionRepository.save(submission));
    }

    public PronunciationSubmissionResponse reviewSubmission(
            Long submissionId,
            PronunciationReviewRequest request,
            String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        PronunciationSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));

        ensureTeacherOrAdminCanManageClassroom(submission.getExercise().getClassroom(), currentUser);
        validateReviewRequest(request);

        submission.setTeacherScore(request.getTeacherScore());
        submission.setTeacherFeedback(normalizeOptional(request.getTeacherFeedback()));
        submission.setReviewStatus(ReviewStatus.REVIEWED);
        submission.setReviewedAt(LocalDateTime.now());
        submission.setReviewedBy(currentUser);

        return toSubmissionResponse(submissionRepository.save(submission));
    }

    @Transactional(readOnly = true)
    public List<PronunciationSubmissionResponse> getExerciseSubmissions(Long exerciseId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        PronunciationExercise exercise = getExercise(exerciseId);

        if (currentUser.getRole().getName() == RoleName.STUDENT) {
            return submissionRepository.findByExerciseIdAndStudentIdOrderBySubmittedAtDesc(exerciseId, currentUser.getId())
                    .stream()
                    .map(this::toSubmissionResponse)
                    .toList();
        }

        ensureTeacherOrAdminCanManageClassroom(exercise.getClassroom(), currentUser);

        return submissionRepository.findByExerciseIdOrderBySubmittedAtDesc(exerciseId).stream()
                .map(this::toSubmissionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Resource getSubmissionAudio(Long submissionId, String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        PronunciationSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));

        PronunciationExercise exercise = submission.getExercise();
        Classroom classroom = exercise.getClassroom();

        if (currentUser.getRole().getName() == RoleName.STUDENT
                && !Objects.equals(submission.getStudent().getId(), currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to access this audio");
        }

        if (currentUser.getRole().getName() != RoleName.STUDENT) {
            ensureTeacherOrAdminCanManageClassroom(classroom, currentUser);
        } else {
            ensureCanViewClassroom(classroom, currentUser);
        }

        Path audioPath = Paths.get(submission.getAudioPath());
        if (!Files.exists(audioPath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Audio file not found");
        }

        return new FileSystemResource(audioPath);
    }

    public String buildAudioDownloadFilename(Long submissionId) {
        PronunciationSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
        return URLEncoder.encode(submission.getOriginalFilename(), StandardCharsets.UTF_8);
    }

    private BasicScore scoreSubmission(PronunciationExercise exercise, Double durationSeconds, int attemptNumber) {
        int wordCount = Math.max(1, exercise.getReferenceText().trim().split("\\s+").length);
        double expectedMin = Math.max(2.5, wordCount * 0.55);
        double expectedMax = Math.max(expectedMin + 1.5, wordCount * 1.25);

        int completenessScore = durationSeconds >= expectedMin
                ? 85
                : Math.max(35, (int) Math.round((durationSeconds / expectedMin) * 85));

        double midpoint = (expectedMin + expectedMax) / 2.0;
        double distance = Math.abs(durationSeconds - midpoint);
        double tolerance = Math.max(1.0, (expectedMax - expectedMin) / 2.0);
        int fluencyScore = Math.max(40, 92 - (int) Math.round((distance / tolerance) * 25));

        int consistencyScore = Math.max(65, 92 - ((attemptNumber - 1) * 6));
        int overallScore = Math.max(0, Math.min(100,
                (int) Math.round((completenessScore * 0.45) + (fluencyScore * 0.35) + (consistencyScore * 0.20))));

        boolean teacherReviewRecommended = durationSeconds < expectedMin * 0.7 || durationSeconds > expectedMax * 1.3;

        String feedback = buildFeedback(exercise, durationSeconds, expectedMin, expectedMax, teacherReviewRecommended);

        return new BasicScore(
                completenessScore,
                fluencyScore,
                consistencyScore,
                overallScore,
                feedback,
                ReviewStatus.PENDING);
    }

    private String buildFeedback(
            PronunciationExercise exercise,
            Double durationSeconds,
            double expectedMin,
            double expectedMax,
            boolean teacherReviewRecommended) {
        StringBuilder feedback = new StringBuilder("He thong da luu bai noi va cham diem co ban.");

        if (durationSeconds < expectedMin * 0.8) {
            feedback.append(" Thoi luong qua ngan (").append(String.format("%.1f", durationSeconds)).append("s).")
                    .append(" Hay noi cham hon, tung tu ro rang.");
        } else if (durationSeconds < expectedMin) {
            feedback.append(" Thoi luong hoi ngan (").append(String.format("%.1f", durationSeconds)).append("s).")
                    .append(" Can mo rong am va phat am ro tung tu.");
        } else if (durationSeconds > expectedMax * 1.2) {
            feedback.append(" Thoi luong qua dai (").append(String.format("%.1f", durationSeconds)).append("s).")
                    .append(" Can giam toc do va noi tu nhien hon.");
        } else if (durationSeconds > expectedMax) {
            feedback.append(" Thoi luong hoi dai (").append(String.format("%.1f", durationSeconds)).append("s).")
                    .append(" Hay noi nhanh tu nhien hon.");
        } else {
            feedback.append(" Thoi luong phu hop (").append(String.format("%.1f", durationSeconds)).append("s).");
        }

        if (StringUtils.hasText(exercise.getFocusSkill())) {
            feedback.append(" Trong tam: ").append(exercise.getFocusSkill()).append(".");
        }

        if (teacherReviewRecommended) {
            feedback.append(" Bai nay can giao vien kiem tra them de danh gia chuyen sau.");
        } else {
            feedback.append(" Bai nop hop le, cho giao vien review.");
        }

        return feedback.toString();
    }

    private void deleteSubmissionAudioFiles(List<PronunciationSubmission> submissions) {
        List<Path> directoriesToClean = new ArrayList<>();

        for (PronunciationSubmission submission : submissions) {
            if (!StringUtils.hasText(submission.getAudioPath())) {
                continue;
            }

            Path audioPath = Paths.get(submission.getAudioPath()).toAbsolutePath().normalize();
            directoriesToClean.add(audioPath.getParent());

            try {
                Files.deleteIfExists(audioPath);
            } catch (IOException ex) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to delete stored audio file");
            }
        }

        for (Path directory : directoriesToClean) {
            deleteEmptyDirectory(directory);
        }
    }

    private void deleteEmptyDirectory(Path directory) {
        if (directory == null) {
            return;
        }

        try {
            if (!Files.exists(directory)) {
                return;
            }

            try (var stream = Files.list(directory)) {
                if (stream.findAny().isPresent()) {
                    return;
                }
            }

            Files.deleteIfExists(directory);
            deleteEmptyDirectory(directory.getParent());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to clean up audio storage");
        }
    }

    private String storeAudioFile(PronunciationExercise exercise, User student, MultipartFile audioFile, int attemptNumber) {
        try {
            Path rootDir = Paths.get(audioUploadDir).toAbsolutePath().normalize();
            Path exerciseDir = rootDir.resolve("exercise-" + exercise.getId()).resolve("student-" + student.getId());
            Files.createDirectories(exerciseDir);

            String originalName = StringUtils.cleanPath(Objects.requireNonNullElse(audioFile.getOriginalFilename(), "audio.bin"));
            String extension = "";
            int extensionIndex = originalName.lastIndexOf('.');
            if (extensionIndex >= 0) {
                extension = originalName.substring(extensionIndex);
            }

            String filename = "attempt-" + attemptNumber + "-" + UUID.randomUUID() + extension;
            Path destination = exerciseDir.resolve(filename).normalize();
            Files.copy(audioFile.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            return destination.toString();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store audio file");
        }
    }

    private void validateAudioFile(MultipartFile audioFile, Double durationSeconds) {
        if (audioFile == null || audioFile.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Audio file is required");
        }

        if (durationSeconds == null || durationSeconds <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Audio duration must be greater than zero");
        }

        String contentType = Objects.requireNonNullElse(audioFile.getContentType(), "").toLowerCase(Locale.ROOT);
        String originalFilename = Objects.requireNonNullElse(audioFile.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        boolean hasSupportedExtension = originalFilename.endsWith(".mp3")
                || originalFilename.endsWith(".wav")
                || originalFilename.endsWith(".m4a")
                || originalFilename.endsWith(".ogg")
                || originalFilename.endsWith(".aac")
                || originalFilename.endsWith(".flac")
                || originalFilename.endsWith(".webm")
                || originalFilename.endsWith(".mp4");

        boolean isValidType = contentType.startsWith("audio/")
                || contentType.equals("application/octet-stream")
                || contentType.startsWith("video/webm")
                || hasSupportedExtension;

        if (!isValidType) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Uploaded file must be a supported audio format such as mp3, wav, m4a, ogg, aac, flac or webm");
        }
    }

    private PronunciationExerciseResponse toExerciseResponse(
            PronunciationExercise exercise,
            boolean includeSubmissions,
            User currentUser) {
        List<PronunciationSubmissionResponse> submissions = includeSubmissions
                ? resolveExerciseSubmissions(exercise, currentUser)
                : null;

        return PronunciationExerciseResponse.builder()
                .id(exercise.getId())
                .classroomId(exercise.getClassroom().getId())
                .classroomName(exercise.getClassroom().getName())
                .title(exercise.getTitle())
                .referenceText(exercise.getReferenceText())
                .description(exercise.getDescription())
                .focusSkill(exercise.getFocusSkill())
                .difficultyLevel(exercise.getDifficultyLevel())
                .maxAttempts(exercise.getMaxAttempts())
                .submissionCount(exercise.getSubmissions().size())
                .createdAt(exercise.getCreatedAt())
                .createdByName(exercise.getCreatedBy().getFullname())
                .submissions(submissions)
                .build();
    }

    private List<PronunciationSubmissionResponse> resolveExerciseSubmissions(PronunciationExercise exercise, User currentUser) {
        List<PronunciationSubmission> submissions;
        if (currentUser.getRole().getName() == RoleName.STUDENT) {
            submissions = submissionRepository.findByExerciseIdAndStudentIdOrderBySubmittedAtDesc(exercise.getId(), currentUser.getId());
        } else {
            submissions = submissionRepository.findByExerciseIdOrderBySubmittedAtDesc(exercise.getId());
        }

        return submissions.stream()
                .sorted(Comparator.comparing(PronunciationSubmission::getSubmittedAt).reversed())
                .map(this::toSubmissionResponse)
                .toList();
    }

    private PronunciationSubmissionResponse toSubmissionResponse(PronunciationSubmission submission) {
        return PronunciationSubmissionResponse.builder()
                .id(submission.getId())
                .studentId(submission.getStudent().getId())
                .studentName(submission.getStudent().getFullname())
                .studentEmail(submission.getStudent().getEmail())
                .audioUrl("/api/pronunciation/submissions/" + submission.getId() + "/audio")
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
                .reviewedByName(submission.getReviewedBy() != null ? submission.getReviewedBy().getFullname() : null)
                .reviewStatus(submission.getReviewStatus().name())
                .reviewedAt(submission.getReviewedAt())
                .submittedAt(submission.getSubmittedAt())
                .build();
    }

    private void validateExerciseRequest(PronunciationExerciseRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        if (!StringUtils.hasText(request.getTitle())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Exercise title is required");
        }
        if (!StringUtils.hasText(request.getReferenceText())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reference text is required");
        }
    }

    private void validateReviewRequest(PronunciationReviewRequest request) {
        if (request == null || request.getTeacherScore() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Teacher score is required");
        }

        if (request.getTeacherScore() < 0 || request.getTeacherScore() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Teacher score must be between 0 and 100");
        }
    }

    private Integer normalizeDifficulty(Integer difficultyLevel) {
        if (difficultyLevel == null) {
            return 1;
        }
        return Math.min(5, Math.max(1, difficultyLevel));
    }

    private Integer normalizeMaxAttempts(Integer maxAttempts) {
        if (maxAttempts == null) {
            return 3;
        }
        return Math.min(10, Math.max(1, maxAttempts));
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Classroom getClassroom(Long classroomId) {
        return classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Classroom not found"));
    }

    private PronunciationExercise getExercise(Long exerciseId) {
        return exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pronunciation exercise not found"));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private void ensureTeacherOrAdminCanManageClassroom(Classroom classroom, User currentUser) {
        RoleName roleName = currentUser.getRole().getName();
        if (roleName == RoleName.ADMIN) {
            return;
        }

        if (roleName == RoleName.TEACHER && classroom.getTeacher() != null
                && Objects.equals(classroom.getTeacher().getId(), currentUser.getId())) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to manage pronunciation for this classroom");
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

        if (roleName == RoleName.STUDENT && classroom.getStudents().stream()
                .anyMatch(student -> Objects.equals(student.getId(), currentUser.getId()))) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No permission to access this classroom");
    }

    private record BasicScore(
            int completenessScore,
            int fluencyScore,
            int consistencyScore,
            int overallScore,
            String feedback,
            ReviewStatus reviewStatus) {
    }
}
