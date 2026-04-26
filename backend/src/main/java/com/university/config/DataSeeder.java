package com.university.config;

import com.university.entity.User;
import com.university.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

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

            userRepository.save(admin);
            log.warn("Default admin user created (username: admin, password: admin123). " +
                 "Please change the default credentials immediately.");
        }

        if (userRepository.findByRoleAndSpecialization("TECHNICIAN", "ELECTRICIAN").isEmpty()) {
            userRepository.save(User.builder()
                .username("electrician1")
                .email("electrician1@smartcampus.edu")
                .password(passwordEncoder.encode("password123"))
                .role("TECHNICIAN")
                .specialization("ELECTRICIAN")
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build());
        }

        if (userRepository.findByRoleAndSpecialization("TECHNICIAN", "TECHNICIAN").isEmpty()) {
            userRepository.save(User.builder()
                .username("technician1")
                .email("technician1@smartcampus.edu")
                .password(passwordEncoder.encode("password123"))
                .role("TECHNICIAN")
                .specialization("TECHNICIAN")
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build());
        }

        if (userRepository.findByRoleAndSpecialization("TECHNICIAN", "IT_ASSISTANT").isEmpty()) {
            userRepository.save(User.builder()
                .username("itassistant1")
                .email("itassistant1@smartcampus.edu")
                .password(passwordEncoder.encode("password123"))
                .role("TECHNICIAN")
                .specialization("IT_ASSISTANT")
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build());
        }
    }
}
