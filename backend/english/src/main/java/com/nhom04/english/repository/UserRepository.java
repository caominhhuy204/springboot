package com.nhom04.english.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.nhom04.english.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByResetToken(String resetToken);

    Optional<User> findByUsername(String username);

    long countByRole_Name(com.nhom04.english.entity.Role.RoleName roleName);

    // Count users created after a specific date (for pending/new accounts)
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :since")
    long countCreatedAfter(@Param("since") LocalDateTime since);

    // Get user count by role created in a specific month (for monthly stats)
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.name = :roleName AND u.createdAt >= :since")
    long countByRoleNameAndCreatedAfter(@Param("roleName") com.nhom04.english.entity.Role.RoleName roleName, @Param("since") LocalDateTime since);
}
