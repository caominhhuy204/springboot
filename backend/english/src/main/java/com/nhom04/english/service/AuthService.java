package com.nhom04.english.service;

import java.util.UUID;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.nhom04.english.dto.ChangePasswordRequest;
import com.nhom04.english.dto.LoginRequest;
import com.nhom04.english.dto.RegisterRequest;
import com.nhom04.english.dto.UpdateProfileRequest;
import com.nhom04.english.dto.UserResponse;
import com.nhom04.english.entity.Role;
import com.nhom04.english.entity.Role.RoleName;
import com.nhom04.english.entity.User;
import com.nhom04.english.repository.RoleRepository;
import com.nhom04.english.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.reset-password-path:/verify-otp}")
    private String resetPasswordPath;

    public User register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Password and Confirm Password do not match");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        Role role = roleRepository.findByName(RoleName.STUDENT)
                .orElseThrow(() -> new RuntimeException("Role STUDENT not found"));

        User user = new User();
        user.setUsername(request.getUsername());
        user.setFullname(request.getFullname());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);

        return userRepository.save(user);
    }

    @Transactional
    public String login(LoginRequest request) {
        String identifier = request.getEmail() == null ? "" : request.getEmail().trim();
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email, username, hoặc mật khẩu không đúng"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email, username, hoặc mật khẩu không đúng");
        }

        String sessionId = UUID.randomUUID().toString();
        user.setActiveSessionId(sessionId);
        userRepository.save(user);

        return jwtService.generateToken(
                user.getEmail(),
                user.getRole().getName().name(),
                user.getUsername(),
                sessionId);
    }

    public String refreshToken(String token) {
        String email = jwtService.extractEmail(token);
        if (email == null) {
            throw new RuntimeException("Invalid token");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String sessionId = jwtService.extractSessionId(token);
        if (sessionId == null || user.getActiveSessionId() == null || !sessionId.equals(user.getActiveSessionId())) {
            throw new RuntimeException("Session expired");
        }

        return jwtService.generateToken(
                user.getEmail(),
                user.getRole().getName().name(),
                user.getUsername(),
                sessionId);
    }

    public User getUserFromToken(String token) {
        String email = jwtService.extractEmail(token);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public String extractTokenFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
          String headerToken = authHeader.substring(7).trim();
          if (!headerToken.isEmpty()) {
              return headerToken;
          }
        }

        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public User updateProfile(String email, UpdateProfileRequest request) {
        User user = getUserByEmail(email);

        if (request.getFullname() != null && !request.getFullname().isBlank()) {
            user.setFullname(request.getFullname().trim());
        }

        user.setPhone(normalizeOptionalValue(request.getPhone()));
        user.setAddress(normalizeOptionalValue(request.getAddress()));
        user.setAvatarUrl(normalizeOptionalValue(request.getAvatarUrl()));
        user.setBio(normalizeOptionalValue(request.getBio()));
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(normalizeOptionalValue(request.getGender()));
        user.setDepartment(normalizeOptionalValue(request.getDepartment()));
        user.setSpecialization(normalizeOptionalValue(request.getSpecialization()));

        return userRepository.save(user);
    }

    @Transactional
    public void invalidateSession(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        try {
            String email = jwtService.extractEmail(token);
            String sessionId = jwtService.extractSessionId(token);
            User user = getUserByEmail(email);
            if (sessionId != null && sessionId.equals(user.getActiveSessionId())) {
                user.setActiveSessionId(null);
                userRepository.save(user);
            }
        } catch (Exception ignored) {
        }
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found"));

        String rawToken = UUID.randomUUID().toString();
        String hashedToken = DigestUtils.sha256Hex(rawToken);

        String otp = String.valueOf((int) (Math.random() * 900000) + 100000);
        String hashedOtp = passwordEncoder.encode(otp);

        user.setResetToken(hashedToken);
        user.setResetOtp(hashedOtp);
        user.setResetExpire(System.currentTimeMillis() + 10 * 60 * 1000);

        userRepository.save(user);

        String link = buildFrontendUrl(resetPasswordPath) + "?token=" + rawToken;

        emailService.sendEmail(
                user.getEmail(),
                "Reset Password",
                "Link: " + link + "\nOTP: " + otp);
    }

    public User verifyTokenAndOtp(String rawToken, String otpInput) {
        String hashedToken = DigestUtils.sha256Hex(rawToken);
        User user = userRepository.findByResetToken(hashedToken)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (user.getResetExpire() < System.currentTimeMillis()) {
            throw new RuntimeException("Token expired");
        }

        if (!passwordEncoder.matches(otpInput, user.getResetOtp())) {
            throw new RuntimeException("Invalid OTP");
        }

        user.setResetOtp(null);
        return userRepository.save(user);
    }

    public void resetPassword(String rawToken, String newPassword) {
        String hashedToken = DigestUtils.sha256Hex(rawToken);
        User user = userRepository.findByResetToken(hashedToken)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với token này"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetOtp(null);
        user.setResetExpire(null);
        user.setActiveSessionId(null);

        userRepository.save(user);
    }

    public User adminCreateUser(RegisterRequest request, RoleName roleName) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã tồn tại");
        }

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username đã tồn tại");
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role không tìm thấy: " + roleName));

        User user = new User();
        user.setUsername(request.getUsername());
        user.setFullname(request.getFullname());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác!");
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new RuntimeException("Mật khẩu mới và xác nhận không khớp!");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu mới không được giống mật khẩu cũ!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setActiveSessionId(null);
        userRepository.save(user);
    }

    public UserResponse toUserResponse(User user) {
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

    private String buildFrontendUrl(String path) {
        String normalizedBase = frontendUrl.endsWith("/")
                ? frontendUrl.substring(0, frontendUrl.length() - 1)
                : frontendUrl;
        String normalizedPath = path.startsWith("/") ? path : "/" + path;
        return normalizedBase + normalizedPath;
    }

    private String normalizeOptionalValue(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
