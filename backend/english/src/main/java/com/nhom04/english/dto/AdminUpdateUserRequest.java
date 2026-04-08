package com.nhom04.english.dto;

import com.nhom04.english.entity.Role.RoleName;

import lombok.Data;

@Data
public class AdminUpdateUserRequest extends UpdateProfileRequest {
    private String username;
    private String fullname;
    private String email;
    private RoleName role;
    private String studentCode;
    private String teacherCode;
}
