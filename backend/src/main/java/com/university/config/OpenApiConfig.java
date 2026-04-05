package com.university.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Smart Campus Operations Hub API")
                        .description("REST API for managing campus resources, users, authentication, and notifications.\n\n" +
                                     "**How to authenticate:**\n" +
                                     "1. Use `POST /auth/login` with `{ \"username\": \"admin\", \"password\": \"admin123\" }`\n" +
                                     "2. Copy the `token` from the response\n" +
                                     "3. Click **Authorize** above and enter: `Bearer <token>`")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Smart Campus Team")
                                .email("admin@smartcampus.edu")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter your JWT token. Obtain it from POST /auth/login")));
    }
}
