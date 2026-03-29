package com.nhom04.english.controller;

import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpHeaders;

import com.nhom04.english.dto.ChangePasswordRequest;
import com.nhom04.english.dto.LoginRequest;
import com.nhom04.english.dto.RegisterRequest;
import com.nhom04.english.dto.ResetPasswordRequest;
import com.nhom04.english.entity.User;
import com.nhom04.english.service.AuthService;
import org.springframework.security.core.Authentication;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        User user = authService.register(request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", user);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        String token = authService.login(request);

        ResponseCookie cookie = ResponseCookie.from("token", token)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(60 * 60 * 3)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of(
                        "success", true,
                        "token", token));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {

        String token = authService.extractTokenFromRequest(request);

        if (token == null) {
            return ResponseEntity.status(401).body(Map.of("success", false));
        }

        String newAccessToken = authService.refreshToken(token);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "token", newAccessToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {

        ResponseCookie cookie = ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(false)
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

        return ResponseEntity.ok(user);
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
}