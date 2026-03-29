package com.nhom04.english.dto;

import java.time.LocalDate;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserProfileResponse {
    Long id;
    String username;
    String fullname;
    String email;
    String role;
    String phone;
    String address;
    String avatarUrl;
    String bio;
    LocalDate dateOfBirth;
    String gender;
    String department;
    String specialization;
    String studentCode;
    String teacherCode;
}
