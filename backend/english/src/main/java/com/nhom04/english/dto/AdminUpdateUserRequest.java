package com.nhom04.english.dto;

import java.time.LocalDate;

import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    private String username;
    private String fullname;
    private String email;
    private String phone;
    private String address;
    private String avatarUrl;
    private String bio;
    private LocalDate dateOfBirth;
    private String gender;
    private String department;
    private String specialization;
    private String studentCode;
    private String teacherCode;
    private String role;
}
