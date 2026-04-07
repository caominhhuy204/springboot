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

        createDefaultUser(
                "admin@learneng.local",
                "admin",
                "System Administrator",
                "Admin@123",
                RoleName.ADMIN,
                null);

        createDefaultUser(
                "teacher@learneng.local",
                "teacher",
                "Default Teacher",
                "Teacher@123",
                RoleName.TEACHER,
                "GV001");
    }

    private void createDefaultUser(
            String email,
            String username,
            String fullname,
            String rawPassword,
            RoleName roleName,
            String teacherCode) {
        if (userRepository.findByEmail(email).isPresent()) {
            return;
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role " + roleName + " not found"));

        User user = new User();
        user.setUsername(username);
        user.setFullname(fullname);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setTeacherCode(teacherCode);

        userRepository.save(user);
    }
}
