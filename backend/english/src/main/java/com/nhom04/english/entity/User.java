package com.nhom04.english.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Column(nullable = false)
    private String fullname;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(length = 255)
    private String avatarUrl;

    @Column(length = 1000)
    private String bio;

    private LocalDate dateOfBirth;

    @Column(length = 20)
    private String gender;

    @Column(length = 100)
    private String department;

    @Column(length = 100)
    private String specialization;

    @Column(length = 50, unique = true)
    private String studentCode;

    @Column(length = 50, unique = true)
    private String teacherCode;

    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Role role;

    @OneToMany(mappedBy = "teacher")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Classroom> teachingClassrooms = new HashSet<>();

    @ManyToMany(mappedBy = "teachers")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Classroom> managedClassrooms = new HashSet<>();

    @ManyToMany(mappedBy = "students")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Classroom> joinedClassrooms = new HashSet<>();

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "reset_otp")
    private String resetOtp;

    @Column(name = "reset_expire")
    private Long resetExpire;

    @Column(name = "active_session_id", length = 120)
    private String activeSessionId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
