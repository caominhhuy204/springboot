package com.nhom04.english.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nhom04.english.entity.Role;
import com.nhom04.english.entity.Role.RoleName;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(RoleName name); // dùng enum, không dùng String
}