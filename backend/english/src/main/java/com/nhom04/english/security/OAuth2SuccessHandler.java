package com.nhom04.english.security;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.nhom04.english.service.JwtService;
import com.nhom04.english.repository.UserRepository;
import com.nhom04.english.repository.RoleRepository;
import com.nhom04.english.entity.User;
import com.nhom04.english.entity.Role;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final String frontendUrl;
    private final String oauth2SuccessPath;

    public OAuth2SuccessHandler(
            JwtService jwtService,
            UserRepository userRepository,
            RoleRepository roleRepository,
            @org.springframework.context.annotation.Lazy PasswordEncoder passwordEncoder,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl,
            @Value("${app.oauth2-success-path:/oauth2-success}") String oauth2SuccessPath) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.frontendUrl = frontendUrl;
        this.oauth2SuccessPath = oauth2SuccessPath;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
        } else {
            user = new User();
            user.setEmail(email);
            user.setFullname(name != null ? name : email);
            user.setUsername(email); 
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            
            Role userRole = roleRepository.findByName(Role.RoleName.STUDENT)
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            user.setRole(userRole);
            
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().getName().name(), user.getFullname());

        String redirectUrl = normalizeBaseUrl(frontendUrl)
                + normalizePath(oauth2SuccessPath)
                + "?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        response.sendRedirect(redirectUrl);
    }

    private String normalizeBaseUrl(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private String normalizePath(String path) {
        return path.startsWith("/") ? path : "/" + path;
    }
}
