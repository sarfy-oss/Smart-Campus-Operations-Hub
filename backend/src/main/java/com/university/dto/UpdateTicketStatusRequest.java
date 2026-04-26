package com.university.dto;

import com.university.entity.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating a ticket's status.
 * Used by ADMIN and TECHNICIAN to change ticket workflow state.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTicketStatusRequest {

    @NotNull(message = "Status is required")
    private TicketStatus status;

    // Rejection reason (required if status == REJECTED)
    private String rejectionReason;
}
