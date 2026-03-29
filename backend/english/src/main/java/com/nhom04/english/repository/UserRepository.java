package com.nhom04.english.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nhom04.english.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByResetToken(String resetToken);
}