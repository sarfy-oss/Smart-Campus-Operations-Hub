package com.university.controller;

import com.university.config.JwtUtil;
import com.university.config.UserDetailsServiceImpl;
import com.university.dto.CreateUserDTO;
import com.university.dto.GoogleAuthRequest;
import com.university.dto.LoginRequestDTO;
import com.university.dto.LoginResponseDTO;
import com.university.dto.RegisterRequestDTO;
import com.university.dto.UserResponseDTO;
import com.university.entity.User;
import com.university.repository.UserRepository;
import com.university.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {
        "http://localhost",
        "http://localhost:*",
        "http://[::1]",
        "http://[::1]:*",
        "http://127.0.0.1:*",
        "https://localhost",
        "https://localhost:*",
        "https://127.0.0.1:*",
        "https://[::1]",
        "https://[::1]:*"
})
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password"));
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        String token = jwtUtil.generateToken(userDetails);

        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        return ResponseEntity.ok(new LoginResponseDTO(token, user.getUsername(), user.getRole()));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequestDTO request) {
        String normalizedUsername = request.getUsername().trim().toLowerCase();

        if (userRepository.existsByUsername(normalizedUsername)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Username already exists"));
        }

        User user = User.builder()
                .username(normalizedUsername)
                .password(passwordEncoder.encode(request.getPassword()))
                .role("USER")
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Account created successfully"));
    }

    @PostMapping("/student/google")
    public ResponseEntity<LoginResponseDTO> loginStudentWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(authService.loginStudentWithGoogle(request.getToken()));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "role", user.getRole(),
                "email", user.getEmail() != null ? user.getEmail() : ""
        ));
    }

    // ── Admin: User Management ────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = userRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserDTO request) {
        String normalizedUsername = request.getUsername().trim().toLowerCase();

        if (userRepository.existsByUsername(normalizedUsername)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Username already exists"));
        }

        String role = normalizeRole(request.getRole());
        if (!role.matches("^[A-Z0-9_\\-]+$")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role value"));
        }

        User user = User.builder()
                .username(normalizedUsername)
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .enabled(true)
                .createdAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponseDTO(saved));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        if (updates.containsKey("username")) {
            String newUsername = updates.get("username").toString().trim().toLowerCase();
            if (newUsername.length() < 3) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username must be at least 3 characters"));
            }
            if (!newUsername.equals(user.getUsername()) && userRepository.existsByUsername(newUsername)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Username already taken"));
            }
            user.setUsername(newUsername);
        }

        if (updates.containsKey("password")) {
            String newPassword = updates.get("password").toString();
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters"));
            }
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        if (updates.containsKey("email")) {
            user.setEmail(updates.get("email").toString());
        }

        if (updates.containsKey("role")) {
            String normalizedRole = normalizeRole(updates.get("role"));
            if (!normalizedRole.matches("^[A-Z0-9_\\-]+$")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid role value"));
            }
            user.setRole(normalizedRole);
        }

        if (updates.containsKey("enabled")) {
            user.setEnabled(Boolean.parseBoolean(updates.get("enabled").toString()));
        }

        User saved = userRepository.save(user);
        return ResponseEntity.ok(toResponseDTO(saved));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable String id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    private UserResponseDTO toResponseDTO(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt()
        );
    }

    private String normalizeRole(Object roleInput) {
        if (roleInput == null) {
            return "USER";
        }

        String role = roleInput.toString().trim().toUpperCase(Locale.ROOT);
        return role.isEmpty() ? "USER" : role;
    }
}
