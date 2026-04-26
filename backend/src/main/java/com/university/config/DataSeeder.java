package com.university.config;

import java.time.LocalDateTime;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.university.entity.User;
import com.university.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@smartcampus.edu")
                    .password(passwordEncoder.encode("admin123"))
                    .role("ADMIN")
                .specialization("ADMIN")
                    .enabled(true)
                    .createdAt(LocalDateTime.now())
                    .build();

            saveUserIfMissing(admin);
            log.warn("Default admin user created (username: admin, password: admin123). " +
                "Please change the default credentials immediately.");
        }

        seedTechnicianIfMissing("electrician1", "electrician1@smartcampus.edu", "ELECTRICIAN");
        seedTechnicianIfMissing("technician1", "technician1@smartcampus.edu", "TECHNICIAN");
        seedTechnicianIfMissing("itassistant1", "itassistant1@smartcampus.edu", "IT_ASSISTANT");
    }

    private void seedTechnicianIfMissing(String username, String email, String specialization) {
        if (userRepository.existsByUsername(username) || userRepository.findByEmailIgnoreCase(email).isPresent()) {
            return;
        }

        User technician = User.builder()
            .username(username)
            .email(email)
            .password(passwordEncoder.encode("password123"))
            .role("TECHNICIAN")
            .specialization(specialization)
            .enabled(true)
            .createdAt(LocalDateTime.now())
            .build();

        saveUserIfMissing(technician);
    }

    private void saveUserIfMissing(User user) {
        try {
            userRepository.save(user);
        } catch (DuplicateKeyException ex) {
            log.info("Skipping seed user '{}' because it already exists.", user.getUsername());
        }
    }
}
