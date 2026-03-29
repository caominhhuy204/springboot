package com.nhom04.english.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.nhom04.english.dto.AdminUpdateUserRequest;
import com.nhom04.english.dto.UpdateProfileRequest;
import com.nhom04.english.dto.UserProfileResponse;
import com.nhom04.english.entity.Role;
import com.nhom04.english.entity.User;
import com.nhom04.english.repository.RoleRepository;
import com.nhom04.english.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserProfileResponse getByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toResponse(user);
    }

    public UserProfileResponse updateOwnProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFullname(request.getFullname());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setAvatarUrl(request.getAvatarUrl());
        user.setBio(request.getBio());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());
        user.setDepartment(request.getDepartment());
        user.setSpecialization(request.getSpecialization());

        return toResponse(userRepository.save(user));
    }

    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public UserProfileResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toResponse(user);
    }

    public UserProfileResponse updateUserByAdmin(Long id, AdminUpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setUsername(request.getUsername());
        user.setFullname(request.getFullname());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        user.setAvatarUrl(request.getAvatarUrl());
        user.setBio(request.getBio());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());
        user.setDepartment(request.getDepartment());
        user.setSpecialization(request.getSpecialization());
        user.setStudentCode(request.getStudentCode());
        user.setTeacherCode(request.getTeacherCode());

        if (request.getRole() != null && !request.getRole().isBlank()) {
            Role.RoleName roleName = Role.RoleName.valueOf(request.getRole().trim().toUpperCase());
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found"));
            user.setRole(role);
        }

        return toResponse(userRepository.save(user));
    }

    public UserProfileResponse toResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullname(user.getFullname())
                .email(user.getEmail())
                .role(user.getRole().getName().name())
                .phone(user.getPhone())
                .address(user.getAddress())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .department(user.getDepartment())
                .specialization(user.getSpecialization())
                .studentCode(user.getStudentCode())
                .teacherCode(user.getTeacherCode())
                .build();
    }
}
