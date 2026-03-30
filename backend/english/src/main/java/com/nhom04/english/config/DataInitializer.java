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
import com.nhom04.english.entity.Exam;
import com.nhom04.english.entity.Question;
import com.nhom04.english.entity.QuestionType;
import com.nhom04.english.repository.ExamRepository;
import com.nhom04.english.repository.QuestionRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;

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

        if (examRepository.count() == 0) {
            Exam mockExam = new Exam();
            mockExam.setTitle("Mock English Test");
            mockExam.setDescription("This is an auto-generated exam for testing TV5 features.");
            mockExam.setTimeLimitMinutes(60);
            mockExam.setActive(true);
            Exam savedExam = examRepository.save(mockExam);

            Question q1 = new Question();
            q1.setExam(savedExam);
            q1.setContent("What is the capital of Vietnam?");
            q1.setType(QuestionType.MULTIPLE_CHOICE);
            q1.setOptions("[\"Hanoi\", \"Ho Chi Minh\", \"Da Nang\", \"Hue\"]");
            q1.setCorrectAnswer("Hanoi");
            q1.setPoints(1.0);
            questionRepository.save(q1);

            Question q2 = new Question();
            q2.setExam(savedExam);
            q2.setContent("The sky is ____.");
            q2.setType(QuestionType.FILL_IN_BLANK);
            q2.setCorrectAnswer("blue");
            q2.setPoints(1.0);
            questionRepository.save(q2);
        }
    }
}
