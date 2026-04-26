package com.university.config;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
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
    @ConditionalOnProperty(name = "cloudinary.url")
    public Cloudinary cloudinary() {
        return new Cloudinary(cloudinaryUrl);
    }
}
