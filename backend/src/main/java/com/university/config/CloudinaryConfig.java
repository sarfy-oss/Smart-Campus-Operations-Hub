package com.university.config;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cloudinary configuration for Spring Boot.
 * Credentials are loaded from CLOUDINARY_URL environment variable.
 */
@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.url:}")
    private String cloudinaryUrl;

    @Bean
    public Cloudinary cloudinary() {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) {
            throw new IllegalArgumentException(
                "CLOUDINARY_URL environment variable is not set. " +
                "Please configure Cloudinary credentials."
            );
        }
        return new Cloudinary(cloudinaryUrl);
    }
}
