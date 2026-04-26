package com.university.dto;

import com.university.entity.TicketCategory;
import com.university.entity.TicketPriority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a new incident ticket.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTicketRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Category is required")
    private TicketCategory category;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    // Link to a resource (optional)
    private String resourceId;

    // Free-text location fallback
    private String locationText;

    @NotBlank(message = "Contact name is required")
    private String contactName;

    @Email(message = "Contact email must be valid")
    @NotBlank(message = "Contact email is required")
    private String contactEmail;
}
