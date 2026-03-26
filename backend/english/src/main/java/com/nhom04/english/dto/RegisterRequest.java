package com.nhom04.english.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String fullname;
    private String email;
    private String password;
    private String confirmPassword;
}
