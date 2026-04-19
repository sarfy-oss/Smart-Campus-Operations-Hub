package com.university.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.university.config.JwtUtil;
import com.university.config.UserDetailsServiceImpl;
import com.university.dto.LoginResponseDTO;
import com.university.entity.Role;
import com.university.entity.User;
import com.university.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtil jwtUtil;

    @Value("${google.client.id}")
    private String googleClientId;

    public LoginResponseDTO loginStudentWithGoogle(String token) {
        GoogleIdToken.Payload payload = verifyGoogleToken(token);

        String email = extractNormalizedEmail(payload);
        String hostedDomain = payload.getHostedDomain();

        log.info(
                "Google login attempt: email={}, hostedDomain={}",
                email,
                hostedDomain
        );

        User user = findOrCreateGoogleStudent(email);
        if (!user.isEnabled()) {
            // Temporary behavior: re-enable disabled users when they prove ownership via Google.
            log.warn("Re-enabling disabled account during Google auth. username={}", user.getUsername());
            user.setEnabled(true);
            user = userRepository.save(user);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String appToken = jwtUtil.generateToken(userDetails);
        return new LoginResponseDTO(appToken, user.getUsername(), user.getRole().name());
    }

    private String extractNormalizedEmail(GoogleIdToken.Payload payload) {
        if (!StringUtils.hasText(payload.getEmail())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google account email is missing");
        }

        String email = payload.getEmail().trim().toLowerCase(Locale.ROOT);
        if (!StringUtils.hasText(email)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google account email is missing");
        }

        Object emailVerified = payload.get("email_verified");
        if (!(emailVerified instanceof Boolean verified) || !verified) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google account email is not verified");
        }

        return email;
    }

    private User findOrCreateGoogleStudent(String email) {
        return userRepository.findByUsername(email)
                .or(() -> userRepository.findByEmailIgnoreCase(email))
                .orElseGet(() -> createGoogleStudent(email));
    }

    private User createGoogleStudent(String email) {
        User user = User.builder()
                .username(email)
                .email(email)
                // Random password allows future password reset flow without storing raw Google token.
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(Role.USER)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();

        return userRepository.save(user);
    }

    private GoogleIdToken.Payload verifyGoogleToken(String idTokenString) {
        if (!StringUtils.hasText(idTokenString)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google token is required");
        }

        log.info(
                "Verifying Google ID token. configuredAudience={}, tokenLength={}",
                googleClientId,
                idTokenString.length()
        );

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        )
                .setAudience(Collections.singletonList(googleClientId))
                .setIssuers(Arrays.asList("https://accounts.google.com", "accounts.google.com"))
                .build();

        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
            }
            log.info("Google ID token verified successfully for audience={}", googleClientId);
            return idToken.getPayload();
        } catch (GeneralSecurityException | IOException ex) {
            log.warn("Google token verification failed: {}", ex.getMessage());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
        }
    }
}
