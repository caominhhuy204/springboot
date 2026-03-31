package com.nhom04.english.controller;

import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import com.nhom04.english.dto.LoginRequest;
import com.nhom04.english.dto.RegisterRequest;
import com.nhom04.english.service.AuthService;
import com.nhom04.english.repository.UserRepository;
import com.nhom04.english.entity.User;
import org.springframework.security.core.Authentication;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
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

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        com.nhom04.english.dto.UserResponse response = new com.nhom04.english.dto.UserResponse();
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

        return ResponseEntity.ok(response);
    }
}
