package com.nhom04.english.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nhom04.english.dto.UpdateProfileRequest;
import com.nhom04.english.dto.UserResponse;
import com.nhom04.english.entity.User;
import com.nhom04.english.service.AuthService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentProfile(Authentication authentication) {
        User user = authService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateCurrentProfile(
            @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        User updatedUser = authService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(authService.toUserResponse(updatedUser));
    }
}
