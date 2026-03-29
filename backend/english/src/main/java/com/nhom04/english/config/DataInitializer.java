package com.nhom04.english.config;

import java.util.Arrays;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.nhom04.english.entity.Role;
import com.nhom04.english.entity.Role.RoleName;
import com.nhom04.english.entity.User;
import com.nhom04.english.repository.RoleRepository;
import com.nhom04.english.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (roleRepository.count() == 0) {
            Arrays.stream(RoleName.values()).forEach(roleName -> {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
            });
        }

        if (userRepository.findByEmail("admin@learneng.local").isEmpty()) {
            Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                    .orElseThrow(() -> new RuntimeException("Role ADMIN not found"));

            User admin = new User();
            admin.setUsername("admin");
            admin.setFullname("System Administrator");
            admin.setEmail("admin@learneng.local");
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setRole(adminRole);

            userRepository.save(admin);
        }
    }
}
