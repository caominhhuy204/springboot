package com.nhom04.english.config;

import com.nhom04.english.entity.Role;
import com.nhom04.english.entity.Role.RoleName;
import com.nhom04.english.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        if (roleRepository.count() == 0) {
            System.out.println(">>> Bảng Role trống, đang khởi tạo dữ liệu mẫu...");
            
            Arrays.stream(RoleName.values()).forEach(roleName -> {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
            });
            
            System.out.println(">>> Đã khởi tạo xong các Role: ADMIN, TEACHER, STUDENT");
        } else {
            System.out.println(">>> Bảng Role đã có dữ liệu, bỏ qua bước khởi tạo.");
        }
    }
}