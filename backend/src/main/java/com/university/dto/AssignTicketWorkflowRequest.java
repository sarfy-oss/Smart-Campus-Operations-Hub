package com.university.dto;

import com.university.entity.TicketStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for assigning a technician and updating the ticket status in one action.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignTicketWorkflowRequest {

    @NotBlank(message = "Technician ID is required")
    private String technicianId;

    @NotNull(message = "Status is required")
    private TicketStatus status;

    private String rejectionReason;
}