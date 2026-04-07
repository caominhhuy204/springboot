package com.nhom04.english.service;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;

import com.nhom04.english.dto.ChangePasswordRequest;
import com.nhom04.english.dto.LoginRequest;
import com.nhom04.english.dto.RegisterRequest;
import com.nhom04.english.entity.Role;
import com.nhom04.english.entity.Role.RoleName;
import com.nhom04.english.entity.User;
import com.nhom04.english.repository.RoleRepository;
import com.nhom04.english.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final EmailService emailService;
    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;
    @Value("${app.reset-password-path:/verify-otp}")
    private String resetPasswordPath;

    public User register(RegisterRequest request) {

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Password and Confirm Password do not match");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        Role role = roleRepository.findByName(RoleName.STUDENT)
                .orElseThrow(() -> new RuntimeException("Role STUDENT not found"));

        User user = new User();
        user.setUsername(request.getUsername());
        user.setFullname(request.getFullname());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);

        return userRepository.save(user);
    }

    public String login(LoginRequest request) {
        String identifier = request.getEmail() == null ? "" : request.getEmail().trim();
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email, username, hoặc mật khẩu không đúng"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email, username, hoặc mật khẩu không đúng");
        }

        return jwtService.generateToken(
                user.getEmail(),
                user.getRole().getName().name(),
                user.getUsername());
    }

    public String refreshToken(String token) {

        String email = jwtService.extractEmail(token);

        if (email == null) {
            throw new RuntimeException("Invalid token");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String roleName = user.getRole().getName().name();

        return jwtService.generateToken(
                user.getEmail(),
                roleName,
                user.getUsername());
    }

    public User getUserFromToken(String token) {

        String email = jwtService.extractEmail(token);

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public String extractTokenFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String headerToken = authHeader.substring(7).trim();
            if (!headerToken.isEmpty()) {
                return headerToken;
            }
        }

        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void forgotPassword(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found"));

        String rawToken = UUID.randomUUID().toString();
        String hashedToken = DigestUtils.sha256Hex(rawToken);

        String otp = String.valueOf((int) (Math.random() * 900000) + 100000);
        String hashedOtp = passwordEncoder.encode(otp);

        user.setResetToken(hashedToken);
        user.setResetOtp(hashedOtp);
        user.setResetExpire(System.currentTimeMillis() + 10 * 60 * 1000);

        userRepository.save(user);

        String link = buildFrontendUrl(resetPasswordPath) + "?token=" + rawToken;

        emailService.sendEmail(
                user.getEmail(),
                "Reset Password",
                "Link: " + link + "\nOTP: " + otp);
    }

    public User verifyTokenAndOtp(String rawToken, String otpInput) {
        String hashedToken = DigestUtils.sha256Hex(rawToken);

        User user = userRepository.findByResetToken(hashedToken)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (user.getResetExpire() < System.currentTimeMillis()) {
            throw new RuntimeException("Token expired");
        }

        if (!passwordEncoder.matches(otpInput, user.getResetOtp())) {
            throw new RuntimeException("Invalid OTP");
        }

        user.setResetOtp(null);
        return userRepository.save(user);
    }

    public void resetPassword(String rawToken, String newPassword) {
        String hashedToken = DigestUtils.sha256Hex(rawToken);
        User user = userRepository.findByResetToken(hashedToken)
                .orElseThrow(() -> new RuntimeException("LỖI: Không tìm thấy User với Token này trong DB!"));

        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedPassword);

        user.setResetToken(null);
        user.setResetOtp(null);
        user.setResetExpire(null);

        userRepository.save(user);
        System.out.println("== ĐÃ LƯU MẬT KHẨU MỚI THÀNH CÔNG == ");
    }

    public User adminCreateUser(RegisterRequest request, RoleName roleName) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã tồn tại");
        }

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username đã tồn tại");
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role không tìm thấy: " + roleName));

        User user = new User();
        user.setUsername(request.getUsername());
        user.setFullname(request.getFullname());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác!");
        }

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new RuntimeException("Mật khẩu mới và xác nhận không khớp!");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu mới không được giống mật khẩu cũ!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private String buildFrontendUrl(String path) {
        String normalizedBase = frontendUrl.endsWith("/")
                ? frontendUrl.substring(0, frontendUrl.length() - 1)
                : frontendUrl;
        String normalizedPath = path.startsWith("/") ? path : "/" + path;
        return normalizedBase + normalizedPath;
    }
}
