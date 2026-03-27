package com.nhom04.english.controller;

import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import com.nhom04.english.dto.LoginRequest;
import com.nhom04.english.dto.RegisterRequest;
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
    public User register(@RequestBody RegisterRequest request) {
        System.out.println("jjjjjjjjjjjjjjjjjjjjjjjjjjjjj" + request);
        return authService.register(request);
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
}