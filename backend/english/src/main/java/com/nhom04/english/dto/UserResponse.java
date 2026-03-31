package com.nhom04.english.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String fullname;
    private String email;
    private String role;
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
}
