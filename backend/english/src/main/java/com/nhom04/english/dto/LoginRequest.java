package com.nhom04.english.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}