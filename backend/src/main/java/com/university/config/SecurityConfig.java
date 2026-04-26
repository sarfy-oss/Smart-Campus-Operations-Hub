package com.university.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Swagger UI / OpenAPI docs (public)
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()

                // Public auth endpoints
                .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/auth/student/google").permitAll()
                .requestMatchers("/auth/login", "/auth/register", "/auth/student/google", "/auth/student/google/**").permitAll()

                // Admin-only user management
                .requestMatchers(HttpMethod.GET, "/auth/users").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/auth/users").hasRole("ADMIN")
                .requestMatchers("/auth/users/**").hasRole("ADMIN")

                // Authenticated user profile
                .requestMatchers(HttpMethod.GET, "/auth/me").authenticated()
                .requestMatchers(HttpMethod.PUT, "/auth/me").authenticated()
                .requestMatchers(HttpMethod.PUT, "/auth/me/password").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/auth/me").authenticated()

                // Resources: read for any authenticated user, write for admin only
                .requestMatchers(HttpMethod.GET, "/resources/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/resources/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/resources/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/resources/**").hasRole("ADMIN")

                // Notifications for authenticated users
                .requestMatchers("/notifications/**").authenticated()

                // Bookings - more specific paths FIRST
                .requestMatchers(HttpMethod.GET, "/bookings/my").hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/bookings/*/status").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/bookings/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/bookings").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/bookings").hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/bookings/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/bookings/**").hasAnyRole("USER", "ADMIN")

                // Tickets - more specific paths FIRST
                // Get all tickets (admin only)
                .requestMatchers(HttpMethod.GET, "/api/v1/tickets").hasRole("ADMIN")
                // Get tickets by status filter (admin only)
                .requestMatchers(HttpMethod.GET, "/api/v1/tickets/by-status").hasRole("ADMIN")
                // Get my reported tickets (any authenticated user)
                .requestMatchers(HttpMethod.GET, "/api/v1/tickets/my").authenticated()
                // Get assigned tickets (technician)
                .requestMatchers(HttpMethod.GET, "/api/v1/tickets/assigned").hasRole("TECHNICIAN")
                // Get open tickets (any authenticated user)
                .requestMatchers(HttpMethod.GET, "/api/v1/tickets/open").authenticated()
                // Search tickets by keyword (any authenticated user)
                .requestMatchers(HttpMethod.GET, "/api/v1/tickets/search").authenticated()
                // Create ticket (any authenticated user)
                .requestMatchers(HttpMethod.POST, "/api/v1/tickets").authenticated()
                // Get single ticket (any authenticated user)
                .requestMatchers(HttpMethod.GET, "/api/v1/tickets/*").authenticated()
                // Update ticket status (admin or technician)
                .requestMatchers(HttpMethod.PATCH, "/api/v1/tickets/*/status").hasAnyRole("ADMIN", "TECHNICIAN")
                // Assign technician (admin only)
                .requestMatchers(HttpMethod.PATCH, "/api/v1/tickets/*/assign").hasRole("ADMIN")
                // Update assignment and status together (admin only)
                .requestMatchers(HttpMethod.PATCH, "/api/v1/tickets/*/workflow").hasRole("ADMIN")
                // Delete ticket (admin only)
                .requestMatchers(HttpMethod.DELETE, "/api/v1/tickets/*").hasRole("ADMIN")

                // Attachments (all authenticated)
                .requestMatchers(HttpMethod.GET, "/api/v1/tickets/*/attachments").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/v1/tickets/*/attachments").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/v1/tickets/*/attachments/*").authenticated()

                // Comments (all authenticated)
                .requestMatchers(HttpMethod.GET, "/api/v1/tickets/*/comments").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/v1/tickets/*/comments").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/v1/tickets/*/comments/*").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/v1/tickets/*/comments/*").authenticated()

                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
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
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
