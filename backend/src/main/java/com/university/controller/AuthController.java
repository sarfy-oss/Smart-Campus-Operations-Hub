package com.university.controller;

import com.university.config.JwtUtil;
import com.university.config.UserDetailsServiceImpl;
import com.university.dto.ChangePasswordRequestDTO;
import com.university.dto.CreateUserDTO;
import com.university.dto.GoogleAuthRequest;
import com.university.dto.LoginRequestDTO;
import com.university.dto.LoginResponseDTO;
import com.university.dto.RegisterRequestDTO;
import com.university.dto.UpdateProfileRequestDTO;
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
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
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

    private static final Pattern EMAIL_REGEX =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

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
        String normalizedUsername = request.getUsername().trim().toLowerCase(Locale.ROOT);

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
        User user = resolveCurrentUser(authentication);
        return ResponseEntity.ok(Map.of(
                "id", safeId(user),
                "username", safeUsername(user),
                "role", safeRole(user),
                "email", safeEmail(user)
        ));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequestDTO request
    ) {
        User user = resolveCurrentUser(authentication);
        String normalizedUsername = request.getUsername().trim().toLowerCase(Locale.ROOT);

        if (!normalizedUsername.equals(user.getUsername()) && userRepository.existsByUsername(normalizedUsername)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Username already taken"));
        }

        String normalizedEmail = request.getEmail() == null
                ? ""
                : request.getEmail().trim().toLowerCase(Locale.ROOT);

        if (!isEmailValidOrBlank(normalizedEmail)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please provide a valid email address"));
        }

        user.setUsername(normalizedUsername);
        user.setEmail(normalizedEmail);
        User saved = userRepository.save(user);

        UserDetails updatedUserDetails = userDetailsService.loadUserByUsername(saved.getUsername());
        String refreshedToken = jwtUtil.generateToken(updatedUserDetails);

        return ResponseEntity.ok(Map.of(
                "id", safeId(saved),
                "token", refreshedToken,
                "username", safeUsername(saved),
                "role", safeRole(saved),
                "email", safeEmail(saved)
        ));
    }

    @PutMapping("/me/password")
    public ResponseEntity<?> changeMyPassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequestDTO request
    ) {
        User user = resolveCurrentUser(authentication);
        String storedPassword = user.getPassword();

        if (storedPassword == null || storedPassword.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Password changes are unavailable for this account"));
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), storedPassword)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Current password is incorrect"));
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "New password must be different from the current password"));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Map<String, String>> deleteMyAccount(Authentication authentication) {
        User user = resolveCurrentUser(authentication);
        userRepository.deleteById(user.getId());
        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = userRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserDTO request) {
        String normalizedUsername = request.getUsername().trim().toLowerCase(Locale.ROOT);

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
            String newUsername = updates.get("username").toString().trim().toLowerCase(Locale.ROOT);
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

    private boolean isEmailValidOrBlank(String email) {
        return email == null || email.isBlank() || EMAIL_REGEX.matcher(email).matches();
    }

    private String safeEmail(User user) {
        return user.getEmail() == null ? "" : user.getEmail();
    }

    private String safeId(User user) {
        return user.getId() == null ? "" : user.getId();
    }

    private String safeUsername(User user) {
        return user.getUsername() == null ? "" : user.getUsername();
    }

    private String safeRole(User user) {
        return user.getRole() == null || user.getRole().isBlank() ? "USER" : user.getRole();
    }

    private User resolveCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }

        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user was not found"));
    }
}
