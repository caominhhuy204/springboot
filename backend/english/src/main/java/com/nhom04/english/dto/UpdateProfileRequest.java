package com.nhom04.english.dto;

import java.time.LocalDate;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullname;
    private String phone;
    private String address;
    private String avatarUrl;
    private String bio;
    private LocalDate dateOfBirth;
    private String gender;
    private String department;
    private String specialization;
}
