package com.university.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for marking a ticket as RESOLVED with resolution notes.
 * Used by TECHNICIAN only.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolveTicketRequest {

    @NotBlank(message = "Resolution notes are required")
    private String resolutionNotes;
}
