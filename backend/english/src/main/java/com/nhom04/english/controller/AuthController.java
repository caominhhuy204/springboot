package com.nhom04.english.controller;

import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpHeaders;

import com.nhom04.english.dto.ChangePasswordRequest;
import com.nhom04.english.dto.LoginRequest;
import com.nhom04.english.dto.RegisterRequest;
import com.nhom04.english.dto.ResetPasswordRequest;
import com.nhom04.english.dto.UserResponse;
import com.nhom04.english.entity.Role.RoleName;
import com.nhom04.english.entity.User;
import com.nhom04.english.service.AuthService;
import com.nhom04.english.repository.UserRepository;
import org.springframework.security.core.Authentication;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    @Value("${app.cookie.secure:true}")
    private boolean secureCookie;
    @Value("${app.cookie.same-site:None}")
    private String sameSite;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        User user = authService.register(request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", toUserResponse(user));

        return ResponseEntity.ok(response);
    }

    /**
     * Admin tạo tài khoản cho giáo viên hoặc học sinh
     */
    @PostMapping("/admin/create-user")
    public ResponseEntity<?> createUser(@RequestBody RegisterRequest request,
                                       @RequestParam(defaultValue = "STUDENT") String role) {
        try {
            RoleName roleName = RoleName.valueOf(role.toUpperCase());
            User user = authService.adminCreateUser(request, roleName);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", toUserResponse(user));
            response.put("message", "Tạo tài khoản " + roleName + " thành công!");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Role không hợp lệ: " + role));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String token = authService.login(request);

            ResponseCookie cookie = ResponseCookie.from("token", token)
                    .httpOnly(true)
                    .secure(secureCookie)
                    .sameSite(sameSite)
                    .path("/")
                    .maxAge(60 * 60 * 3)
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(Map.of(
                            "success", true,
                            "token", token));
        } catch (org.springframework.web.server.ResponseStatusException exception) {
            return ResponseEntity.status(exception.getStatusCode())
                    .body(Map.of(
                            "success", false,
                            "message", exception.getReason() == null ? "Đăng nhập thất bại" : exception.getReason()));
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {

        String token = authService.extractTokenFromRequest(request);

        if (token == null) {
            return ResponseEntity.status(401).body(Map.of("success", false));
        }

        final String newAccessToken;
        try {
            newAccessToken = authService.refreshToken(token);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Invalid token"));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "token", newAccessToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        authService.invalidateSession(authService.extractTokenFromRequest(request));

        ResponseCookie cookie = ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("message", "Logout successful"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        String email = authentication.getName();

        User user = authService.getUserByEmail(email);
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        authService.forgotPassword(email);
        return ResponseEntity.ok(Map.of("message", "Email sent successfully"));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String otp = request.get("otp");

        if (token == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token and OTP are required"));
        }

        authService.verifyTokenAndOtp(token, otp);

        return ResponseEntity.ok(Map.of("valid", true));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {

        if (request.getToken() == null || request.getNewPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu không đầy đủ"));
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu xác nhận không khớp!"));
        }

        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (RuntimeException e) {

            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request, Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        String email = authentication.getName();

        try {
            authService.changePassword(email, request);
            return ResponseEntity.ok(Map.of("message", "Thay đổi mật khẩu thành công!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Có lỗi hệ thống xảy ra!"));
        }
    }

    private UserResponse toUserResponse(User user) {
        return authService.toUserResponse(user);
    }
}
